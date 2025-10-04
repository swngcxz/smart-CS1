# Environment Configuration Setup

This document explains how to configure the API endpoints using environment variables to avoid hardcoding IP addresses in your code.

## Files Created/Modified

1. **`.env`** - Contains your actual environment variables (DO NOT commit to git)
2. **`.env.example`** - Template file showing required environment variables (safe to commit)
3. **`types/env.d.ts`** - TypeScript definitions for environment variables
4. **`babel.config.js`** - Updated to support environment variable loading
5. **`utils/apiService.ts`** - Updated to use environment variables
6. **`utils/axiosInstance.ts`** - Updated to use environment variables

## Setup Instructions

### 1. Install Dependencies
The required package is already installed:
```bash
npm install react-native-dotenv
```

### 2. Configure Environment Variables

Copy the example file and customize it:
```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:
```env
# API Configuration
# Replace these values with your actual server details

# Primary API endpoint (your computer's IP address for mobile development)
API_BASE_URL=http://192.168.254.114:8000

# Fallback endpoints for different environments
API_FALLBACK_LOCALHOST=http://localhost:8000
API_FALLBACK_ANDROID_EMULATOR=http://10.0.2.2:8000

# API timeout in milliseconds
API_TIMEOUT=10000

# Environment (development, production, staging)
NODE_ENV=development

# Enable/disable API debugging logs
API_DEBUG=true
```

### 3. Find Your Computer's IP Address

#### Windows:
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

#### macOS/Linux:
```bash
ifconfig
```
Look for "inet" address under your active network interface.

### 4. Update Your IP Address

Replace `192.168.254.114` in the `.env` file with your actual IP address.

## Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `API_BASE_URL` | Primary API endpoint for mobile devices | `http://192.168.1.100:8000` |
| `API_FALLBACK_LOCALHOST` | Fallback for localhost/simulator | `http://localhost:8000` |
| `API_FALLBACK_ANDROID_EMULATOR` | Fallback for Android emulator | `http://10.0.2.2:8000` |
| `API_TIMEOUT` | Request timeout in milliseconds | `10000` |
| `NODE_ENV` | Environment type | `development` |
| `API_DEBUG` | Enable/disable debug logging | `true` or `false` |

## Usage in Code

The environment variables are now automatically loaded and used in your API services:

```typescript
import { API_BASE_URL, API_DEBUG } from '@env';

// API_BASE_URL will contain your configured endpoint
// API_DEBUG will control logging behavior
```

## Benefits

1. **No more hardcoded IP addresses** - Easy to change without code modifications
2. **Environment-specific configurations** - Different settings for development/production
3. **Team collaboration** - Each developer can use their own IP without conflicts
4. **Git safety** - `.env` files are ignored, preventing accidental commits of sensitive data
5. **Debug control** - Easy to enable/disable logging for different environments

## Troubleshooting

### Environment variables not loading?
1. Make sure you've restarted your development server after installing `react-native-dotenv`
2. Check that your `.env` file is in the root directory of your project
3. Verify the babel configuration includes the dotenv plugin

### Still can't connect to your backend?
1. Double-check your IP address in the `.env` file
2. Ensure your backend server is running on the correct port
3. Check that your mobile device and computer are on the same network
4. Try the fallback endpoints by temporarily changing `API_BASE_URL`

### Debug logging not working?
Set `API_DEBUG=true` in your `.env` file and restart the app.

## Security Notes

- Never commit `.env` files to version control
- The `.env.example` file is safe to commit as it contains no sensitive data
- Use different environment files for different deployment environments
