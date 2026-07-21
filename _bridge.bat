@echo off
title MT5 Bridge - KN ProTrader
color 0B
echo.
echo  MT5 Bridge Server running on http://localhost:8000
echo  Close this window to stop.
echo.
set "PATH=C:\Windows\system32;C:\Windows;C:\Windows\System32\Wbem;C:\Program Files\Python312;C:\Program Files\Python312\Scripts;C:\Program Files\Git\cmd"
python "%~dp0mt5_bridge.py"
pause