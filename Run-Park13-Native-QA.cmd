@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo Dragon Defense - Preview 11 native QA (not a release launcher)
where git.exe >nul 2>nul || goto missinggit
where node.exe >nul 2>nul || goto missingnode
set "CANDIDATE="
for /f "delims=" %%S in ('git rev-parse HEAD 2^>nul') do set "CANDIDATE=%%S"
if not defined CANDIDATE goto missinggit
if not "%~1"=="" if /i not "%~1"=="%CANDIDATE%" goto wrongsha
echo Candidate: %CANDIDATE%
echo This test opens a visible browser, flies across the map, and runs paired bombardments.
echo Keep the browser in the foreground. It will not change your Git branch or publish a build.
if defined PLAYWRIGHT_MODULE goto run
set "QA_RUNTIME=%TEMP%\dragon-defense-park13-qa"
set "PLAYWRIGHT_MODULE=%QA_RUNTIME%\node_modules\playwright-core\index.mjs"
if exist "%PLAYWRIGHT_MODULE%" goto run
where npm.cmd >nul 2>nul || goto missingnpm
choice /C YN /M "Install pinned Playwright Core 1.56.1 in the temporary QA folder"
if errorlevel 2 goto cancelled
call npm.cmd install --prefix "%QA_RUNTIME%" --no-save playwright-core@1.56.1
if errorlevel 1 goto failed
if not exist "%PLAYWRIGHT_MODULE%" goto failed
:run
echo Running native QA against the current clean checkout...
node qa\park13-native-browser.mjs "%CANDIDATE%" "park13-integration-output"
set "RESULT=%ERRORLEVEL%"
echo.
echo Evidence: %CD%\park13-integration-output\native.json
if "%RESULT%"=="0" (echo Native gate PASSED.) else (echo Native gate FAILED or blocked. Review the report.)
pause
exit /b %RESULT%
:missinggit
echo Git is required and this must be a Git checkout.
goto failed
:missingnode
echo Install Node.js 22 before running native QA.
goto failed
:missingnpm
echo npm is required to install the pinned local QA dependency.
goto failed
:wrongsha
echo Current checkout does not match the requested candidate SHA. No changes were made.
goto failed
:cancelled
echo QA cancelled. Set PLAYWRIGHT_MODULE to an installed Playwright module and retry.
:failed
pause
exit /b 1
