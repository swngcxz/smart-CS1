// ecobin/config/maps.ts
// Google Maps API Configuration
// 
// To use proper road-based routing instead of straight lines, you need to:
// 1. Get a Google Maps API key from Google Cloud Console
// 2. Enable the "Directions API" in your Google Cloud project
// 3. Replace 'YOUR_GOOGLE_MAPS_API_KEY' below with your actual API key

export const MAPS_CONFIG = {
  // Replace this with your actual Google Maps API key
  apiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
  
  // Optional: Configure API restrictions for security
  restrictions: {
    // Restrict API key to specific domains/IPs if needed
    allowedReferrers: [], // Add your domain(s) here
    allowedIPs: [], // Add your server IPs here
  }
};

// Instructions for getting a Google Maps API key:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select an existing one
// 3. Enable the "Directions API" for your project
// 4. Go to "Credentials" and create an API key
// 5. Copy the API key and replace 'YOUR_GOOGLE_MAPS_API_KEY' above
// 6. (Recommended) Restrict the API key to your app for security
