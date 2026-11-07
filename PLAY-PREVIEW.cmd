@echo off
cd /d "%~dp0"
echo Dragon Defense v5.3 development preview
echo Open http://127.0.0.1:8769/ in your browser.
echo Keep this window open while playing. Press Ctrl+C to stop.
python -m http.server 8769 --bind 127.0.0.1
pause
