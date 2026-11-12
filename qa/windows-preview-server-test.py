"""Stdlib integration checks for the packaged Windows preview server."""
import csv
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import threading
import time
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

SCRIPT = Path(__file__).resolve().parents[1] / 'tools' / 'windows-preview-server.py'
spec = importlib.util.spec_from_file_location('dragon_preview', SCRIPT)
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


class PreviewServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        root = Path(cls.tmp.name)
        (root / 'build-info.json').write_text(json.dumps({'version': 'test', 'build': 'test-build'}))
        (root / 'index.html').write_text('local game fixture')
        cls.server = preview.PreviewServer(('127.0.0.1', 0), root=root,
                                           log_path=root / 'test-telemetry.csv')
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)
        cls.tmp.cleanup()

    def get(self, path):
        with urlopen(self.url + path, timeout=5) as response:
            return response.status, response.headers, response.read()

    def post(self, body, origin=None):
        headers = {'Content-Type': 'application/json'}
        if origin:
            headers['Origin'] = origin
        request = Request(self.url + '/__game_telemetry', body,
                          headers=headers, method='POST')
        with urlopen(request, timeout=5) as response:
            return response.status, json.load(response)

    def test_build_and_static_files(self):
        status, headers, raw = self.get('/__build')
        self.assertEqual(status, 200)
        self.assertEqual(headers['Cache-Control'], 'no-store')
        build = json.loads(raw)
        self.assertEqual(build['version'], 'test')
        self.assertEqual(build['build'], 'test-build')
        self.assertTrue(build['directory'])
        self.assertEqual(self.get('/index.html')[2], b'local game fixture')

    def test_system_metrics_do_not_invent_gpu(self):
        status, _, raw = self.get('/__system_metrics')
        self.assertEqual(status, 200)
        data = json.loads(raw)
        self.assertIn('cpuPercent', data)
        self.assertIn('ramPercent', data)
        self.assertIsNone(data['gpuPercent'])
        self.assertIsNone(data['videoDecodePercent'])
        self.assertIn('telemetryAgeMs', data)

    def test_telemetry_round_trip_and_csv(self):
        sample = {'wave': 7, 'fps': 42.5, 'drawCalls': 704,
                  'frameMs': 24.1, 'stallCount': 3, 'recording': False,
                  'heartbeatIndex': 12, 'gameFrameCount': 640,
                  'lastGameFrameUTC': 1794500000000, 'active': True,
                  'phase': 'playing'}
        status, reply = self.post(json.dumps(sample).encode(), self.url)
        self.assertEqual((status, reply['ok']), (200, True))
        status, headers, raw = self.get('/__system_csv')
        self.assertEqual(status, 200)
        self.assertIn('attachment', headers['Content-Disposition'])
        rows = list(csv.DictReader(io.StringIO(raw.decode('utf-8'))))
        self.assertGreaterEqual(len(rows), 1)
        self.assertEqual(rows[-1]['fps'], '42.5')
        self.assertEqual(rows[-1]['drawCalls'], '704')
        self.assertEqual(rows[-1]['wave'], '7')
        self.assertEqual(rows[-1]['sampleSource'], 'browser')
        self.assertEqual(rows[-1]['telemetryAgeMs'], '0')
        self.assertEqual(rows[-1]['heartbeatIndex'], '12')
        self.assertEqual(rows[-1]['gameFrameCount'], '640')
        self.assertEqual(rows[-1]['phase'], 'playing')
        self.assertTrue(rows[-1]['timestampUTC'].endswith('+00:00'))

    def test_rejects_invalid_and_foreign_telemetry(self):
        with self.assertRaises(HTTPError) as e:
            self.post(b'not-json', self.url)
        self.assertEqual(e.exception.code, 400)
        with self.assertRaises(HTTPError) as e:
            self.post(b'{}', 'https://untrusted.example')
        self.assertEqual(e.exception.code, 403)
        with self.assertRaises(HTTPError) as e:
            self.post(b' ' * 4097, self.url)
        self.assertEqual(e.exception.code, 413)

    def test_host_samples_survive_missing_browser_heartbeat(self):
        # Host sampling must continue even without new browser POST requests.
        with self.server.lock:
            self.server.last_heartbeat_monotonic = time.monotonic() - 4.0
            self.server.next_host_sample = time.monotonic()
        before = len(list(csv.DictReader(io.StringIO(self.get('/__system_csv')[2].decode('utf-8')))))
        for _ in range(35):
            time.sleep(.08)
            rows = list(csv.DictReader(io.StringIO(self.get('/__system_csv')[2].decode('utf-8'))))
            if len(rows) > before and rows[-1]['sampleSource'] == 'host':
                break
        else:
            self.fail('No independent host CSV sample was recorded')
        self.assertGreaterEqual(int(rows[-1]['telemetryAgeMs']), 3900)
        self.assertEqual(rows[-1]['gpuPercent'], '')

    def test_render_age_detects_stalled_raf_with_fresh_heartbeat(self):
        now_ms = round(time.time() * 1000)
        sample = {'heartbeatIndex': 777, 'gameFrameCount': 3,
                  'lastGameFrameUTC': now_ms - 6500, 'fps': 1}
        self.assertEqual(self.post(json.dumps(sample).encode(), self.url)[0], 200)
        metrics = json.loads(self.get('/__system_metrics')[2])
        self.assertGreaterEqual(metrics['renderAgeMs'], 6400)
        self.assertLess(metrics['telemetryAgeMs'], 1000)
        with self.server.lock:
            self.server.next_host_sample = time.monotonic()
        for _ in range(35):
            time.sleep(.08)
            rows = list(csv.DictReader(io.StringIO(self.get('/__system_csv')[2].decode())))
            if rows and rows[-1]['sampleSource'] == 'host':
                break
        else:
            self.fail('No independent host sample')
        self.assertGreaterEqual(int(rows[-1]['renderAgeMs']), 6400)
        self.assertLess(int(rows[-1]['telemetryAgeMs']), 3000)
        self.assertEqual(rows[-1]['heartbeatIndex'], '777')
        self.assertEqual(rows[-1]['gpuPercent'], '')

    def test_visibility_context_survives_browser_and_host_samples(self):
        # Hidden tabs can throttle RAF; preserve visibility context in the CSV.
        sample = {'documentHidden': True, 'documentHasFocus': False,
                  'lastGameFrameUTC': round(time.time() * 1000) - 6500}
        self.assertEqual(self.post(json.dumps(sample).encode(), self.url)[0], 200)
        metrics = json.loads(self.get('/__system_metrics')[2])
        self.assertIs(metrics['documentHidden'], True)
        self.assertIs(metrics['documentHasFocus'], False)
        self.assertGreaterEqual(metrics['renderAgeMs'], 6400)
        rows = list(csv.DictReader(io.StringIO(self.get('/__system_csv')[2].decode())))
        self.assertEqual(rows[-1]['documentHidden'], 'True')
        self.assertEqual(rows[-1]['documentHasFocus'], 'False')
        with self.server.lock:
            self.server.next_host_sample = time.monotonic()
        for _ in range(35):
            time.sleep(.08)
            rows = list(csv.DictReader(io.StringIO(self.get('/__system_csv')[2].decode())))
            if rows and rows[-1]['sampleSource'] == 'host':
                break
        else:
            self.fail('No independent host sample with tab visibility')
        self.assertEqual(rows[-1]['documentHidden'], 'True')
        self.assertEqual(rows[-1]['documentHasFocus'], 'False')
        self.post(json.dumps({'documentHidden': 'false', 'documentHasFocus': 1}).encode(), self.url)
        metrics = json.loads(self.get('/__system_metrics')[2])
        self.assertIsNone(metrics['documentHidden'])
        self.assertIsNone(metrics['documentHasFocus'])

    def test_launcher_enables_performance_lab(self):
        launcher = (SCRIPT.parents[1] / 'PLAY-PREVIEW.cmd').read_text()
        self.assertIn('GAME_URL=http://127.0.0.1:%PORT%/?devlab=1', launcher)
        game = (SCRIPT.parents[1] / 'src/game.js').read_text()
        self.assertIn('if(!schoolQA && (location.hostname', game)
        self.assertNotIn('const q=window.__DD_QA?.snap(),m=window.__DD_GAME_METRICS', game)
        ui = (SCRIPT.parents[1] / 'src/rendering/system-monitor-ui.js').read_text()
        self.assertNotIn("fetch('./__game_telemetry'", ui)


if __name__ == '__main__':
    unittest.main()
