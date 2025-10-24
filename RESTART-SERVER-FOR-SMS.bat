@echo off
echo ========================================
echo RESTARTING SERVER TO FIX SMS
echo ========================================
echo.
echo This will:
echo  1. Kill all Node.js processes
echo  2. Release COM12 port
echo  3. Restart main server with GSM support
echo.
pause

echo.
echo Step 1: Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ All Node processes killed
) else (
    echo ⚠️ No Node processes found or already killed
)

echo.
echo Step 2: Waiting 5 seconds for COM12 to be released...
timeout /t 5 /nobreak > nul
echo ✅ COM12 should now be available

echo.
echo Step 3: Starting main server...
echo.
echo ========================================
echo WATCH FOR THESE MESSAGES:
echo ========================================
echo [GSM SERVICE] Successfully connected to COM12
echo [GSM SERVICE] Modem initialized successfully  
echo [GSM SERVICE] SIM card is ready
echo ✅ SMS notification service initialized
echo ========================================
echo.
echo If you see these messages, SMS is working!
echo If you see errors, check:
echo   - GSM module is plugged in via USB
echo   - No other programs using COM12
echo   - SIM card is inserted
echo.

start "Smart-CS1 Main Server (SMS Enabled)" cmd /k "cd /d %~dp0 && node server/index.js"

echo.
echo ✅ Server started in new window!
echo.
echo Next steps:
echo  1. Check the new console window for GSM initialization
echo  2. Wait for "SMS notification service initialized"
echo  3. Test assignment from dashboard
echo  4. Check phone for SMS
echo.
pause

