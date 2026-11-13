#!/usr/bin/env python3
"""Diagnose Windows Performance Lab CSV without confusing host samples with frames.

Stdlib only. The host keeps sampling during browser stalls; its repeated FPS
value is NOT a new browser frame. No GPU utilization or GPU timing is measured.
"""
import argparse
import csv
from datetime import datetime
import json
import math
from pathlib import Path
import statistics

REQUIRED = {'timestampUTC', 'sampleSource', 'telemetryAgeMs', 'renderAgeMs',
            'documentHidden', 'documentHasFocus', 'active', 'fps', 'frameMs',
            'drawCalls', 'cpuPercent', 'ramPercent'}
STALE_MS = 3000
FRESH_HEARTBEAT_MS = 2500


def number(value):
    try:
        result = float(value)
        return result if math.isfinite(result) else None
    except (ValueError, TypeError):
        return None


def truth(value):
    value = str(value).strip().lower()
    if value in ('true', '1'):
        return True
    if value in ('false', '0'):
        return False
    return None


def median(rows, key):
    values = [n for row in rows if (n := number(row.get(key))) is not None]
    return round(statistics.median(values), 2) if values else None


def percentile(rows, key, fraction):
    values = sorted(n for row in rows if (n := number(row.get(key))) is not None)
    return round(values[max(0, math.ceil(len(values) * fraction) - 1)], 2) if values else None


