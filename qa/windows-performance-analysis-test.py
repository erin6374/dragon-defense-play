#!/usr/bin/env python3
"""Synthetic Windows CSV analyzer regressions; no GPU or Windows host required."""
import csv
import importlib.util
from pathlib import Path
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('analyzer', HERE.parent / 'tools' / 'analyze-windows-performance.py')
analyzer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(analyzer)
COLUMNS = ['timestampUTC', 'sampleSource', 'telemetryAgeMs', 'renderAgeMs',
           'documentHidden', 'documentHasFocus', 'active', 'fps', 'frameMs',
           'drawCalls', 'cpuPercent', 'ramPercent']


class AnalyzerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / 'performance.csv'

    def write(self, rows, columns=COLUMNS):
        with self.path.open('w', newline='', encoding='utf-8') as stream:
            writer = csv.DictWriter(stream, fieldnames=columns)
            writer.writeheader()
            writer.writerows(rows)

    def row(self, source, second, **updates):
        row = dict(timestampUTC=f'2026-11-13T05:00:{second:02d}+00:00', sampleSource=source,
                   telemetryAgeMs='0', renderAgeMs='100', documentHidden='false',
                   documentHasFocus='true', active='true', fps='30', frameMs='33',
                   drawCalls='350', cpuPercent='70', ramPercent='65')
        row.update(updates)
        return row

    def test_visible_render_freeze_with_fresh_heartbeat(self):
        self.write([self.row('browser', 0), self.row('host', 2, telemetryAgeMs='100', renderAgeMs='5100'),
                    self.row('host', 4, telemetryAgeMs='5000', renderAgeMs='7100')])
        report = analyzer.summarize(self.path)
        self.assertEqual(report['foreground_stall_samples']['render_stale_heartbeat_fresh'], 1)
        self.assertEqual(report['foreground_stall_samples']['render_and_heartbeat_stale'], 1)
        self.assertEqual(report['browser_active']['median_fps'], 30)

    def test_hidden_host_excluded(self):
        self.write([self.row('browser', 0), self.row('host', 2, renderAgeMs='6000', documentHidden='true')])
        report = analyzer.summarize(self.path)
        self.assertEqual(report['foreground_stall_samples']['render_stale'], 0)
        self.assertEqual(report['samples']['hidden_or_unfocused_host'], 1)

    def test_host_fps_not_counted_as_rendered_frame(self):
        self.write([self.row('browser', 0, fps='12'), self.row('host', 2, fps='999')])
        self.assertEqual(analyzer.summarize(self.path)['browser_active']['median_fps'], 12)

    def test_missing_windows_counters_not_zero(self):
        self.write([self.row('browser', 0, cpuPercent='', ramPercent=''),
                    self.row('host', 2, cpuPercent='', ramPercent='')])
        report = analyzer.summarize(self.path)
        self.assertIsNone(report['host_active']['median_system_cpu_percent'])
        self.assertIsNone(report['host_active']['median_system_ram_percent'])

    def test_foreground_fps_excludes_hidden_and_unfocused_browser_samples(self):
        self.write([self.row('browser', 0, fps='60'),
                    self.row('browser', 1, fps='1', documentHidden='true'),
                    self.row('browser', 2, fps='10', documentHasFocus='false')])
        report = analyzer.summarize(self.path)
        self.assertEqual(report['browser_foreground']['median_fps'], 60)
        self.assertEqual(report['browser_active']['median_fps'], 10)
        self.assertEqual(report['samples']['background_browser'], 2)

    def test_unknown_visibility_not_assumed_foreground(self):
        self.write([self.row('browser', 0, fps='30', documentHidden=''),
                    self.row('browser', 1, fps='60')])
        report = analyzer.summarize(self.path)
        self.assertEqual(report['samples']['unknown_browser_visibility'], 1)
        self.assertEqual(report['browser_foreground']['median_fps'], 60)

    def test_missing_columns_rejected(self):
        self.write([], ['timestampUTC', 'sampleSource'])
        with self.assertRaisesRegex(ValueError, 'Missing Windows Performance Lab CSV columns'):
            analyzer.summarize(self.path)

    def test_empty_capture_rejected(self):
        self.write([])
        with self.assertRaisesRegex(ValueError, 'no telemetry samples'):
            analyzer.summarize(self.path)


    def test_quality_valid_40_second_capture(self):
        rows = [self.row('host', i) for i in range(40)]
        rows += [self.row('browser', i) for i in range(0, 40, 5)]
        self.write(rows)
        quality = analyzer.summarize(self.path)['capture_quality']
        self.assertTrue(quality['foreground_fps_usable'])
        self.assertTrue(quality['host_stall_evidence_available'])
        self.assertTrue(quality['host_cpu_ram_usable'])
        self.assertEqual(quality['issues'], [])

    def test_quality_rejects_short_capture(self):
        self.write([self.row('host', i) for i in range(12)] +
                   [self.row('browser', i) for i in range(0, 12, 5)])
        quality = analyzer.summarize(self.path)['capture_quality']
        self.assertFalse(quality['foreground_fps_usable'])
        self.assertIn('Capture shorter than 30 seconds or timestamps invalid.', quality['issues'])

    def test_quality_preserves_host_only_stall_evidence(self):
        self.write([self.row('host', i, renderAgeMs='8000', telemetryAgeMs='8000')
                    for i in range(40)])
        quality = analyzer.summarize(self.path)['capture_quality']
        self.assertFalse(quality['foreground_fps_usable'])
        self.assertTrue(quality['host_stall_evidence_available'])
        self.assertTrue(quality['host_cpu_ram_usable'])

    def test_quality_excludes_hidden_host_samples_and_missing_counters(self):
        self.write([self.row('host', i, documentHidden='true',
                             cpuPercent='', ramPercent='') for i in range(40)])
        quality = analyzer.summarize(self.path)['capture_quality']
        self.assertFalse(quality['foreground_fps_usable'])
        self.assertFalse(quality['host_stall_evidence_available'])
        self.assertFalse(quality['host_cpu_ram_usable'])

    def test_quality_rejects_early_browser_freeze_despite_two_heartbeats(self):
        # Host samples continue after browser heartbeats stop; two early FPS
        # samples must not certify a 40-second capture as representative.
        rows = [self.row('host', i, renderAgeMs='8000' if i >= 3 else '100',
                         telemetryAgeMs='8000' if i >= 3 else '0')
                for i in range(40)]
        rows += [self.row('browser', 0), self.row('browser', 1)]
        self.write(rows)
        report = analyzer.summarize(self.path)
        quality = report['capture_quality']
        self.assertFalse(quality['foreground_fps_usable'])
        self.assertLess(quality['foreground_browser_coverage_fraction'], .75)
        self.assertTrue(quality['host_stall_evidence_available'])
        self.assertGreater(report['foreground_stall_samples']['render_and_heartbeat_stale'], 0)

if __name__ == '__main__':
    unittest.main()
