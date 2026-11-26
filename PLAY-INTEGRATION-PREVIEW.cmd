@echo off
setlocal
title Dragon Defense - Integration Preview
cd /d "%~dp0"
where py >nul 2>&1
if not errorlevel 1 (
  py -3 -c "import sys" >nul 2>&1
  if not errorlevel 1 (
    py -3 tools\launch-integration-preview.py
    goto :done
  )
)
python -c "import sys; assert sys.version_info.major == 3" >nul 2>&1
if errorlevel 1 (
  echo Python 3 is required. Install it from https://www.python.org/downloads/windows/
  pause
  exit /b 1
)
python tools\launch-integration-preview.py
:done
if errorlevel 1 pause
