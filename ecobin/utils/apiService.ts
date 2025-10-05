import axios from 'axios';
import {
  API_BASE_URL,
  API_FALLBACK_LOCALHOST,
  API_FALLBACK_ANDROID_EMULATOR,
  API_TIMEOUT,
  API_DEBUG,
} from '@env';

// Fallback endpoints in case environment variables are not loaded
const FALLBACK_ENDPOINTS = [
  'http://10.0.0.117:8000',        // Current IP from .env
  'http://192.168.254.114:8000',   // Previous IP
  'http://localhost:8000',          // Localhost fallback
  'http://10.0.2.2:8000',          // Android emulator
];

// Try multiple endpoints for mobile development
const API_ENDPOINTS = [
  'http://192.168.1.13:8000', // Computer's current IP address
  API_BASE_URL || FALLBACK_ENDPOINTS[0],                    // Primary endpoint from .env
  'http://192.168.1.4:8000',  // Previous IP address (fallback)
  API_FALLBACK_LOCALHOST || FALLBACK_ENDPOINTS[2],          // Fallback for simulator
  API_FALLBACK_ANDROID_EMULATOR || FALLBACK_ENDPOINTS[3],   // Android emulator host
  ...FALLBACK_ENDPOINTS,                                     // Additional fallbacks
];

let currentEndpoint = API_ENDPOINTS[0];

// Debug logging
if (API_DEBUG === 'true') {
  console.log('🔧 API Service - Environment Variables:', {
    API_BASE_URL,
    API_FALLBACK_LOCALHOST,
    API_FALLBACK_ANDROID_EMULATOR,
    API_TIMEOUT,
    API_DEBUG,
  });
  console.log('🔧 API Service - Available Endpoints:', API_ENDPOINTS);
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
    throw new Error('All API endpoints failed');
  }
  
  const endpoint = API_ENDPOINTS[endpointIndex];
  api.defaults.baseURL = endpoint;
  currentEndpoint = endpoint;
  
  try {
    const response = await api.get('/api/bin1');
    if (API_DEBUG === 'true') {
      console.log(`✅ Mobile App - Connected to API at: ${endpoint}`);
    }
    return response;
  } catch (error) {
    if (API_DEBUG === 'true') {
      console.log(`❌ Mobile App - Failed to connect to: ${endpoint}`);
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
