@echo off
title Vite Dev Server - KN ProTrader
color 0E
echo.
echo  Vite Dev Server starting on http://localhost (Port 80)
echo  Close this window to stop.
echo.
cd /d "%~dp0"
set "CLEAN_PATH=%PATH:"=%"
set "PATH=%CLEAN_PATH%;C:\Program Files\nodejs;C:\Program Files\Git\cmd"
npm run dev
pause