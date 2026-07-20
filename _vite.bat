@echo off
title Vite Dev Server - KN ProTrader
color 0E
echo.
echo  Vite Dev Server starting on http://localhost:5173
echo  Close this window to stop.
echo.
cd /d "%~dp0"
npm run dev
pause