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
MIN_CAPTURE_SECONDS = 30
MIN_VISIBLE_HOST_SAMPLES = 20
MIN_FOREGROUND_BROWSER_SAMPLES = 2
MIN_FOREGROUND_BROWSER_COVERAGE = 0.75
MAX_FOREGROUND_BROWSER_GAP_SECONDS = 5.0


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
    # Timer heartbeats can continue when requestAnimationFrame has frozen.
    # Cached FPS during stale rendering is not a new rendered-frame measurement.
    stale_foreground_browser = [r for r in foreground_browser
                                if (age := number(r.get('renderAgeMs'))) is not None and age >= STALE_MS]
    # A heartbeat without a valid render age cannot prove that the reported
    # FPS describes new frames. Keep it for diagnostics, not FPS statistics.
    unknown_render_age_browser = [r for r in foreground_browser
                                  if (age := number(r.get('renderAgeMs'))) is None or age < 0]
    fresh_foreground_browser = [r for r in foreground_browser
                                if (age := number(r.get('renderAgeMs'))) is not None
                                and 0 <= age < STALE_MS]
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
    def timestamp(row):
        try:
            return datetime.fromisoformat(row['timestampUTC'].replace('Z', '+00:00'))
        except (ValueError, AttributeError, TypeError):
            return None

    times = [t for row in rows if (t := timestamp(row)) is not None]
    duration = round((max(times) - min(times)).total_seconds(), 2) if len(times) > 1 else None
    foreground_times = sorted(t for row in foreground_browser if (t := timestamp(row)) is not None)
    # A freeze in the middle can leave the first and last browser heartbeat
    # far apart, falsely passing a span-only 75% coverage test.
    foreground_gaps = [(b - a).total_seconds() for a, b in zip(foreground_times, foreground_times[1:])]
    max_foreground_gap = round(max(foreground_gaps), 2) if foreground_gaps else None
    foreground_span = ((max(foreground_times) - min(foreground_times)).total_seconds()
                       if len(foreground_times) > 1 else 0)
    browser_coverage = (round(foreground_span / duration, 3)
                        if duration is not None and duration > 0 else None)
    # Independent host samples survive browser freezes. Keep their stall evidence
    # without presenting repeated host FPS values as rendered browser frames.
    quality_issues = []
    if duration is None or duration < MIN_CAPTURE_SECONDS:
        quality_issues.append('Capture shorter than 30 seconds or timestamps invalid.')
    if len(visible_host) < MIN_VISIBLE_HOST_SAMPLES:
        quality_issues.append('Fewer than 20 visible, focused independent host samples.')
    if len(foreground_browser) < MIN_FOREGROUND_BROWSER_SAMPLES:
        quality_issues.append('Fewer than two visible, focused browser heartbeats: FPS distribution insufficient.')
    elif browser_coverage is None or browser_coverage < MIN_FOREGROUND_BROWSER_COVERAGE:
        quality_issues.append('Visible browser heartbeats cover less than 75% of capture: foreground FPS may omit a prolonged freeze.')
    if max_foreground_gap is not None and max_foreground_gap > MAX_FOREGROUND_BROWSER_GAP_SECONDS:
        quality_issues.append('Visible browser heartbeat gap exceeds 5 seconds: foreground FPS may omit a mid-capture freeze.')
    if stale_foreground_browser:
        quality_issues.append('Visible browser heartbeats report stale rendering: foreground FPS may repeat frozen frames.')
    if unknown_render_age_browser:
        quality_issues.append('Visible browser heartbeats lack valid render age: foreground FPS cannot be authenticated.')
    host_cpu_samples = sum(number(r.get('cpuPercent')) is not None for r in visible_host)
    host_ram_samples = sum(number(r.get('ramPercent')) is not None for r in visible_host)
    capture_quality = {
        'foreground_fps_usable': not quality_issues,
        'foreground_browser_coverage_fraction': browser_coverage,
        'max_foreground_browser_gap_seconds': max_foreground_gap,
        'foreground_browser_stale_render_samples': len(stale_foreground_browser),
        'foreground_browser_unknown_render_age_samples': len(unknown_render_age_browser),
        'foreground_browser_fresh_render_samples': len(fresh_foreground_browser),
        'host_stall_evidence_available': len(visible_host) >= MIN_VISIBLE_HOST_SAMPLES,
        'host_cpu_ram_usable': (duration is not None and duration >= MIN_CAPTURE_SECONDS
                                and host_cpu_samples >= MIN_VISIBLE_HOST_SAMPLES
                                and host_ram_samples >= MIN_VISIBLE_HOST_SAMPLES),
        'visible_host_cpu_samples': host_cpu_samples,
        'visible_host_ram_samples': host_ram_samples,
        'issues': quality_issues,
    }
    # A heartbeat can continue reporting a cached downscale while rAF is frozen.
    # Require fresh rendering plus the actual WebGL buffer dimensions and a
    # positive governor adjustment before calling recovery observed. Host rows
    # and old CSVs with missing telemetry cannot establish a downscale.
    fresh_render_browser = fresh_foreground_browser
    recovery_rows = []
    for row in fresh_render_browser:
        scale = number(row.get('adaptiveResolution'))
        adjustment = number(row.get('adaptiveAdjustments'))
        width = number(row.get('framebufferWidth'))
        height = number(row.get('framebufferHeight'))
        if (scale is not None and 0 < scale <= 1 and
                adjustment is not None and adjustment >= 0 and
                width is not None and width > 0 and
                height is not None and height > 0):
            recovery_rows.append((scale, adjustment, width * height))
    scales = [scale for scale, _, _ in recovery_rows]
    adjustments = [adjustment for _, adjustment, _ in recovery_rows]
    buffer_pixels = [pixels for _, _, pixels in recovery_rows]
    framebuffer_recovery = {
        'fresh_render_browser_samples': len(fresh_render_browser),
        'stale_or_unknown_render_samples_excluded': len(foreground_browser) - len(fresh_render_browser),
        'complete_recovery_samples': len(recovery_rows),
        'foreground_scale_samples': len(scales),
        'minimum_scale': min(scales) if scales else None,
        'maximum_adjustments': int(max(adjustments)) if adjustments else None,
        'median_buffer_pixels': round(statistics.median(buffer_pixels)) if buffer_pixels else None,
        'downscale_observed': any(scale < .999 and adjustment >= 1
                                  for scale, adjustment, _ in recovery_rows) if recovery_rows else None,
    }
    findings = []
    findings.extend(quality_issues)
    if framebuffer_recovery['downscale_observed'] is True:
        findings.append('Adaptive framebuffer downscale observed with fresh render telemetry and actual buffer dimensions; this does not establish an FPS gain.')
    elif framebuffer_recovery['downscale_observed'] is None:
        findings.append('No complete fresh-render framebuffer telemetry: cannot determine whether adaptive downscaling occurred.')
    if not active_browser:
        findings.append('No active browser heartbeat samples: FPS cannot be evaluated.')
    if not foreground_browser:
        findings.append('No visible, focused browser heartbeat samples: foreground FPS unavailable.')
    if background_browser:
        findings.append('Hidden/unfocused browser samples excluded from foreground FPS statistics.')
    if stale_foreground_browser:
        findings.append('Browser heartbeat kept reporting during a render freeze; cached FPS is not a new rendered frame.')
    if unknown_render_age_browser:
        findings.append('Browser heartbeat has unknown/invalid render age; cached FPS excluded from foreground statistics.')
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
        'source': str(path), 'duration_seconds': duration, 'capture_quality': capture_quality,
        'framebuffer_recovery': framebuffer_recovery,
        'samples': {'total': len(rows), 'browser': len(browser), 'host': len(host),
                    'active_browser': len(active_browser), 'foreground_browser': len(foreground_browser),
                    'foreground_browser_render_stale': len(stale_foreground_browser),
                    'foreground_browser_render_age_unknown': len(unknown_render_age_browser),
                    'background_browser': len(background_browser),
                    'unknown_browser_visibility': unknown_browser_visibility,
                    'active_host': len(active_host),
                    'visible_focused_host': len(visible_host), 'hidden_or_unfocused_host': len(hidden_host)},
        'browser_active': {'median_fps': median(active_browser, 'fps'),
                           'p10_fps': percentile(active_browser, 'fps', .10),
                           'p95_frame_ms': percentile(active_browser, 'frameMs', .95),
                           'median_draw_calls': median(active_browser, 'drawCalls')},
        'browser_foreground': {'median_fps': median(fresh_foreground_browser, 'fps'),
                               'p10_fps': percentile(fresh_foreground_browser, 'fps', .10),
                               'p95_frame_ms': percentile(fresh_foreground_browser, 'frameMs', .95),
                               'median_draw_calls': median(fresh_foreground_browser, 'drawCalls')},
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
        print('Capture quality:', report['capture_quality'])
        print('Framebuffer recovery:', report['framebuffer_recovery'])
        print('Foreground browser FPS median/p10:', report['browser_foreground']['median_fps'], '/', report['browser_foreground']['p10_fps'])
        print('All active browser FPS median/p10 (includes background):', report['browser_active']['median_fps'], '/', report['browser_active']['p10_fps'])
        print('Active browser frame p95 ms / median draw calls:', report['browser_active']['p95_frame_ms'], '/', report['browser_active']['median_draw_calls'])
        print('System CPU/RAM median %:', report['host_active']['median_system_cpu_percent'], '/', report['host_active']['median_system_ram_percent'])
        print('Foreground stalls:', report['foreground_stall_samples'])
        for finding in report['findings']:
            print('- ' + finding)


if __name__ == '__main__':
    main()
