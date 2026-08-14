@echo off
REM ============================================================
REM   IK Motion - local web UI launcher
REM   Double-click this file. A browser tab opens automatically.
REM ============================================================
cd /d "%~dp0"
title IK Motion UI

echo.
echo   IK Motion is starting at http://localhost:8000
echo   Keep this window open. Close it to stop the server.
echo.

REM Open the browser after a 2s head start for the server.
start "" cmd /c "timeout /t 2 /nobreak >nul & start "" http://localhost:8000"

REM Try python, fall back to the py launcher if python isn't on PATH.
python -m uvicorn app:app --host 127.0.0.1 --port 8000 2>nul
if %errorlevel% neq 0 (
    py -m uvicorn app:app --host 127.0.0.1 --port 8000
)

echo.
echo   Server stopped. Press any key to close.
pause >nul
