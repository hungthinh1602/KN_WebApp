@echo off
setlocal
set "PATH=C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Program Files\nodejs;C:\Program Files\Python312;C:\Program Files\Python312\Scripts;C:\Program Files\Git\cmd"
title KN ProTrader Launcher
color 0A
cls

echo.
echo  ============================================================
echo   KN INVEST PROTRADER - ONE CLICK LAUNCHER
echo  ============================================================
echo.

cd /d "%~dp0"

echo  [1/3] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python not found in PATH! Please run setup_vps.bat first.
    pause & exit /b 1
)
echo  [OK] Python found

echo  [2/3] Checking Node.js...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found in PATH! Please run setup_vps.bat first.
    pause & exit /b 1
)
echo  [OK] Node.js found

echo  [3/3] Checking node_modules...
if not exist "%~dp0node_modules" (
    echo  Running npm install...
    npm install
    if %errorlevel% neq 0 ( echo [ERROR] npm install failed! & pause & exit /b 1 )
)
echo  [OK] Dependencies ready

echo.
echo   Starting services...

echo  Starting MT5 Bridge...
start "" "%~dp0_bridge.bat"
timeout /t 2 /nobreak >nul

echo  Starting Vite Dev Server...
start "" "%~dp0_vite.bat"

echo  Waiting 6 seconds...
timeout /t 6 /nobreak >nul

echo  Opening browser...
start "" "http://localhost"

echo.
echo  ============================================================
echo   DONE!  Web: http://localhost
echo   To stop: close the two black windows.
echo  ============================================================
echo.
pause