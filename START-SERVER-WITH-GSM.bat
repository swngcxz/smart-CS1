@echo off
title Smart-CS1 Server with GSM Support
color 0A

echo ========================================
echo STARTING SMART-CS1 SERVER
echo ========================================
echo.
echo Watch for these messages:
echo   [GSM SERVICE] Successfully connected to COM12
echo   [GSM SERVICE] Modem initialized successfully
echo   [GSM SERVICE] SIM card is ready
echo   SMS notification service initialized
echo.
echo If you see these, SMS will work!
echo ========================================
echo.

cd /d %~dp0
node server/index.js

pause


