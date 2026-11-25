@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Dragon Defense Development Preview
cd /d "%~dp0"

set "PORT=8785"
set "GAME_URL=http://127.0.0.1:%PORT%/"
set "PYTHON_CMD="

echo ========================================================
echo        TECH FREIRE DRAGON DEFENSE - GAME LAUNCHER
echo ========================================================
echo.
echo Game Directory: %CD%
echo Launch Address: %GAME_URL%
echo.

rem 1. Check py launcher
py -3 --version >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_CMD=py -3"
    goto :FOUND_PYTHON
)

rem 2. Check python on PATH
python -c "import sys; assert sys.version_info[0] == 3" >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_CMD=python"
    goto :FOUND_PYTHON
)

rem 3. Check known standard Windows Python locations
if exist "C:\Program Files\Python315\python.exe" (
    set "PYTHON_CMD=\"C:\Program Files\Python315\python.exe\""
    goto :FOUND_PYTHON
)
if exist "C:\Program Files\Python312\python.exe" (
    set "PYTHON_CMD=\"C:\Program Files\Python312\python.exe\""
    goto :FOUND_PYTHON
)
if exist "C:\Program Files\Python311\python.exe" (
    set "PYTHON_CMD=\"C:\Program Files\Python311\python.exe\""
    goto :FOUND_PYTHON
)
if exist "%LOCALAPPDATA%\Programs\Python\Python315\python.exe" (
    set "PYTHON_CMD=\"%LOCALAPPDATA%\Programs\Python\Python315\python.exe\""
    goto :FOUND_PYTHON
)
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PYTHON_CMD=\"%LOCALAPPDATA%\Programs\Python\Python312\python.exe\""
    goto :FOUND_PYTHON
)
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set "PYTHON_CMD=\"%LOCALAPPDATA%\Programs\Python\Python311\python.exe\""
    goto :FOUND_PYTHON
)

echo [!] Python 3 could not be found automatically.
echo Please install Python from https://www.python.org/ or the Microsoft Store.
echo WebGL ES modules require an HTTP server to run.
pause
exit /b 1

:FOUND_PYTHON
echo [*] Using Python: %PYTHON_CMD%

rem Check and release port 8785 if previously occupied
powershell -NoProfile -Command "try {$t=New-Object Net.Sockets.TcpClient; $t.Connect('127.0.0.1',%PORT%); $t.Close(); exit 0} catch {exit 1}" >nul 2>&1
if not errorlevel 1 (
  echo [*] Releasing previous server instance on port %PORT%...
  powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort %PORT% -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
  timeout /t 1 /nobreak >nul
)

echo [*] Starting local preview server on %GAME_URL%...
echo [*] Opening default web browser...
echo [*] Keep this window open while playing. Press Ctrl+C to exit.
echo.

rem Asynchronously open browser when server is responding
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "$url='%GAME_URL%'; for($i=0;$i -lt 30;$i++){try{$r=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2; if($r.StatusCode -eq 200){Start-Process $url; exit 0}}catch{}; Start-Sleep -Milliseconds 350}"

if exist "tools\windows-preview-server.py" (
  %PYTHON_CMD% -u tools\windows-preview-server.py --port %PORT%
) else (
  %PYTHON_CMD% -m http.server %PORT%
)

echo.
echo Server stopped.
pause
