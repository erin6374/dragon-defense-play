#!/usr/bin/env python3
"""Synthetic exact-window and freeze-preservation regression tests."""
import csv
from datetime import datetime, timedelta, timezone
from importlib.util import module_from_spec, spec_from_file_location
import io
from unittest.mock import patch
from pathlib import Path
import tempfile
import threading
import unittest
from urllib.request import urlopen
from urllib.error import HTTPError
from urllib.parse import urlencode

spec = spec_from_file_location('dd_capture', Path(__file__).with_name('capture-windows-performance.py'))
capture = module_from_spec(spec)
spec.loader.exec_module(capture)


class CaptureTests(unittest.TestCase):
    def test_exact_window_preserves_host_freeze_and_excludes_old_session(self):
        base = datetime(2026, 11, 14, 15, 0, tzinfo=timezone.utc)
        columns = ['timestampUTC', 'sampleSource', 'fps', 'renderAgeMs', 'telemetryAgeMs',
                   'documentHidden', 'documentHasFocus', 'active', 'frameMs', 'drawCalls',
                   'cpuPercent', 'ramPercent', 'adaptiveResolution', 'adaptiveAdjustments',
                   'framebufferWidth', 'framebufferHeight']
        out = io.StringIO(); writer = csv.DictWriter(out, fieldnames=columns); writer.writeheader()
        for sec in range(-120, 63):
            if sec % 2:
                continue
            stale = 20 <= sec <= 42
            row = dict(timestampUTC=(base+timedelta(seconds=sec)).isoformat(),
                       sampleSource='host', fps='15', renderAgeMs='8000' if stale else '200',
                       telemetryAgeMs='8000' if stale else '200', documentHidden='false',
                       documentHasFocus='true', active='true', frameMs='66', drawCalls='400',
                       cpuPercent='65', ramPercent='70', adaptiveResolution='0.65',
                       adaptiveAdjustments='2', framebufferWidth='800', framebufferHeight='450')
            writer.writerow(row)
            if not stale and sec % 2 == 0:
                writer.writerow({**row, 'sampleSource': 'browser', 'renderAgeMs': '50', 'telemetryAgeMs': '0'})
        selected, counts = capture.select_window(out.getvalue().encode(), base, base+timedelta(seconds=60))
        self.assertEqual(counts['host'], 31)
        self.assertEqual(counts['browser'], 19)
        self.assertNotIn('2026-11-14T14:58', selected)
        with tempfile.TemporaryDirectory() as td:
            path = Path(td)/'capture.csv';path.write_text(selected)
            analyzer_spec = spec_from_file_location('dd_analyzer', Path(__file__).with_name('analyze-windows-performance.py'))
            analyzer = module_from_spec(analyzer_spec)
            analyzer_spec.loader.exec_module(analyzer)
            result = analyzer.summarize(path)
            self.assertFalse(result['capture_quality']['foreground_fps_usable'])
            self.assertTrue(result['capture_quality']['host_stall_evidence_available'])
            self.assertGreater(result['foreground_stall_samples']['render_and_heartbeat_stale'], 0)

    def test_capture_end_to_end_writes_scoped_csv_and_analysis(self):
        base = datetime(2026, 11, 14, 15, 0, tzinfo=timezone.utc)
        fields = ['timestampUTC', 'sampleSource', 'telemetryAgeMs', 'renderAgeMs',
                  'documentHidden', 'documentHasFocus', 'active', 'fps', 'frameMs',
                  'drawCalls', 'cpuPercent', 'ramPercent', 'adaptiveResolution',
                  'adaptiveAdjustments', 'framebufferWidth', 'framebufferHeight']
        buf = io.StringIO(); writer = csv.DictWriter(buf, fieldnames=fields);writer.writeheader()
        for second in range(-10, 65):
            if second % 2:
                continue
            row = dict(timestampUTC=(base+timedelta(seconds=second)).isoformat(),
                       sampleSource='host', telemetryAgeMs='0', renderAgeMs='50',
                       documentHidden='false', documentHasFocus='true', active='true',
                       fps='22', frameMs='45', drawCalls='400', cpuPercent='45',
                       ramPercent='62', adaptiveResolution='0.75', adaptiveAdjustments='1',
                       framebufferWidth='960', framebufferHeight='540')
            writer.writerow(row)
            writer.writerow({**row, 'sampleSource':'browser'})
        with tempfile.TemporaryDirectory() as td:
            build = {'version':'5.5.0-rc.59', 'build':'test',
                     'directory':str(Path(capture.__file__).resolve().parent.parent)}
            clock = iter([base,base+timedelta(seconds=60)])
            with patch.object(capture, 'get_json', return_value=build), \
                 patch.object(capture, 'urlopen', return_value=io.BytesIO(buf.getvalue().encode())):
                result = capture.capture('http://127.0.0.1:8769',60,0,Path(td),
                                         sleep=lambda _:None,now=lambda:next(clock))
            self.assertEqual(result['rows']['host'],31)
            self.assertEqual(result['rows']['browser'],31)
            self.assertTrue(result['analysis']['capture_quality']['foreground_fps_usable'])
            self.assertEqual(len(list(Path(td).glob('*.csv'))),1)
            self.assertEqual(len(list(Path(td).glob('*.json'))),1)

    def test_server_scoped_csv_excludes_long_prior_session(self):
        server_spec = spec_from_file_location('dd_server', Path(__file__).with_name('windows-preview-server.py'))
        server_module = module_from_spec(server_spec)
        server_spec.loader.exec_module(server_module)
        base = datetime(2026, 11, 14, 15, 0, tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            log = root / 'test.csv'
            server = server_module.PreviewServer(('127.0.0.1', 0), root=root, log_path=log)
            server.next_host_sample = float('inf')
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                # Old data can be arbitrarily large; the scoped response must
                # contain only the requested 60-second capture.
                for second in [-7200, -120, 0, 30, 60, 120]:
                    server.write_row({'timestampUTC': (base + timedelta(seconds=second)).isoformat(),
                                      'sampleSource': 'host'})
                query = urlencode({'since': base.isoformat(),
                                   'until': (base + timedelta(seconds=60)).isoformat()})
                url = f'http://127.0.0.1:{server.server_port}/__system_csv?{query}'
                with urlopen(url) as response:
                    data = response.read().decode()
                selected = list(csv.DictReader(io.StringIO(data)))
                self.assertEqual(len(selected), 3)
                self.assertTrue(all(base <= datetime.fromisoformat(row['timestampUTC'])
                                    <= base + timedelta(seconds=60) for row in selected))
                with urlopen(f'http://127.0.0.1:{server.server_port}/__system_csv') as response:
                    self.assertEqual(len(list(csv.DictReader(io.StringIO(response.read().decode())))), 6)
                with self.assertRaises(HTTPError) as error:
                    urlopen(f'http://127.0.0.1:{server.server_port}/__system_csv?since=bad&until=bad')
                self.assertEqual(error.exception.code, 400)
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=3)

    def test_bad_and_naive_timestamps_rejected(self):
        raw = b'timestampUTC,sampleSource\ninvalid,browser\n2026-11-14T15:00:01,host\n'
        start = datetime(2026,11,14,15,tzinfo=timezone.utc)
        data,counts = capture.select_window(raw,start,start+timedelta(seconds=60))
        self.assertEqual(counts,{'browser':0,'host':0})
        self.assertEqual(len(data.splitlines()),1)


if __name__ == '__main__':
    unittest.main()
