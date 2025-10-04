
import axios from 'axios';

// You can switch these as needed for web, mobile, or local
export const BASE_URLS = {
  web: 'http://localhost:8000', // Web deployment - localhost for local development
  mobile: 'http://192.168.254.114:8000', // Mobile (Expo/React Native) - use actual IP for device access
  local: 'http://localhost:8000', // Local development
  android_emulator: 'http://10.0.2.2:8000', // Android emulator host
};

// Default to mobile for now
const instance = axios.create({
  baseURL: BASE_URLS.mobile,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for authentication
});

// Add request interceptor for debugging
instance.interceptors.request.use(
  (config) => {
    console.log('📡 Mobile App - API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('📡 Mobile App - Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
instance.interceptors.response.use(
  (response) => {
    console.log('📡 Mobile App - API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('📡 Mobile App - Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default instance;
