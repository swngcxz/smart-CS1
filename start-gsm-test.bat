@echo off
echo ========================================
echo    GSM Test Dashboard - Smart Bin
echo ========================================
echo.
echo Starting GSM Test Dashboard...
echo.
echo Prerequisites:
echo - GSM GPRS 800C module connected to COM12
echo - SIM card properly inserted with credit
echo - GSM module powered on
echo.
echo Opening dashboard at: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.
node gsm-test-server.js
if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to start GSM test server
    echo Please check:
    echo 1. Node.js is installed
    echo 2. Dependencies are installed (npm install)
    echo 3. COM12 port is available
    echo.
)
pause
