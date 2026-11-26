@echo off
setlocal
cd /d "%~dp0"
title Dragon Defense - Integration Browser QA
where node >nul 2>&1
if errorlevel 1 (
 echo Node.js 20 or later is required. Install from https://nodejs.org/
 pause
 exit /b 1
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 20 ? 0 : 1)"
if errorlevel 1 (
 echo Node.js 20 or later is required.
 pause
 exit /b 1
)
if not exist "tools\.integration-qa-runtime\node_modules\playwright\index.mjs" (
 echo First run requires the Playwright package. It will use installed Microsoft Edge.
 choice /c YN /m "Install Playwright locally for this QA utility"
 if errorlevel 2 exit /b 1
 call npm install --prefix "tools\.integration-qa-runtime" --no-audit --no-fund playwright
 if errorlevel 1 (
  pause
  exit /b 1
 )
)
node tools\integration-browser-qa.mjs %*
set "RC=%ERRORLEVEL%"
echo.
echo Review the newest report.json and screenshots in integration-qa-results.
if not "%RC%"=="0" echo QA found a failure or was unable to complete.
pause
exit /b %RC%
