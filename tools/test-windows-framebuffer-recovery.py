#!/usr/bin/env python3
"""Regression controls for RC58 Windows framebuffer recovery evidence.

Run: python tools/test-windows-framebuffer-recovery.py
"""
import csv
from datetime import datetime, timedelta, timezone
import importlib.util
from pathlib import Path
import tempfile

MODULE = Path(__file__).with_name('analyze-windows-performance.py')
spec = importlib.util.spec_from_file_location('windows_analyzer', MODULE)
analyzer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analyzer)


def capture(browser_scale, render_age, adjustments, width, height):
    start = datetime(2026, 11, 14, tzinfo=timezone.utc)
    rows = []
    for second in range(40):
        common = dict(timestampUTC=(start + timedelta(seconds=second)).isoformat(),
                      telemetryAgeMs=100, documentHidden='false', documentHasFocus='true',
                      active='true', fps=24, frameMs=42, drawCalls=700,
                      cpuPercent=35, ramPercent=42)
        rows.append(dict(common, sampleSource='host', renderAgeMs=render_age))
        rows.append(dict(common, sampleSource='browser', renderAgeMs=render_age,
                         adaptiveResolution=browser_scale, adaptiveAdjustments=adjustments,
                         framebufferWidth=width, framebufferHeight=height))
    with tempfile.TemporaryDirectory() as folder:
        file = Path(folder) / 'capture.csv'
        with file.open('w', newline='') as stream:
            fields = sorted(set().union(*(r.keys() for r in rows)))
            writer = csv.DictWriter(stream, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)
        return analyzer.summarize(file)


def main():
    stale = capture(.65, 9000, 3, 640, 360)
    assert stale['framebuffer_recovery']['downscale_observed'] is None
    assert stale['framebuffer_recovery']['stale_or_unknown_render_samples_excluded'] == 40
    assert not stale['capture_quality']['foreground_fps_usable']
    assert stale['browser_foreground']['median_fps'] is None
    fresh = capture(.65, 100, 3, 640, 360)
    assert fresh['framebuffer_recovery']['downscale_observed'] is True
    assert fresh['framebuffer_recovery']['median_buffer_pixels'] == 230400
    assert fresh['capture_quality']['foreground_fps_usable']
    assert fresh['browser_foreground']['median_fps'] == 24
    normal = capture(1, 100, 0, 1280, 720)
    assert normal['framebuffer_recovery']['downscale_observed'] is False
    missing = capture(.65, 100, '', '', '')
    assert missing['framebuffer_recovery']['downscale_observed'] is None
    assert missing['framebuffer_recovery']['complete_recovery_samples'] == 0
    unknown = capture(.65, '', 3, 640, 360)
    assert unknown['browser_foreground']['median_fps'] is None
    assert not unknown['capture_quality']['foreground_fps_usable']
    assert unknown['capture_quality']['foreground_browser_unknown_render_age_samples'] == 40
    assert unknown['framebuffer_recovery']['downscale_observed'] is None
    negative = capture(.65, -100, 3, 640, 360)
    assert negative['browser_foreground']['median_fps'] is None
    assert not negative['capture_quality']['foreground_fps_usable']
    print('PASS: stale, fresh, normal, incomplete, unknown and negative render age')


if __name__ == '__main__':
    main()
