@echo off
setlocal enabledelayedexpansion
title KN ProTrader - 1-Click Environment Setup
color 0B

echo ===================================================
echo   KN INVEST PROTRADER - AUTO SETUP ENVIRONMENT
echo ===================================================
echo.
cd /d "%~dp0"

set "NEEDS_RESTART=0"

:: 1. Check Python
echo [1/4] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo      Python not found! Downloading Python 3.12...
    curl -# -L -o python_installer.exe https://www.python.org/ftp/python/3.12.4/python-3.12.4-amd64.exe
    echo      Installing Python silently (this may take a minute)...
    start /wait python_installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    del python_installer.exe
    echo      [OK] Python installed!
    set "NEEDS_RESTART=1"
) else (
    echo      [OK] Python is already installed.
)

:: 2. Check Node.js
echo.
echo [2/4] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo      Node.js not found! Downloading Node.js 20 LTS...
    curl -# -L -o node_installer.msi https://nodejs.org/dist/v20.15.1/node-v20.15.1-x64.msi
    echo      Installing Node.js silently (this may take a minute)...
    msiexec.exe /i node_installer.msi /qn
    del node_installer.msi
    echo      [OK] Node.js installed!
    set "NEEDS_RESTART=1"
) else (
    echo      [OK] Node.js is already installed.
)

:: If we just installed something, we must exit to reload PATH
if "!NEEDS_RESTART!"=="1" (
    echo.
    echo ===================================================
    echo   IMPORTANT: Environment variables have changed!
    echo   Please CLOSE this black window, then OPEN IT AGAIN
    echo   and double-click setup_vps.bat one more time.
    echo ===================================================
    pause
    exit /b
)

:: 3. Install Python Dependencies
echo.
echo [3/4] Installing Python dependencies (MetaTrader5)...
pip install MetaTrader5
if %errorlevel% neq 0 (
    echo [WARN] Failed to install MetaTrader5. You may need to install it manually.
)

:: 4. Install Node Dependencies
echo.
echo [4/4] Installing Node.js dependencies (npm install)...
call npm install
if %errorlevel% neq 0 (
    echo [WARN] npm install failed.
)

echo.
echo ===================================================
echo   SETUP COMPLETE! ALL ENVIRONMENTS ARE READY.
echo   You can now double-click "start.bat" to run.
echo ===================================================
pause
