"""Loopback-only development preview with performance CSV; Python stdlib only.

The game loop posts lightweight metrics every second. Windows CPU and RAM
come from native OS counters; GPU utilization is explicitly unsupported.
This is a development server, never a production endpoint.
"""
import argparse
import csv
import ctypes
from ctypes import wintypes
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import io
import json
import math
import os
from pathlib import Path
import tempfile
import threading
import time
from urllib.parse import urlsplit, parse_qs

ROOT = Path(__file__).resolve().parent.parent
COLUMNS = ('timestampUTC', 'sampleSource', 'telemetryAgeMs', 'renderAgeMs', 'heartbeatIndex',
           'gameFrameCount', 'lastGameFrameUTC', 'phase', 'active',
           'documentHidden', 'documentHasFocus',
           'wave', 'fps', 'drawCalls', 'frameMs', 'recording',
            'adaptiveResolution', 'adaptiveAdjustments', 'framebufferWidth', 'framebufferHeight',
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


def render_age_ms(last_render_utc, now_ms=None):
    """Age of the last rendered frame, independent of JS heartbeat age.

    A timer may keep posting while requestAnimationFrame stops; a fresh
    heartbeat does not prove that the renderer is advancing.
    """
    if isinstance(last_render_utc, bool) or not isinstance(last_render_utc, (int, float)):
        return None
    if not math.isfinite(last_render_utc) or last_render_utc <= 0:
        return None
    if now_ms is None:
        now_ms = time.time() * 1000
    return max(0, round(now_ms - last_render_utc))


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
        self.last_heartbeat_monotonic = None
        self.next_host_sample = time.monotonic() + 2.0
        with self.log_path.open('w', newline='', encoding='utf-8') as f:
            csv.writer(f).writerow(COLUMNS)
        super().__init__(address, PreviewHandler)

    def write_row(self, row):
        with self.log_path.open('a', newline='', encoding='utf-8') as f:
            csv.writer(f).writerow(row.get(k) for k in COLUMNS)

    def service_actions(self):
        """Independent host sampling continues while browser JS is frozen.

        Called by serve_forever on its own server thread; no additional timer
        threads, and the CSV labels stale game FPS rather than inventing frames.
        """
        now = time.monotonic()
        if now < self.next_host_sample:
            return
        self.next_host_sample = now + 2.0
        with self.lock:
            counters, self.previous_cpu = windows_counters(self.previous_cpu)
            self.system.update(counters)
            age = (round((now - self.last_heartbeat_monotonic) * 1000)
                   if self.last_heartbeat_monotonic is not None else None)
            self.write_row({**self.game, **self.system,
                            'timestampUTC': datetime.now(timezone.utc).isoformat(),
                            'sampleSource': 'host', 'telemetryAgeMs': age,
                            'renderAgeMs': render_age_ms(self.game.get('lastGameFrameUTC'))})


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
                age = (round((time.monotonic() - self.server.last_heartbeat_monotonic) * 1000)
                       if self.server.last_heartbeat_monotonic is not None else None)
                self.send_json({**self.server.system,
                                'documentHidden': self.server.game.get('documentHidden'),
                                'documentHasFocus': self.server.game.get('documentHasFocus'),
                                'telemetryAgeMs': age,
                                'renderAgeMs': render_age_ms(self.server.game.get('lastGameFrameUTC')),
                                'logFile': self.server.log_path.name})
            return
        if path == '/__system_csv':
            # Optional server-side time window avoids transferring hours of old
            # telemetry into the one-click 60-second Windows capture. The
            # unfiltered endpoint remains backward-compatible for manual export.
            params = parse_qs(urlsplit(self.path).query)
            if 'since' in params or 'until' in params:
                try:
                    if set(params) != {'since', 'until'} or any(len(params[k]) != 1 for k in params):
                        raise ValueError('Expected one since and one until timestamp')
                    since = datetime.fromisoformat(params['since'][0].replace('Z', '+00:00'))
                    until = datetime.fromisoformat(params['until'][0].replace('Z', '+00:00'))
                    if (since.tzinfo is None or until.tzinfo is None or
                            until < since or (until - since).total_seconds() > 180):
                        raise ValueError('CSV time window must be timezone-aware and <=180 seconds')
                except (ValueError, KeyError, OverflowError) as exc:
                    self.send_json({'error': str(exc)}, 400)
                    return
                with self.server.lock:
                    out = io.StringIO(newline='')
                    with self.server.log_path.open(newline='', encoding='utf-8') as source:
                        reader = csv.DictReader(source)
                        writer = csv.DictWriter(out, fieldnames=reader.fieldnames, lineterminator='\n')
                        writer.writeheader()
                        for row in reader:
                            try:
                                timestamp = datetime.fromisoformat(row['timestampUTC'].replace('Z', '+00:00'))
                            except (ValueError, KeyError, AttributeError):
                                continue
                            if timestamp.tzinfo is not None and since <= timestamp <= until:
                                writer.writerow(row)
                    raw = out.getvalue().encode('utf-8')
            else:
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
            row['adaptiveResolution'] = safe_number(incoming.get('adaptiveResolution'), 0, 1)
            row['adaptiveAdjustments'] = safe_number(incoming.get('adaptiveAdjustments'), 0, 1000000)
            for key in ('framebufferWidth', 'framebufferHeight'):
                row[key] = safe_number(incoming.get(key), 0, 32768)
            row['recording'] = bool(incoming.get('recording'))
            row['active'] = bool(incoming.get('active'))
            row['documentHidden'] = (incoming.get('documentHidden')
                                     if isinstance(incoming.get('documentHidden'), bool) else None)
            row['documentHasFocus'] = (incoming.get('documentHasFocus')
                                       if isinstance(incoming.get('documentHasFocus'), bool) else None)
            row['phase'] = str(incoming.get('phase') or '')[:48]
            for key in ('heartbeatIndex', 'gameFrameCount', 'lastGameFrameUTC'):
                row[key] = safe_number(incoming.get(key), 0, 1e15)
        except (ValueError, TypeError, UnicodeError):
            self.send_json({'error': 'Invalid telemetry JSON'}, 400)
            return
        with self.server.lock:
            self.server.game = row.copy()
            self.server.last_heartbeat_monotonic = time.monotonic()
            row.update(self.server.system)
            row['timestampUTC'] = datetime.now(timezone.utc).isoformat()
            row['sampleSource'] = 'browser'
            row['telemetryAgeMs'] = 0
            row['renderAgeMs'] = render_age_ms(row.get('lastGameFrameUTC'))
            self.server.write_row(row)
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
