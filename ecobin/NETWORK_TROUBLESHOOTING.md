# Network Error Troubleshooting Guide

## 🚨 Current Issues
Based on the error screenshots, you're experiencing:
1. **Network Error** when accessing `/api/bin-notifications/janitor/6uprP4efGeffBN5aEJGx?limit=50`
2. **Failed to fetch notification badge** with AxiosError: Network Error
3. **Response Error** from `axiosInstance.ts` interceptor

## ✅ Backend Status
- ✅ Backend server is running on `http://10.0.0.117:8000`
- ✅ API endpoints are accessible via curl
- ✅ Server responds with HTTP 200 OK

## 🔧 Troubleshooting Steps

### Step 1: Verify Environment Variables
Run this test to check if environment variables are loading:
```bash
node test-env.js
```

### Step 2: Check Network Configuration
1. **Ensure your mobile device and computer are on the same network**
2. **Verify the IP address in .env file matches your computer's current IP**
3. **Check if your firewall is blocking connections**

### Step 3: Test Different Endpoints
Try these commands to test connectivity:
```bash
# Test basic connectivity
curl http://10.0.0.117:8000/api/bin1

# Test the failing endpoint
curl "http://10.0.0.117:8000/api/bin-notifications/janitor/6uprP4efGeffBN5aEJGx?limit=50"
```

### Step 4: Mobile App Network Issues

#### Common Causes:
1. **Environment variables not loading** - App might be using fallback values
2. **Network permissions** - Mobile app might not have network access
3. **CORS issues** - Cross-origin requests might be blocked
4. **Timeout issues** - Requests might be timing out

#### Solutions:

##### A. Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Clear cache and restart
npx expo start --clear
```

##### B. Check Network Permissions
Make sure your app has network permissions in `app.json`:
```json
{
  "expo": {
    "permissions": ["INTERNET", "ACCESS_NETWORK_STATE"]
  }
}
```

##### C. Test with Different IP
Try updating your IP address:
```bash
node update-ip.js YOUR_NEW_IP_ADDRESS
```

##### D. Enable Debug Logging
Make sure `API_DEBUG=true` in your `.env` file to see detailed logs.

### Step 5: Alternative Solutions

#### Option 1: Use Localhost for Testing
If you're testing on an emulator, try:
```bash
node update-ip.js 10.0.2.2
```

#### Option 2: Use Your Computer's IP
Find your computer's IP and update:
```bash
# Windows
ipconfig

# macOS/Linux
ifconfig
```

#### Option 3: Add Network Error Handling
The app should handle network errors gracefully and show user-friendly messages.

## 🚀 Quick Fixes

### Fix 1: Update IP Address
```bash
# Replace with your actual IP
node update-ip.js 192.168.1.100
```

### Fix 2: Clear Cache and Restart
```bash
npx expo start --clear
```

### Fix 3: Check Environment Variables
```bash
node test-env.js
```

## 📱 Mobile-Specific Issues

### Android Emulator
- Use `http://10.0.2.2:8000` as the API endpoint
- Make sure the emulator has internet access

### Physical Device
- Ensure device and computer are on the same WiFi network
- Check if your router blocks device-to-device communication
- Try using your computer's actual IP address

### iOS Simulator
- Use `http://localhost:8000` or your computer's IP
- Make sure the simulator has network access

## 🔍 Debug Information

To get more debug information, check:
1. **Console logs** - Look for API request/response logs
2. **Network tab** - Check if requests are being made
3. **Environment variables** - Verify they're loaded correctly
4. **Server logs** - Check if requests are reaching the server

## 📞 Next Steps

1. Run the test script: `node test-env.js`
2. Update your IP address if needed
3. Clear cache and restart: `npx expo start --clear`
4. Test the app again
5. Check console logs for more specific error details

If issues persist, the problem might be:
- Network configuration on your device/emulator
- Firewall blocking connections
- Environment variables not loading properly
- CORS configuration on the server
