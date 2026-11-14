@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Dragon Defense - 60 Second Windows Performance Capture

echo.
echo First launch PLAY-PREVIEW.cmd and start the game in Chrome or Edge.
echo Start a wave with fires and building destruction before continuing.
echo The capture uses Windows wall time, including any frozen frames.
echo.
echo Press any key when ready. Switch back to the game during the 10-second countdown.
pause >nul
py -3 --version >nul 2>&1
if not errorlevel 1 (
  py -3 tools\capture-windows-performance.py --seconds 60 --warmup 10
) else (
  python tools\capture-windows-performance.py --seconds 60 --warmup 10
)
if errorlevel 1 (
  echo.
  echo Capture failed. Keep PLAY-PREVIEW.cmd running and retry.
  pause
  exit /b 1
)
echo.
echo Upload both files from the performance-captures folder for analysis.
pause
