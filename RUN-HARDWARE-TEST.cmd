@echo off
setlocal
cd /d "%~dp0"
title Dragon Defense - Native Hardware Test
echo Dragon Defense - Integration native GPU test
echo.
echo Close other demanding games or applications before starting.
echo The test opens its own Microsoft Edge window and runs automatically.
echo Keep that window in the foreground. Do not play or switch tabs.
echo A failed test is useful evidence too. Please send the resulting report.json.
echo.
choice /c YN /m "Start hardware test"
if errorlevel 2 exit /b 1
set "DD_QA_TIMEOUT_MS=900000"
set "QA_BROWSER_CHANNEL=msedge"
set "DD_QA_CHROMIUM="
set "PLAYWRIGHT_MODULE="
call "%~dp0RUN-INTEGRATION-QA.cmd" --require-hardware
set "RC=%ERRORLEVEL%"
if exist "%~dp0integration-qa-results" start "" explorer.exe "%~dp0integration-qa-results"
exit /b %RC%
