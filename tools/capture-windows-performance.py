#!/usr/bin/env python3
"""One-command, wall-clock Windows heavy-destruction telemetry capture.

Runs outside the browser event loop, so a stalled game cannot shorten the
capture. Fetches the existing loopback server's CSV and retains ONLY rows
inside the requested window; no remote upload or unsupported GPU estimates.
"""
import argparse
import csv
from datetime import datetime, timezone
import io
import json
from pathlib import Path
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import urlopen
from importlib.util import module_from_spec, spec_from_file_location


def get_json(url):
    with urlopen(url, timeout=5) as response:
        if 'application/json' not in response.headers.get('Content-Type', ''):
            raise ValueError('Not the Dragon Defense local preview server')
        return json.load(response)


def select_window(raw, start, end):
    """Retain actual host/browser rows, including stale host-only freeze periods."""
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    if not reader.fieldnames or 'timestampUTC' not in reader.fieldnames:
        raise ValueError('Performance CSV is missing timestampUTC')
    output = io.StringIO(newline='')
    writer = csv.DictWriter(output, fieldnames=reader.fieldnames, lineterminator='\n')
    writer.writeheader()
    kept = {'browser': 0, 'host': 0}
    for row in reader:
        try:
            t = datetime.fromisoformat(row['timestampUTC'].replace('Z', '+00:00'))
        except (ValueError, TypeError, AttributeError):
            continue
        if t.tzinfo is None:
            continue
        if start <= t <= end:
            writer.writerow(row)
            kind = row.get('sampleSource')
            if kind in kept:
                kept[kind] += 1
    return output.getvalue(), kept


def capture(base, seconds, warmup, output, sleep=time.sleep, now=lambda: datetime.now(timezone.utc)):
    build = get_json(base + '/__build')
    if not build.get('version') or not build.get('build') or not build.get('directory'):
        raise ValueError('Local server does not identify a Dragon Defense build')
    if Path(build['directory']).resolve() != Path(__file__).resolve().parent.parent:
        raise ValueError('Another extracted Dragon Defense preview owns this port; close it and launch PLAY-PREVIEW.cmd from this folder')
    print(f"Connected to {build['version']} / {build['build']}")
    print(f'Switch to the game browser now; capture starts in {warmup} seconds.')
    sleep(warmup)
    start = now()
    print(f'Capturing {seconds} seconds of actual wall time; keep the game visible and cause heavy destruction.')
    sleep(seconds)
    end = now()
    with urlopen(base + '/__system_csv', timeout=20) as response:
        raw = response.read(20 * 1024 * 1024 + 1)
    if len(raw) > 20 * 1024 * 1024:
        raise ValueError('Local CSV exceeds 20 MB safety limit')
    selected, counts = select_window(raw, start, end)
    if not sum(counts.values()):
        raise ValueError('No telemetry within capture window; is the preview server running?')
    output.mkdir(parents=True, exist_ok=True)
    stamp = start.strftime('%Y%m%d-%H%M%S')
    csv_path = output / f'dragon-performance-{stamp}.csv'
    json_path = output / f'dragon-performance-{stamp}.json'
    csv_path.write_text(selected, encoding='utf-8')
    spec = spec_from_file_location('dd_analyzer', Path(__file__).with_name('analyze-windows-performance.py'))
    analyzer = module_from_spec(spec)
    spec.loader.exec_module(analyzer)
    report = analyzer.summarize(csv_path)
    payload = {'build': build, 'window_start_utc': start.isoformat(), 'window_end_utc': end.isoformat(),
               'requested_seconds': seconds, 'actual_wall_seconds': round((end-start).total_seconds(), 2),
               'rows': counts, 'analysis': report,
               'limitations': 'Physical Windows capture only. GPU timing/utilization not measured; stale browser FPS is not actual rendered frames.'}
    json_path.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print('Saved CSV:', csv_path.resolve())
    print('Saved analysis:', json_path.resolve())
    print('Foreground FPS usable:', report['capture_quality']['foreground_fps_usable'])
    print('Foreground FPS median:', report['browser_foreground']['median_fps'])
    print('Framebuffer downscale observed:', report['framebuffer_recovery']['downscale_observed'])
    for issue in report['capture_quality']['issues']:
        print('Capture warning:', issue)
    return payload


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--seconds', type=int, default=60)
    p.add_argument('--warmup', type=int, default=10)
    p.add_argument('--port', type=int, default=8769)
    p.add_argument('--output', type=Path, default=Path('performance-captures'))
    args = p.parse_args()
    if not 30 <= args.seconds <= 120 or not 0 <= args.warmup <= 60 or not 1 <= args.port <= 65535:
        p.error('seconds must be 30–120, warmup 0–60 and port 1–65535')
    try:
        capture(f'http://127.0.0.1:{args.port}', args.seconds, args.warmup, args.output)
    except (HTTPError, URLError, OSError, ValueError, json.JSONDecodeError) as e:
        print('Capture failed:', e, file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
