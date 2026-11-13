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

    def test_missing_columns_rejected(self):
        self.write([], ['timestampUTC', 'sampleSource'])
        with self.assertRaisesRegex(ValueError, 'Missing Windows Performance Lab CSV columns'):
            analyzer.summarize(self.path)

    def test_empty_capture_rejected(self):
        self.write([])
        with self.assertRaisesRegex(ValueError, 'no telemetry samples'):
            analyzer.summarize(self.path)


if __name__ == '__main__':
    unittest.main()
