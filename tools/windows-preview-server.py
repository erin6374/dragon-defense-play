"""Loopback-only development preview with performance CSV; Python stdlib only.

The browser panel posts game metrics every two seconds. Windows CPU and RAM
come from native OS counters; GPU utilization is explicitly unsupported.
This is a development server, never a production endpoint.
"""
import argparse
import csv
import ctypes
from ctypes import wintypes
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import math
import os
from pathlib import Path
import tempfile
import threading
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
COLUMNS = ('timestampUTC', 'wave', 'fps', 'drawCalls', 'frameMs', 'recording',
           'stallCount', 'cpuPercent', 'ramPercent', 'ramAvailableGB',
           'gpuPercent', 'browserRSSMB')


class FILETIME(ctypes.Structure):
    _fields_ = [('dwLowDateTime', wintypes.DWORD),
                ('dwHighDateTime', wintypes.DWORD)]


class MEMORYSTATUSEX(ctypes.Structure):
    _fields_ = [('dwLength', wintypes.DWORD), ('dwMemoryLoad', wintypes.DWORD),
                ('ullTotalPhys', ctypes.c_ulonglong),
                ('ullAvailPhys', ctypes.c_ulonglong),
                ('ullTotalPageFile', ctypes.c_ulonglong),
                ('ullAvailPageFile', ctypes.c_ulonglong),
                ('ullTotalVirtual', ctypes.c_ulonglong),
                ('ullAvailVirtual', ctypes.c_ulonglong),
                ('ullAvailExtendedVirtual', ctypes.c_ulonglong)]


def windows_counters(previous=None):
    if os.name != 'nt':
        return {'cpuPercent': None, 'ramPercent': None,
                'ramAvailableGB': None}, previous
    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    idle, kernel_time, user = FILETIME(), FILETIME(), FILETIME()
    cpu = None
    if kernel.GetSystemTimes(ctypes.byref(idle), ctypes.byref(kernel_time),
                             ctypes.byref(user)):
        ticks = lambda x: (x.dwHighDateTime << 32) | x.dwLowDateTime
        now = (ticks(idle), ticks(kernel_time), ticks(user))
        if previous is not None:
            elapsed = (now[1] - previous[1]) + (now[2] - previous[2])
            idle_delta = now[0] - previous[0]
            if elapsed > 0:
                cpu = round(max(0., min(100., 100. * (1. - idle_delta / elapsed))), 1)
        previous = now
    mem = MEMORYSTATUSEX()
    mem.dwLength = ctypes.sizeof(mem)
    ram = available = None
    if kernel.GlobalMemoryStatusEx(ctypes.byref(mem)):
        ram = float(mem.dwMemoryLoad)
        available = round(mem.ullAvailPhys / (1024 ** 3), 2)
    return {'cpuPercent': cpu, 'ramPercent': ram,
            'ramAvailableGB': available}, previous


def safe_number(value, lo, hi):
    if isinstance(value, bool) or not isinstance(value, (float, int)):
        return None
    if not math.isfinite(value):
        return None
    return max(lo, min(hi, value))


class PreviewServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, address, root=ROOT, log_path=None):
        self.root = Path(root).resolve()
        self.log_path = Path(log_path) if log_path else Path(tempfile.gettempdir()) / (
            f'dragon-defense-performance-{os.getpid()}.csv')
        self.lock = threading.Lock()
        self.previous_cpu = None
        self.system = {'cpuPercent': None, 'ramPercent': None,
                       'ramAvailableGB': None, 'gpuPercent': None,
                       'videoDecodePercent': None, 'browserRSSMB': None}
        self.game = {}
        with self.log_path.open('w', newline='', encoding='utf-8') as f:
            csv.writer(f).writerow(COLUMNS)
        super().__init__(address, PreviewHandler)


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(args[2].root), **kwargs)

    def send_json(self, data, status=200):
        raw = json.dumps(data, allow_nan=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/__build':
            try:
                info = json.loads((self.server.root / 'build-info.json').read_text('utf-8'))
                self.send_json({'version': info['version'], 'build': info['build'],
                                'directory': str(self.server.root)})
            except (OSError, KeyError, ValueError) as exc:
                self.send_json({'error': str(exc)}, 500)
            return
        if path == '/__system_metrics':
            with self.server.lock:
                counters, self.server.previous_cpu = windows_counters(self.server.previous_cpu)
                self.server.system.update(counters)
                self.send_json({**self.server.system, 'logFile': self.server.log_path.name})
            return
        if path == '/__system_csv':
            with self.server.lock:
                raw = self.server.log_path.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'text/csv; charset=utf-8')
            self.send_header('Content-Disposition', 'attachment; filename="dragon-defense-performance.csv"')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
            return
        super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != '/__game_telemetry':
            self.send_json({'error': 'Unknown endpoint'}, 404)
            return
        origin = self.headers.get('Origin')
        allowed = (f'http://127.0.0.1:{self.server.server_port}',
                   f'http://localhost:{self.server.server_port}')
        if origin is not None and origin not in allowed:
            self.send_json({'error': 'Origin not permitted'}, 403)
            return
        try:
            size = int(self.headers.get('Content-Length', '-1'))
            if size < 0 or size > 4096:
                self.send_json({'error': 'Invalid telemetry length'}, 413)
                return
            incoming = json.loads(self.rfile.read(size))
            if not isinstance(incoming, dict):
                raise ValueError('Expected JSON object')
            row = {key: safe_number(incoming.get(key), 0, 1000000)
                   for key in ('wave', 'fps', 'drawCalls', 'frameMs', 'stallCount')}
            row['recording'] = bool(incoming.get('recording'))
        except (ValueError, TypeError, UnicodeError):
            self.send_json({'error': 'Invalid telemetry JSON'}, 400)
            return
        with self.server.lock:
            self.server.game = row
            row.update(self.server.system)
            row['timestampUTC'] = datetime.now(timezone.utc).isoformat()
            with self.server.log_path.open('a', newline='', encoding='utf-8') as f:
                csv.writer(f).writerow(row.get(k) for k in COLUMNS)
        self.send_json({'ok': True})


def main():
    parser = argparse.ArgumentParser(description='Dragon Defense local Windows performance preview')
    parser.add_argument('--port', type=int, default=8769)
    args = parser.parse_args()
    with PreviewServer(('127.0.0.1', args.port)) as server:
        print(f'Dragon Defense preview: http://127.0.0.1:{server.server_port}/', flush=True)
        print(f'Performance CSV: {server.log_path}', flush=True)
        print('GPU utilization is not measured; do not infer it from game FPS.', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
