# Road-Based Routing Setup

This guide explains how to set up proper road-based routing instead of straight-line routes in your React Native app.

## Problem
Currently, the app shows straight dotted lines between your location and bin locations instead of following actual roads like Google Maps.

## Solution
We've implemented Google Maps Directions API integration to provide proper road-based routing.

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Directions API** for your project:
   - Go to "APIs & Services" > "Library"
   - Search for "Directions API"
   - Click on it and press "Enable"
4. Create an API key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

### 2. Configure the API Key

1. Open `ecobin/config/maps.ts`
2. Replace `'YOUR_GOOGLE_MAPS_API_KEY'` with your actual API key:

```typescript
export const MAPS_CONFIG = {
  apiKey: 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Your actual API key
  // ... rest of config
};
```

### 3. (Recommended) Secure Your API Key

To prevent unauthorized usage and reduce costs:

1. In Google Cloud Console, go to your API key settings
2. Click "Restrict Key"
3. Under "Application restrictions":
   - Choose "HTTP referrers" for web apps
   - Choose "Android apps" for Android apps
   - Choose "iOS apps" for iOS apps
4. Under "API restrictions":
   - Select "Restrict key"
   - Choose only "Directions API"

### 4. Test the Setup

1. Run your app
2. Click "Get Directions" on any bin
3. You should now see a route that follows roads instead of a straight line

## Features

With proper routing enabled, you'll get:

- ✅ **Road-based routes** that follow actual streets and highways
- ✅ **Accurate distances** based on the actual route
- ✅ **Realistic travel times** for driving and walking
- ✅ **Multiple travel modes** (driving, walking, cycling)
- ✅ **Automatic fallback** to straight-line routes if the API is unavailable

## Troubleshooting

### Route Still Shows as Straight Line
- Check that your API key is correctly set in `maps.ts`
- Verify that Directions API is enabled in Google Cloud Console
- Check the console logs for any API errors
- Ensure you have sufficient API quota

### API Key Errors
- Make sure the API key is valid and not expired
- Check that Directions API is enabled for your project
- Verify API restrictions aren't blocking your requests

### High API Costs
- Consider implementing caching for frequently requested routes
- Set up API quotas and billing alerts in Google Cloud Console
- Use the fallback straight-line routing for development/testing

## Fallback Behavior

If the Google Maps API is unavailable or not configured, the app will automatically fall back to straight-line routing with estimated distances and times. This ensures the app continues to work even without the API.

## Cost Considerations

Google Maps Directions API charges per request:
- First 2,500 requests per month are free
- After that, it's $5.00 per 1,000 requests
- Consider implementing route caching for frequently used routes

## Support

If you encounter issues:
1. Check the browser/app console for error messages
2. Verify your API key configuration
3. Test with a simple route first
4. Check Google Cloud Console for API usage and errors
