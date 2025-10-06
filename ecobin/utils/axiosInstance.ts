
import axios from 'axios';
import {
  API_BASE_URL,
  API_FALLBACK_LOCALHOST,
  API_FALLBACK_ANDROID_EMULATOR,
  API_TIMEOUT,
  API_DEBUG,
} from '@env';
import { shouldShowErrorPopup, sanitizeErrorMessage } from './errorConfig';

// Fallback URLs in case environment variables are not loaded
const FALLBACK_URLS = {
  web: 'http://localhost:8000',
  mobile: 'http://10.0.0.117:8000',
  local: 'http://localhost:8000',
  android_emulator: 'http://10.0.2.2:8000',
};

// Build BASE_URLS prioritizing environment variables
export const BASE_URLS = {
  web: API_FALLBACK_LOCALHOST || API_BASE_URL || FALLBACK_URLS.web,
  mobile: API_BASE_URL || API_FALLBACK_LOCALHOST || FALLBACK_URLS.mobile,
  local: API_FALLBACK_LOCALHOST || API_BASE_URL || FALLBACK_URLS.local,
  android_emulator: API_FALLBACK_ANDROID_EMULATOR || API_BASE_URL || FALLBACK_URLS.android_emulator,
};


// Create axios instance with environment variable priority
const instance = axios.create({
  baseURL: BASE_URLS.mobile,
  timeout: parseInt(API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for authentication
});

// Enhanced debug logging to show which URL is being used
if (API_DEBUG === 'true') {
  console.log('🔧 Axios Instance - Environment Variables Status:', {
    API_BASE_URL: API_BASE_URL || 'NOT SET',
    API_FALLBACK_LOCALHOST: API_FALLBACK_LOCALHOST || 'NOT SET',
    API_FALLBACK_ANDROID_EMULATOR: API_FALLBACK_ANDROID_EMULATOR || 'NOT SET',
    API_TIMEOUT: API_TIMEOUT || 'NOT SET',
  });
  console.log('🔧 Axios Instance - Available Base URLs:', BASE_URLS);
  console.log('🔧 Axios Instance - Using Mobile URL:', BASE_URLS.mobile);
}

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
    
    // Check if we should show error popup (usually false for better UX)
    if (shouldShowErrorPopup(error)) {
      // Only show critical errors as popups
      const sanitizedMessage = sanitizeErrorMessage(error);
      console.warn('🚨 Critical Error:', sanitizedMessage);
    }
    
    // Always reject the promise so components can handle errors
    return Promise.reject(error);
  }
);

export default instance;
