import { useState, useEffect, useCallback } from 'react';
import { apiService, BinLocation, Bin1Data } from '../utils/apiService';

export interface BinData {
  weight_kg: number;
  weight_percent: number;
  distance_cm: number;
  height_percent: number;
  bin_level: number;
  latitude: number;
  longitude: number;
  gps_valid: boolean;
  satellites: number;
  timestamp: number;
  bin_id?: string;
}

export interface WasteBin {
  id: string;
  location: string;
  level: number;
  status: 'normal' | 'warning' | 'critical';
  lastCollected: string;
  capacity: string;
  wasteType: string;
  nextCollection: string;
  binData?: BinData;
}

export interface UseRealTimeDataReturn {
  binLocations: BinLocation[];
  bin1Data: Bin1Data | null;
  wasteBins: WasteBin[];
  dynamicBinLocations: any[];
  gpsHistory: Array<{lat: number, lng: number, timestamp: number}>;
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
  refetch: () => Promise<void>;
  isGPSValid: () => boolean;
  getCurrentGPSLocation: () => BinData | null;
  getSafeCoordinates: () => { latitude: number; longitude: number; isOffline: boolean; timeSinceLastGPS: string };
  getTimeSinceLastGPS: (timestamp: number) => string;
}

export const useRealTimeData = (refreshInterval: number = 2000): UseRealTimeDataReturn => {
  const [bin1Data, setBin1Data] = useState<BinData | null>(null);
  const [monitoringData, setMonitoringData] = useState<BinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [gpsHistory, setGpsHistory] = useState<Array<{lat: number, lng: number, timestamp: number}>>([]);
  const [lastKnownGPS, setLastKnownGPS] = useState<{
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null>(null);

  // GPS fallback functions
  const getTimeSinceLastGPS = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getSafeCoordinates = () => {
    // Check if we have valid GPS data
    if (bin1Data?.gps_valid && bin1Data?.latitude && bin1Data?.longitude) {
      // Update last known GPS
      setLastKnownGPS({
        latitude: bin1Data.latitude,
        longitude: bin1Data.longitude,
        timestamp: bin1Data.timestamp
      });
      
      return {
        latitude: bin1Data.latitude,
        longitude: bin1Data.longitude,
        isOffline: false,
        timeSinceLastGPS: 'Live'
      };
    }
    
    // Use last known GPS if available
    if (lastKnownGPS) {
      return {
        latitude: lastKnownGPS.latitude,
        longitude: lastKnownGPS.longitude,
        isOffline: true,
        timeSinceLastGPS: getTimeSinceLastGPS(lastKnownGPS.timestamp)
      };
    }
    
    // Fallback to default coordinates
    return {
      latitude: 10.2098,
      longitude: 123.758,
      isOffline: true,
      timeSinceLastGPS: 'No GPS data'
    };
  };

  // Fetch initial data - ONLY bin1 as requested
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Mobile App - Fetching initial data from Firebase...');
      
      // Only fetch bin1 data as requested
      const bin1Response = await apiService.getBin1Data();

      console.log('📡 Mobile App - API Response:', bin1Response);
      if (bin1Response) {
        console.log('🔥 Mobile App - Real-time bin1 data received:', bin1Response);
        console.log('📊 Mobile App - Bin Level:', bin1Response.bin_level, 'Status:', getStatusFromLevel(bin1Response.bin_level));
        setBin1Data(bin1Response);
        setLastUpdate(new Date().toISOString());
        
        // Track GPS history if valid
        if (bin1Response.gps_valid && bin1Response.latitude && bin1Response.longitude) {
          setGpsHistory(prev => [...prev, {
            lat: bin1Response.latitude,
            lng: bin1Response.longitude,
            timestamp: bin1Response.timestamp
          }].slice(-50)); // Keep last 50 points
        }
      } else {
        console.log('⚠️ Mobile App - No bin1 data received from API');
      }
      
      setError(null);
    } catch (err: any) {
      console.error('❌ Mobile App - Error fetching initial data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up real-time updates using polling - only bin1 data as requested
  const fetchRealTimeData = useCallback(async () => {
    try {
      const bin1Response = await apiService.getBin1Data();

      if (bin1Response) {
        console.log('🔄 Mobile App - Polling update - bin1 data:', bin1Response);
        console.log('📊 Mobile App - Bin Level:', bin1Response.bin_level, 'Status:', getStatusFromLevel(bin1Response.bin_level));
        setBin1Data(bin1Response);
        setLastUpdate(new Date().toISOString());
        
        // Track GPS history if valid
        if (bin1Response.gps_valid && bin1Response.latitude && bin1Response.longitude) {
          setGpsHistory(prev => [...prev, {
            lat: bin1Response.latitude,
            lng: bin1Response.longitude,
            timestamp: bin1Response.timestamp
          }].slice(-50)); // Keep last 50 points
        }
      }
      
      setError(null);
    } catch (err: any) {
      console.error('❌ Mobile App - Error fetching real-time data:', err);
      setError(err.message || 'Failed to fetch real-time data');
    }
  }, []);

  // Convert Firebase data to waste bin format - ONLY use bin1 for Central Plaza
  const getWasteBins = (): WasteBin[] => {
    const bins: WasteBin[] = [];
    
    // ONLY use bin1 data for Central Plaza as requested
    if (bin1Data) {
      bins.push({
        id: 'bin1',
        location: 'Central Plaza', // Map to Central Plaza for integration
        level: bin1Data.bin_level || 0,
        status: getStatusFromLevel(bin1Data.bin_level || 0),
        lastCollected: getTimeAgo(bin1Data.timestamp),
        capacity: '500L',
        wasteType: 'Mixed',
        nextCollection: getNextCollectionTime(bin1Data.bin_level || 0),
        binData: bin1Data
      });
    }
    
    return bins;
  };

  // Create dynamic bin locations with live coordinates
  const getDynamicBinLocations = () => {
    const locations = [];
    
    // Add bin1 with live coordinates from real-time database
    if (bin1Data && bin1Data.gps_valid && bin1Data.latitude && bin1Data.longitude) {
      locations.push({
        id: 'bin1',
        name: 'Central Plaza',
        position: [bin1Data.latitude, bin1Data.longitude] as [number, number],
        level: bin1Data.bin_level || 0,
        status: getStatusFromLevel(bin1Data.bin_level || 0),
        lastCollection: getTimeAgo(bin1Data.timestamp),
        route: 'Route A - Central',
        gps_valid: bin1Data.gps_valid,
        satellites: bin1Data.satellites,
        timestamp: bin1Data.timestamp,
        weight_kg: bin1Data.weight_kg,
        distance_cm: bin1Data.distance_cm
      });
    }
    
    return locations;
  };

  // GPS utility functions
  const getCurrentGPSLocation = () => {
    return bin1Data?.gps_valid ? bin1Data : monitoringData?.gps_valid ? monitoringData : null;
  };

  const isGPSValid = () => {
    return (bin1Data?.gps_valid && bin1Data?.latitude && bin1Data?.longitude) ||
           (monitoringData?.gps_valid && monitoringData?.latitude && monitoringData?.longitude);
  };

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    // Initial fetch
    fetchInitialData();
  }, [fetchInitialData]);

  // Set up interval for real-time updates
  useEffect(() => {
    const interval = setInterval(fetchRealTimeData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchRealTimeData, refreshInterval]);

  return {
    binLocations: getDynamicBinLocations(),
    bin1Data,
    wasteBins: getWasteBins(),
    dynamicBinLocations: getDynamicBinLocations(),
    gpsHistory,
    loading,
    error,
    lastUpdate,
    refetch,
    isGPSValid,
    getCurrentGPSLocation,
    getSafeCoordinates,
    getTimeSinceLastGPS
  };
};

// Helper functions
function getStatusFromLevel(level: number): 'normal' | 'warning' | 'critical' {
  if (level >= 85) return 'critical';
  if (level >= 70) return 'warning';
  if (level > 0) return 'normal';
  return 'normal'; // Handle 0 level as normal
}

function getTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Just now';
  
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

function getNextCollectionTime(level: number): string {
  if (level >= 85) return 'Immediate';
  if (level >= 70) return 'Today 3:00 PM';
  return 'Tomorrow 9:00 AM';
}