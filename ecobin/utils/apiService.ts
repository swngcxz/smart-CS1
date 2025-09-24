import axios from 'axios';

// Try multiple endpoints for mobile development
const API_ENDPOINTS = [
  'http://192.168.100.106:8000', // Computer's IP address
  'http://localhost:8000',     // Fallback for simulator
  'http://10.0.2.2:8000',     // Android emulator host
];

let currentEndpoint = API_ENDPOINTS[0];

const api = axios.create({
  baseURL: currentEndpoint,
  timeout: 10000,
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
    console.log(`✅ Mobile App - Connected to API at: ${endpoint}`);
    return response;
  } catch (error) {
    console.log(`❌ Mobile App - Failed to connect to: ${endpoint}`);
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
  timestamp?: string;
  weight_kg?: number;
  distance_cm?: number;
}

export interface BinLocationsResponse {
  bins: BinLocation[];
  center: [number, number];
  totalBins: number;
  lastUpdate: string;
}

export interface Bin1Data {
  latitude: number;
  longitude: number;
  gps_valid: boolean;
  satellites: number;
  bin_level: number;
  weight_percent: number;
  height_percent: number;
  timestamp: number;
}

export const apiService = {
  // Fetch all dynamic bin locations
  async getBinLocations(): Promise<BinLocationsResponse> {
    try {
      const response = await api.get('/api/bin-locations');
      return response.data;
    } catch (error) {
      console.log('🔄 Mobile App - Retrying bin locations with different endpoint...');
      try {
        const response = await tryEndpoints();
        return response.data;
      } catch (retryError) {
        console.error('Error fetching bin locations:', retryError);
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
      console.log('🔄 Mobile App - Retrying bin1 data with different endpoint...');
      try {
        const response = await tryEndpoints();
        return response.data;
      } catch (retryError) {
        console.error('Error fetching bin1 data:', retryError);
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
      console.error('Error fetching bin data:', error);
      throw new Error('Failed to fetch bin data');
    }
  },

  // Fetch GPS history for tracking
  async getGPSHistory(): Promise<any[]> {
    try {
      const response = await api.get('/api/gps-history');
      return response.data;
    } catch (error) {
      console.error('Error fetching GPS history:', error);
      return [];
    }
  }
};

export default apiService;
