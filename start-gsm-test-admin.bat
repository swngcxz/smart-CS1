@echo off
echo Starting GSM Test Dashboard with Administrator privileges...
echo.
echo This will request administrator access to use COM12 port.
echo.
echo Make sure your GSM module is connected to COM12
echo and your SIM card is properly inserted.
echo.
echo Opening dashboard at: http://localhost:3001
echo.
powershell -Command "Start-Process node -ArgumentList 'gsm-test-server.js' -Verb RunAs"
pause
