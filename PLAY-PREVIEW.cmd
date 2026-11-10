@echo off
setlocal EnableExtensions
title Dragon Defense v5.5 RC1 Windows Preview
cd /d "%~dp0"

set "PORT=8769"
set "GAME_URL=http://127.0.0.1:%PORT%/"
set "PYTHON_CMD="

echo.
echo =======================================
echo   TECH FREIRE DRAGON DEFENSE PREVIEW
echo =======================================
echo.
echo Game folder: %CD%
echo Preview address: %GAME_URL%
echo.

rem Try the Windows Python 3 launcher first, then validate python on PATH is version 3.
py -3 --version >nul 2>&1
if not errorlevel 1 set "PYTHON_CMD=py -3"
if not defined PYTHON_CMD (
  python -c "import sys; assert sys.version_info[0] == 3" >nul 2>&1
  if not errorlevel 1 set "PYTHON_CMD=python"
)
if not defined PYTHON_CMD (
  echo ERROR: Python 3 could not be found.
  echo Install Python 3, or use the command "py -3" from an existing installation.
  echo Do not open index.html directly; WebGL modules require an HTTP server.
  pause
  exit /b 1
)

rem The local server must serve this exact extracted folder. If another
rem process already owns the port, do not launch the wrong saved game.
powershell -NoProfile -Command "try {$t=New-Object Net.Sockets.TcpClient; $t.Connect('127.0.0.1',%PORT%); $t.Close(); exit 0} catch {exit 1}" >nul 2>&1
if not errorlevel 1 (
  echo ERROR: Port %PORT% is already occupied.
  echo Close the previous preview server window, then run this launcher again.
  echo This prevents accidentally playing a different extracted version.
  pause
  exit /b 1
)

echo Starting a local web server...
echo Keep this window open while playing. Press Ctrl+C to stop.
echo.
rem Open Chrome/Edge after the server starts responding. Delay is performed
rem by an independent process so it does not block Python's HTTP server.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "$url='%GAME_URL%'; for($i=0;$i -lt 25;$i++){try{$r=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2; if($r.StatusCode -eq 200){Start-Process $url; exit 0}}catch{}; Start-Sleep -Milliseconds 400}"
%PYTHON_CMD% -m http.server %PORT% --bind 127.0.0.1
echo.
echo Preview server stopped. If the browser is open, the game will no longer load.
pause
