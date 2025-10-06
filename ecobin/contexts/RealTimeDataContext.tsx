import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
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

interface RealTimeDataContextType extends UseRealTimeDataReturn {}

const RealTimeDataContext = createContext<RealTimeDataContextType | undefined>(undefined);

interface RealTimeDataProviderProps {
  children: ReactNode;
  refreshInterval?: number;
}

export function RealTimeDataProvider({ children, refreshInterval = 2000 }: RealTimeDataProviderProps) {
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
  const getTimeSinceLastGPS = useCallback((timestamp: number) => {
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
  }, []);

  // Update last known GPS when bin1Data changes (separate from getSafeCoordinates to avoid render-time state updates)
  useEffect(() => {
    if (bin1Data?.gps_valid && bin1Data?.latitude && bin1Data?.longitude) {
      setLastKnownGPS({
        latitude: bin1Data.latitude,
        longitude: bin1Data.longitude,
        timestamp: bin1Data.timestamp
      });
    }
  }, [bin1Data?.gps_valid, bin1Data?.latitude, bin1Data?.longitude, bin1Data?.timestamp]);

  const getSafeCoordinates = useCallback(() => {
    // Check if we have valid GPS data
    if (bin1Data?.gps_valid && bin1Data?.latitude && bin1Data?.longitude) {
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
  }, [bin1Data, lastKnownGPS, getTimeSinceLastGPS]);

  // Fetch data function - OPTIMIZED
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        console.log('🔄 Mobile App - Fetching initial data from Firebase...');
      }
      
      // Only fetch bin1 data as requested (from API) - OPTIMIZED: Single fetch
      const bin1Response = await apiService.getBin1Data();

      if (bin1Response) {
        const merged = bin1Response as BinData;
        
        // Only update state if data has actually changed to prevent unnecessary re-renders
        setBin1Data(prevData => {
          if (!prevData || 
              prevData.bin_level !== merged.bin_level ||
              prevData.timestamp !== merged.timestamp ||
              prevData.latitude !== merged.latitude ||
              prevData.longitude !== merged.longitude) {
            
            // Only log when data actually changes
            console.log('📡 Mobile App - API Response:', bin1Response);
            console.log('🔥 Mobile App - Real-time bin1 data (merged):', merged);
            console.log('📊 Mobile App - Bin Level:', merged.bin_level, 'Status:', getStatusFromLevel(merged.bin_level || 0));
            
            // Only update lastUpdate when data changes
            setLastUpdate(new Date().toISOString());
            
            return merged;
          }
          return prevData;
        });
        
        // Track GPS history if valid - OPTIMIZED to prevent unnecessary updates
        if (merged.gps_valid && merged.latitude && merged.longitude) {
          setGpsHistory(prev => {
            const newPoint = {
              lat: merged.latitude!,
              lng: merged.longitude!,
              timestamp: merged.timestamp
            };
            
            // Only add if it's a new point (avoid duplicate entries)
            const lastPoint = prev[prev.length - 1];
            if (!lastPoint || 
                lastPoint.lat !== newPoint.lat || 
                lastPoint.lng !== newPoint.lng ||
                lastPoint.timestamp !== newPoint.timestamp) {
              return [...prev, newPoint].slice(-50); // Keep last 50 points
            }
            return prev;
          });
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
  const getCurrentGPSLocation = useCallback(() => {
    return bin1Data?.gps_valid ? bin1Data : monitoringData?.gps_valid ? monitoringData : null;
  }, [bin1Data, monitoringData]);

  const isGPSValid = useCallback(() => {
    // Check if we have any valid GPS data (live or cached)
    return Boolean((bin1Data?.latitude && bin1Data?.longitude) ||
                   (monitoringData?.latitude && monitoringData?.longitude));
  }, [bin1Data, monitoringData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    // Initial fetch
    fetchData(true);
  }, [fetchData]);

  // Set up interval for real-time updates - OPTIMIZED to prevent memory leaks
  useEffect(() => {
    // Only start interval if we're not in loading state
    if (loading) return;
    
    const interval = setInterval(() => fetchData(false), refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval, loading]);

  // Memoize expensive calculations
  const binLocations = useMemo(() => getDynamicBinLocations(), [getDynamicBinLocations]);
  const wasteBins = useMemo(() => getWasteBins(), [getWasteBins]);

  const value = {
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

  return (
    <RealTimeDataContext.Provider value={value}>
      {children}
    </RealTimeDataContext.Provider>
  );
}

export function useRealTimeData() {
  const context = useContext(RealTimeDataContext);
  if (context === undefined) {
    throw new Error('useRealTimeData must be used within a RealTimeDataProvider');
  }
  return context;
}

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
