@echo off
echo ========================================
echo RESTARTING MAIN SERVER ONLY
echo ========================================
echo.

echo Step 1: Killing all Node.js processes...
taskkill /F /IM node.exe
timeout /t 2 /nobreak > nul
echo.

echo Step 2: Waiting for COM12 to be released...
timeout /t 3 /nobreak > nul
echo.

echo Step 3: Starting main server (with GSM support)...
echo Server will start on port 8000
echo GSM module will connect to COM12
echo.
start "Smart-CS1 Main Server" node server/index.js
echo.

echo ========================================
echo Main server started!
echo ========================================
echo.
echo Check the new console window for:
echo   - Server running on port 8000
echo   - GSM Service initialized
echo   - SMS notification service initialized
echo.
echo If you see errors, check:
echo   1. COM12 is not being used by other apps
echo   2. GSM module is connected via USB
echo   3. No other Node servers are running
echo.
pause

