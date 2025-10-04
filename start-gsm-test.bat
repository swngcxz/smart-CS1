@echo off
echo Starting GSM Test Dashboard...
echo.
echo Make sure your GSM module is connected to COM12
echo and your SIM card is properly inserted.
echo.
echo Opening dashboard at: http://localhost:3001
echo.
node gsm-test-server.js
pause