def summarize(path):
    with Path(path).open(newline='', encoding='utf-8-sig') as stream:
        reader = csv.DictReader(stream)
        missing = REQUIRED - set(reader.fieldnames or ())
        if missing:
            raise ValueError('Missing Windows Performance Lab CSV columns: ' + ', '.join(sorted(missing)))
        rows = list(reader)
    if not rows:
        raise ValueError('CSV contains no telemetry samples')
    for row in rows:
        if row['sampleSource'] not in ('host', 'browser'):
            raise ValueError('Unknown sampleSource: ' + repr(row['sampleSource']))
    browser = [r for r in rows if r['sampleSource'] == 'browser']
    host = [r for r in rows if r['sampleSource'] == 'host']
    active_browser = [r for r in browser if truth(r.get('active')) is True]
    active_host = [r for r in host if truth(r.get('active')) is True]
    foreground_browser = [r for r in active_browser if truth(r.get('documentHidden')) is False
                          and truth(r.get('documentHasFocus')) is True]
    background_browser = [r for r in active_browser if truth(r.get('documentHidden')) is True
                          or truth(r.get('documentHasFocus')) is False]
    unknown_browser_visibility = len(active_browser) - len(foreground_browser) - len(background_browser)
    visible_host = [r for r in active_host if truth(r.get('documentHidden')) is False
                    and truth(r.get('documentHasFocus')) is True]
    hidden_host = [r for r in active_host if truth(r.get('documentHidden')) is True
                   or truth(r.get('documentHasFocus')) is False]
    stalled_render = [r for r in visible_host if (number(r.get('renderAgeMs')) or 0) >= STALE_MS]
    live_heartbeat_stall = [r for r in stalled_render if number(r.get('telemetryAgeMs')) is not None
                            and number(r.get('telemetryAgeMs')) < FRESH_HEARTBEAT_MS]
    stale_heartbeat_stall = [r for r in stalled_render if (number(r.get('telemetryAgeMs')) or 0) >= STALE_MS]
    times = []
    for row in rows:
        try:
            times.append(datetime.fromisoformat(row['timestampUTC'].replace('Z', '+00:00')))
        except (ValueError, AttributeError):
            pass
    duration = round((max(times) - min(times)).total_seconds(), 2) if len(times) > 1 else None
    findings = []
    if not active_browser:
        findings.append('No active browser heartbeat samples: FPS cannot be evaluated.')
    if not foreground_browser:
        findings.append('No visible, focused browser heartbeat samples: foreground FPS unavailable.')
    if background_browser:
        findings.append('Hidden/unfocused browser samples excluded from foreground FPS statistics.')
    if unknown_browser_visibility:
        findings.append('Browser samples with unknown tab visibility/focus excluded from foreground FPS statistics.')
    if not active_host:
        findings.append('No active independent host samples: browser freezes cannot be distinguished reliably.')
    if not visible_host:
        findings.append('No focused, visible active host samples: foreground stall analysis unavailable.')
    if live_heartbeat_stall:
        findings.append('Visible rendering stale while JS heartbeat fresh: inspect rAF/render loop, not just telemetry.')
    if stale_heartbeat_stall:
        findings.append('Visible rendering and heartbeat both stale: inspect main-thread stalls, tab state and host load.')
    if hidden_host:
        findings.append('Hidden/unfocused host samples excluded from foreground stall counts.')
    findings.append('Browser-reported FPS and whole-system CPU/RAM do not establish a GPU bottleneck; GPU utilization is unmeasured.')
    return {
        'source': str(path), 'duration_seconds': duration,
        'samples': {'total': len(rows), 'browser': len(browser), 'host': len(host),
                    'active_browser': len(active_browser), 'foreground_browser': len(foreground_browser),
                    'background_browser': len(background_browser),
                    'unknown_browser_visibility': unknown_browser_visibility,
                    'active_host': len(active_host),
                    'visible_focused_host': len(visible_host), 'hidden_or_unfocused_host': len(hidden_host)},
        'browser_active': {'median_fps': median(active_browser, 'fps'),
                           'p10_fps': percentile(active_browser, 'fps', .10),
                           'p95_frame_ms': percentile(active_browser, 'frameMs', .95),
                           'median_draw_calls': median(active_browser, 'drawCalls')},
        'browser_foreground': {'median_fps': median(foreground_browser, 'fps'),
                               'p10_fps': percentile(foreground_browser, 'fps', .10),
                               'p95_frame_ms': percentile(foreground_browser, 'frameMs', .95),
                               'median_draw_calls': median(foreground_browser, 'drawCalls')},
        'host_active': {'median_system_cpu_percent': median(active_host, 'cpuPercent'),
                        'median_system_ram_percent': median(active_host, 'ramPercent'),
                        'max_render_age_ms': max((number(r.get('renderAgeMs')) for r in active_host
                                                  if number(r.get('renderAgeMs')) is not None), default=None),
                        'max_heartbeat_age_ms': max((number(r.get('telemetryAgeMs')) for r in active_host
                                                     if number(r.get('telemetryAgeMs')) is not None), default=None)},
        'foreground_stall_samples': {'render_stale': len(stalled_render),
                                     'render_stale_heartbeat_fresh': len(live_heartbeat_stall),
                                     'render_and_heartbeat_stale': len(stale_heartbeat_stall)},
        'findings': findings,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv_file', help='CSV exported from Windows Performance Lab')
    parser.add_argument('--json', action='store_true', help='Print machine-readable JSON')
    args = parser.parse_args()
    try:
        report = summarize(args.csv_file)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print('Dragon Defense Windows Performance Lab diagnostic (not a GPU benchmark)')
        print('Capture seconds:', report['duration_seconds'], 'samples:', report['samples'])
        print('Foreground browser FPS median/p10:', report['browser_foreground']['median_fps'], '/', report['browser_foreground']['p10_fps'])
        print('All active browser FPS median/p10 (includes background):', report['browser_active']['median_fps'], '/', report['browser_active']['p10_fps'])
        print('Active browser frame p95 ms / median draw calls:', report['browser_active']['p95_frame_ms'], '/', report['browser_active']['median_draw_calls'])
        print('System CPU/RAM median %:', report['host_active']['median_system_cpu_percent'], '/', report['host_active']['median_system_ram_percent'])
        print('Foreground stalls:', report['foreground_stall_samples'])
        for finding in report['findings']:
            print('- ' + finding)


if __name__ == '__main__':
    main()
