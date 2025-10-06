# Environment Variables Setup Guide

## Overview
This guide explains how to set up environment variables for the EcoBin mobile app to properly configure API endpoints instead of using hardcoded IP addresses.

## Required .env File

Create a `.env` file in the `ecobin/` directory with the following content:

```env
# API Configuration for EcoBin Mobile App
# Server IP Addresses
API_BASE_URL=http://10.0.0.117:8000
API_FALLBACK_LOCALHOST=http://localhost:8000
API_FALLBACK_ANDROID_EMULATOR=http://10.0.2.2:8000

# Alternative IP addresses for fallback
API_ALTERNATIVE_IP_1=http://192.168.254.114:8000
API_ALTERNATIVE_IP_2=http://192.168.56.1:8000
API_ALTERNATIVE_IP_3=http://192.168.1.13:8000
API_ALTERNATIVE_IP_4=http://192.168.1.4:8000

# API Settings
API_TIMEOUT=10000
API_DEBUG=true

# Development Environment
NODE_ENV=development
```

## Environment Variable Priority

### apiService.ts
The API service now prioritizes environment variables in this order:
1. `API_BASE_URL` - Primary server endpoint
2. `API_FALLBACK_LOCALHOST` - Localhost fallback
3. `API_FALLBACK_ANDROID_EMULATOR` - Android emulator endpoint
4. Static fallback IPs (only used if env vars are not set)

### axiosInstance.ts
The axios instance prioritizes environment variables:
1. `API_BASE_URL` - Primary endpoint
2. `API_FALLBACK_LOCALHOST` - Localhost fallback
3. Static fallback URLs (only used if env vars are not set)

## Debugging

When `API_DEBUG=true`, the app will log:
- Which environment variables are loaded or not set
- The final endpoint priority list
- Which URL is being used for API calls

## How to Update IP Addresses

### Method 1: Update .env file (Recommended)
1. Edit the `.env` file in the `ecobin/` directory
2. Update `API_BASE_URL` with your current server IP
3. Restart the Expo development server
4. The app will automatically use the new IP

### Method 2: Update specific environment variables
You can override any specific endpoint:
```env
API_BASE_URL=http://192.168.1.100:8000  # Your new server IP
API_DEBUG=true  # To see which endpoint is being used
```

## Testing Configuration

1. Set `API_DEBUG=true` in your `.env` file
2. Start the app with `expo start`
3. Check the console logs to see:
   - Which environment variables are loaded
   - Which endpoints are being used
   - If the primary endpoint is working

## Common Issues

### Environment variables not loading
- Make sure the `.env` file is in the `ecobin/` directory
- Restart the Expo development server after creating/updating `.env`
- Check that `react-native-dotenv` is properly configured in `babel.config.js`

### Wrong IP address being used
- Check the debug logs to see the endpoint priority
- Verify your `.env` file has the correct `API_BASE_URL`
- Make sure there are no typos in the environment variable names

### API calls failing
- Use `API_DEBUG=true` to see which endpoint is being tried
- Check if your server is running on the specified IP and port
- Verify network connectivity between your device and the server

## Benefits of This Setup

1. **Flexibility**: Easy to change server IP without modifying code
2. **Environment-specific**: Different configs for development, staging, production
3. **Debugging**: Clear visibility into which endpoints are being used
4. **Fallback system**: Automatic fallback to working endpoints
5. **No hardcoded IPs**: All IP addresses are configurable via environment variables
