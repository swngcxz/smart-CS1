
import axios from 'axios';

// Environment variables (hardcoded for now to avoid dotenv issues)
const API_BASE_URL = 'http://192.168.1.26:8000';
const API_FALLBACK_LOCALHOST = 'http://localhost:8000';
const API_FALLBACK_ANDROID_EMULATOR = 'http://10.0.2.2:8000';
const API_TIMEOUT = '10000';
const API_DEBUG = 'true';

// Fallback URLs in case environment variables are not loaded
const FALLBACK_URLS = {
  web: 'http://localhost:8000',
  mobile: 'http://10.0.0.117:8000',
  local: 'http://localhost:8000',
  android_emulator: 'http://10.0.2.2:8000',
};

// You can switch these as needed for web, mobile, or local
export const BASE_URLS = {
  web: API_FALLBACK_LOCALHOST || FALLBACK_URLS.web, // Web deployment - localhost for local development
  mobile: 'http://192.168.1.26:8000', // Mobile (Expo/React Native) - use actual IP for device access
  local: API_FALLBACK_LOCALHOST || FALLBACK_URLS.local, // Local development
  android_emulator: API_FALLBACK_ANDROID_EMULATOR || FALLBACK_URLS.android_emulator, // Android emulator host
};

// Debug logging
if (API_DEBUG === 'true') {
  console.log('🔧 Axios Instance - Environment Variables:', {
    API_BASE_URL,
    API_FALLBACK_LOCALHOST,
    API_FALLBACK_ANDROID_EMULATOR,
    API_TIMEOUT,
    API_DEBUG,
  });
  console.log('🔧 Axios Instance - Base URLs:', BASE_URLS);
}

// Default to mobile for now
const instance = axios.create({
  baseURL: BASE_URLS.mobile,
  timeout: parseInt(API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for authentication
});

// Add request interceptor for debugging
instance.interceptors.request.use(
  (config) => {
    if (API_DEBUG === 'true') {
      console.log('📡 Mobile App - API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        data: config.data
      });
    }
    return config;
  },
  (error) => {
    if (API_DEBUG === 'true') {
      console.error('📡 Mobile App - Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
instance.interceptors.response.use(
  (response) => {
    if (API_DEBUG === 'true') {
      console.log('📡 Mobile App - API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Only log errors in debug mode, don't show popups
    if (API_DEBUG === 'true') {
      console.log('📡 Mobile App - Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data
      });
    }
    
    // Log error for debugging
    console.warn('🚨 API Error:', error.message);
    
    // Always reject the promise so components can handle errors
    return Promise.reject(error);
  }
);

export default instance;
