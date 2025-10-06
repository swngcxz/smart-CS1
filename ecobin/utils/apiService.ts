import axios from 'axios';
import {
  API_BASE_URL,
  API_FALLBACK_LOCALHOST,
  API_FALLBACK_ANDROID_EMULATOR,
  API_TIMEOUT,
  API_DEBUG,
} from '@env';

// Direct endpoint configuration - no old fallbacks

// Build endpoints array - force correct IP first
const buildAPIEndpoints = () => {
  const endpoints = [];
  
  // Force the correct working IP as first priority
  endpoints.push('http://192.168.254.114:8000');
  
  // Add primary endpoint from .env if different
  if (API_BASE_URL && API_BASE_URL !== 'http://192.168.254.114:8000') {
    endpoints.push(API_BASE_URL);
  }
  
  // Add fallback endpoints from .env
  if (API_FALLBACK_LOCALHOST && API_FALLBACK_LOCALHOST !== 'http://192.168.254.114:8000') {
    endpoints.push(API_FALLBACK_LOCALHOST);
  }
  
  if (API_FALLBACK_ANDROID_EMULATOR && API_FALLBACK_ANDROID_EMULATOR !== 'http://192.168.254.114:8000') {
    endpoints.push(API_FALLBACK_ANDROID_EMULATOR);
  }
  
  return endpoints;
};

const API_ENDPOINTS = buildAPIEndpoints();

let currentEndpoint = API_ENDPOINTS[0];

// Enhanced debug logging to show environment variable usage (only in development)
if (__DEV__) {
  console.log('🔧 API Service - Environment Variables Status:', {
    API_BASE_URL: API_BASE_URL || 'NOT SET',
    API_FALLBACK_LOCALHOST: API_FALLBACK_LOCALHOST || 'NOT SET',
    API_FALLBACK_ANDROID_EMULATOR: API_FALLBACK_ANDROID_EMULATOR || 'NOT SET',
    API_TIMEOUT: API_TIMEOUT || 'NOT SET',
    API_DEBUG: API_DEBUG || 'NOT SET',
  });
  console.log('🔧 API Service - Final Endpoint Priority:', API_ENDPOINTS);
  console.log('🔧 API Service - Using Primary Endpoint:', currentEndpoint);
}


const api = axios.create({
  baseURL: currentEndpoint,
  timeout: parseInt(API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to try different endpoints
const tryEndpoints = async (endpointIndex = 0) => {
  if (endpointIndex >= API_ENDPOINTS.length) {
    throw new Error('Network error. Please check your internet connection and try again.');
  }
  
  const endpoint = API_ENDPOINTS[endpointIndex];
  api.defaults.baseURL = endpoint;
  currentEndpoint = endpoint;
  
  if (API_DEBUG === 'true') {
    console.log(`🔄 Mobile App - Trying endpoint ${endpointIndex + 1}/${API_ENDPOINTS.length}: ${endpoint}`);
  }
  
  try {
    const response = await api.get('/api/bin1');
    if (API_DEBUG === 'true') {
      console.log(`✅ Mobile App - Connected to API at: ${endpoint}`);
    }
    return response;
  } catch (error: any) {
    if (API_DEBUG === 'true') {
      console.log(`❌ Mobile App - Failed to connect to: ${endpoint}`, error.message);
    }
    return tryEndpoints(endpointIndex + 1);
  }
};

export interface BinLocation {
  id: string;
  name: string;
  position: [number, number];
  level: number;
  status: 'normal' | 'warning' | 'critical';
  lastCollection: string;
  route: string;
  gps_valid: boolean;
  satellites: number;
  timestamp?: number;
  weight_kg?: number;
  distance_cm?: number;
  coordinates_source?: string;
  last_active?: string;
  gps_timestamp?: string;
}

export interface BinLocationsResponse {
  bins: BinLocation[];
  center: [number, number];
  totalBins: number;
  lastUpdate: string;
}

export interface Bin1Data {
  latitude?: number;
  longitude?: number;
  gps_valid: boolean;
  satellites: number;
  bin_level: number;
  weight_percent: number;
  height_percent: number;
  timestamp: number;
  weight_kg?: number;
  distance_cm?: number;
  coordinates_source?: string;
  last_active?: string;
  gps_timestamp?: string;
}

export const apiService = {
  // Fetch all dynamic bin locations
  async getBinLocations(): Promise<BinLocationsResponse> {
    try {
      const response = await api.get('/api/bin-locations');
      return response.data;
    } catch (error) {
      if (API_DEBUG === 'true') {
        console.log('🔄 Mobile App - Retrying bin locations with different endpoint...');
      }
      try {
        const response = await tryEndpoints();
        return response.data;
      } catch (retryError) {
        if (API_DEBUG === 'true') {
          console.error('Error fetching bin locations:', retryError);
        }
        throw new Error('Failed to fetch bin locations');
      }
    }
  },

  // Fetch bin1 real-time data
  async getBin1Data(): Promise<Bin1Data> {
    try {
      const response = await api.get('/api/bin1');
      return response.data;
    } catch (error) {
      if (API_DEBUG === 'true') {
        console.log('🔄 Mobile App - Retrying bin1 data with different endpoint...');
      }
      try {
        const response = await tryEndpoints();
        return response.data;
      } catch (retryError) {
        if (API_DEBUG === 'true') {
          console.error('Error fetching bin1 data:', retryError);
        }
        throw new Error('Failed to fetch bin1 data');
      }
    }
  },

  // Fetch general bin data
  async getBinData(): Promise<any> {
    try {
      const response = await api.get('/api/bin');
      return response.data;
    } catch (error) {
      if (API_DEBUG === 'true') {
        console.error('Error fetching bin data:', error);
      }
      throw new Error('Failed to fetch bin data');
    }
  },

  // Fetch GPS history for tracking
  async getGPSHistory(): Promise<any[]> {
    try {
      const response = await api.get('/api/gps-history');
      return response.data;
    } catch (error) {
      if (API_DEBUG === 'true') {
        console.error('Error fetching GPS history:', error);
      }
      return [];
    }
  }
};

export default apiService;
