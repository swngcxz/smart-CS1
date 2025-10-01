import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService, BinLocation, Bin1Data } from '../utils/apiService';

export interface BinData {
  weight_kg?: number;
  weight_percent: number;
  distance_cm?: number;
  height_percent: number;
  bin_level: number;
  latitude?: number;
  longitude?: number;
  gps_valid: boolean;
  satellites: number;
  timestamp: number;
  bin_id?: string;
  gps_timestamp?: string;
  last_active?: string;
  coordinates_source?: string;
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

  // Fetch data function (shared by initial and real-time)
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        console.log('🔄 Mobile App - Fetching initial data from Firebase...');
      }
      
      // Only fetch bin1 data as requested (from API)
      const bin1Response = await apiService.getBin1Data();

      // Fetch GPS/telemetry directly from Firebase RTDB and merge
      let firebaseData: Partial<BinData> | null = null;
      try {
        const rtdbUrl = 'https://smartwaste-b3f0f-default-rtdb.firebaseio.com/monitoring/bin1.json';
        const res = await fetch(rtdbUrl);
        if (res.ok) {
          const json = await res.json();
          firebaseData = {
            bin_level: json?.bin_level,
            weight_kg: json?.weight_kg,
            weight_percent: json?.weight_percent,
            distance_cm: json?.distance_cm,
            height_percent: json?.height_percent,
            latitude: json?.latitude,
            longitude: json?.longitude,
            gps_valid: Boolean(json?.gps_valid),
            satellites: typeof json?.satellites === 'number' ? json.satellites : 0,
            timestamp: json?.gps_timestamp ? Date.parse(json.gps_timestamp) : json?.timestamp,
            last_active: json?.last_active,
            coordinates_source: json?.coordinates_source,
            gps_timestamp: json?.gps_timestamp
          } as Partial<BinData>;
        } else {
          console.log('ℹ️ RTDB fetch not ok:', res.status);
        }
      } catch (e) {
        console.log('ℹ️ RTDB fetch failed, will rely on API data:', e);
      }

      console.log('📡 Mobile App - API Response:', bin1Response);
      if (bin1Response) {
        const merged = { ...bin1Response, ...(firebaseData || {}) } as BinData;
        console.log('🔥 Mobile App - Real-time bin1 data (merged):', merged);
        console.log('📊 Mobile App - Bin Level:', merged.bin_level, 'Status:', getStatusFromLevel(merged.bin_level || 0));
        setBin1Data(merged);
        setLastUpdate(new Date().toISOString());
        
        // Track GPS history if valid
        if (merged.gps_valid && merged.latitude && merged.longitude) {
          setGpsHistory(prev => [...prev, {
            lat: merged.latitude!,
            lng: merged.longitude!,
            timestamp: merged.timestamp
          }].slice(-50)); // Keep last 50 points
        }
      } else {
        console.log('⚠️ Mobile App - No bin1 data received from API');
      }
      
      setError(null);
    } catch (err: any) {
      console.error('❌ Mobile App - Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, []);

  // Convert Firebase data to waste bin format - ONLY use bin1 for Central Plaza
  const getWasteBins = useCallback((): WasteBin[] => {
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
  }, [bin1Data]);

  // Create dynamic bin locations with GPS fallback logic
  const getDynamicBinLocations = useCallback(() => {
    const locations = [];
    
    // Always add bin1 if we have any bin data (continuous monitoring)
    if (bin1Data) {
      // Determine coordinates: use ESP32 cached coordinates if available, otherwise use fallback
      let coordinates: [number, number];
      let coordinatesSource: string;
      
      if (bin1Data.latitude && bin1Data.longitude) {
        // ESP32 provides coordinates (either live GPS or cached)
        coordinates = [bin1Data.latitude, bin1Data.longitude];
        coordinatesSource = bin1Data.coordinates_source || 'gps_live';
      } else {
        // No coordinates from ESP32 - use default fallback position
        coordinates = [10.24371, 123.786917]; // Default Central Plaza coordinates
        coordinatesSource = 'no_data';
      }
      
      locations.push({
        id: 'bin1',
        name: 'Central Plaza',
        position: coordinates,
        level: bin1Data.bin_level || 0,
        status: getStatusFromLevel(bin1Data.bin_level || 0),
        lastCollection: bin1Data.last_active || getTimeAgo(bin1Data.timestamp),
        route: 'Route A - Central',
        gps_valid: bin1Data.gps_valid,
        satellites: bin1Data.satellites,
        timestamp: bin1Data.timestamp,
        weight_kg: bin1Data.weight_kg,
        distance_cm: bin1Data.distance_cm,
        coordinates_source: coordinatesSource,
        last_active: bin1Data.last_active,
        gps_timestamp: bin1Data.gps_timestamp
      });
    }
    
    return locations;
  }, [bin1Data]);

  // GPS utility functions
  const getCurrentGPSLocation = () => {
    return bin1Data?.gps_valid ? bin1Data : monitoringData?.gps_valid ? monitoringData : null;
  };

  const isGPSValid = () => {
    // Check if we have any valid GPS data (live or cached)
    return Boolean((bin1Data?.latitude && bin1Data?.longitude) ||
                   (monitoringData?.latitude && monitoringData?.longitude));
  };

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    // Initial fetch
    fetchData(true);
  }, [fetchData]);

  // Set up interval for real-time updates
  useEffect(() => {
    const interval = setInterval(() => fetchData(false), refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  // Memoize expensive calculations
  const binLocations = useMemo(() => getDynamicBinLocations(), [getDynamicBinLocations]);
  const wasteBins = useMemo(() => getWasteBins(), [getWasteBins]);

  return {
    binLocations,
    bin1Data,
    wasteBins,
    dynamicBinLocations: binLocations,
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