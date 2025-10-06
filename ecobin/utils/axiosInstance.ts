
import axios from 'axios';
import {
  API_BASE_URL,
  API_FALLBACK_LOCALHOST,
  API_FALLBACK_ANDROID_EMULATOR,
  API_TIMEOUT,
  API_DEBUG,
} from '@env';
import { shouldShowErrorPopup, sanitizeErrorMessage } from './errorConfig';

// Direct URL configuration - no fallbacks needed

// Build BASE_URLS - force correct IP for mobile
export const BASE_URLS = {
  web: 'http://localhost:8000',
  mobile: 'http://192.168.254.114:8000', // Force correct IP
  local: 'http://localhost:8000',
  android_emulator: 'http://10.0.2.2:8000',
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

// Enhanced debug logging to show which URL is being used (only in development)
if (__DEV__) {
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
    // Enhanced error logging
    if (API_DEBUG === 'true') {
      console.log('📡 Mobile App - Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: error.message,
        code: error.code,
        data: error.response?.data
      });
    }
    
    // Improve error message for network issues
    if (!error.response) {
      if (API_DEBUG === 'true') {
        console.log('🌐 Mobile App - Network Error: No response from server');
      }
      error.message = 'Network error. Please check your internet connection and try again.';
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
