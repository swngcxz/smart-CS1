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
  gps_timeout?: boolean; // Add missing property
  satellites: number;
  timestamp: number;
  bin_id?: string;
  gps_timestamp?: string;
  last_active?: string;
  coordinates_source?: string;
  backup_timestamp?: string; // Add backup timestamp field
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
  getSafeCoordinates: () => { latitude: number; longitude: number; isOffline: boolean; timeSinceLastGPS: string; source?: string };
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

  const getSafeCoordinates = useCallback((): { latitude: number; longitude: number; isOffline: boolean; timeSinceLastGPS: string; source?: string } => {
    // Always return valid coordinates - never undefined
    // This matches the server-side dynamic status logic
    
    // Check if we have fresh GPS data (not stale/timeout)
    const isGPSFresh = bin1Data?.gps_valid && 
                      !bin1Data?.gps_timeout && 
                      bin1Data?.coordinates_source === 'gps_live' &&
                      bin1Data?.latitude && 
                      bin1Data?.longitude &&
                      bin1Data.latitude !== 0 &&
                      bin1Data.longitude !== 0;
    
    if (isGPSFresh && bin1Data.latitude !== undefined && bin1Data.longitude !== undefined) {
      return {
        latitude: bin1Data.latitude,
        longitude: bin1Data.longitude,
        isOffline: false,
        timeSinceLastGPS: 'Live',
        source: 'gps_live'
      };
    }
    
    // Use last known GPS if available (backup coordinates)
    if (lastKnownGPS && lastKnownGPS.latitude && lastKnownGPS.longitude) {
      return {
        latitude: lastKnownGPS.latitude,
        longitude: lastKnownGPS.longitude,
        isOffline: true,
        timeSinceLastGPS: getTimeSinceLastGPS(lastKnownGPS.timestamp),
        source: 'gps_backup'
      };
    }
    
    // Fallback to default coordinates (Central Plaza) - ALWAYS return valid coordinates
    return {
      latitude: 10.24371,
      longitude: 123.786917,
      isOffline: true,
      timeSinceLastGPS: 'No GPS data',
      source: 'default'
    };
  }, [bin1Data, lastKnownGPS, getTimeSinceLastGPS]);

  // Fetch data function - OPTIMIZED
  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        console.log('🔄 Mobile App - Fetching initial data from Firebase...');
      }
      
      // Fetch bin1 data and backup coordinates (same as web dashboard)
      const [bin1Response, backupResponse] = await Promise.all([
        apiService.getBin1Data(),
        apiService.getBinCoordinatesForDisplay('bin1').catch(err => {
          console.warn('⚠️ Mobile App - Backup coordinates not available:', err.message);
          return null;
        })
      ]);

      if (bin1Response) {
        // Merge bin1 data with backup coordinates data (same as web dashboard)
        const merged = {
          ...bin1Response,
          // Add timestamp fields from backup coordinates if available
          last_active: backupResponse?.last_active || bin1Response.last_active,
          gps_timestamp: backupResponse?.gps_timestamp || bin1Response.gps_timestamp,
          backup_timestamp: backupResponse?.backup_timestamp,
          coordinates_source: backupResponse?.coordinates_source || bin1Response.coordinates_source
        } as BinData;
        
        // Only update state if data has actually changed to prevent unnecessary re-renders
        setBin1Data(prevData => {
          if (!prevData || 
              prevData.bin_level !== merged.bin_level ||
              prevData.timestamp !== merged.timestamp ||
              prevData.latitude !== merged.latitude ||
              prevData.longitude !== merged.longitude) {
            
            // Only log when data actually changes
            console.log('📡 Mobile App - API Response:', bin1Response);
            console.log('📡 Mobile App - Backup Response:', backupResponse);
            console.log('🔥 Mobile App - Real-time bin1 data (merged):', merged);
            console.log('📊 Mobile App - Bin Level:', merged.bin_level, 'Status:', getStatusFromLevel(merged.bin_level || 0));
            console.log('🕒 Mobile App - Timestamp fields:', {
              last_active: merged.last_active,
              gps_timestamp: merged.gps_timestamp,
              backup_timestamp: merged.backup_timestamp,
              coordinates_source: merged.coordinates_source
            });
            
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

  // Create dynamic bin locations with GPS fallback logic (same as server)
  const getDynamicBinLocations = useCallback(async () => {
    const locations = [];
    
    // Always add bin1 if we have any bin data (continuous monitoring)
    if (bin1Data) {
      let coordinates: [number, number];
      let coordinatesSource: string;
      let gpsValid = false;
      let satellites = 0;
      
      // First, check if we have valid live GPS data from bin1Data
      const isLiveGPSValid = bin1Data.gps_valid && 
                            !bin1Data.gps_timeout && 
                            bin1Data.coordinates_source === 'gps_live' &&
                            bin1Data.latitude && 
                            bin1Data.longitude &&
                            bin1Data.latitude !== 0 &&
                            bin1Data.longitude !== 0;
      
      if (isLiveGPSValid && bin1Data.latitude !== undefined && bin1Data.longitude !== undefined) {
        // Use live GPS data directly
        coordinates = [bin1Data.latitude, bin1Data.longitude];
        coordinatesSource = 'gps_live';
        gpsValid = true;
        satellites = bin1Data.satellites || 0;
        
        console.log(`[MOBILE] Using live GPS coordinates: ${coordinates[0]}, ${coordinates[1]}`);
      } else {
        // Try to get backup coordinates from server
        try {
          const displayResponse = await apiService.getBinCoordinatesForDisplay('bin1');
          const coordinatesData = displayResponse?.coordinates;
          
          if (coordinatesData && coordinatesData.latitude && coordinatesData.longitude &&
              coordinatesData.latitude !== 0 && coordinatesData.longitude !== 0) {
            coordinates = [coordinatesData.latitude, coordinatesData.longitude];
            coordinatesSource = coordinatesData.source || 'gps_backup';
            gpsValid = false; // Backup coordinates are not live
            satellites = bin1Data.satellites || 0;
            
            console.log(`[MOBILE] Using ${coordinatesSource} coordinates: ${coordinates[0]}, ${coordinates[1]}`);
          } else {
            // Fallback to default coordinates (Central Plaza)
            coordinates = [10.24371, 123.786917];
            coordinatesSource = 'default';
            gpsValid = false;
            satellites = 0;
            console.log('[MOBILE] Using default coordinates (Central Plaza)');
          }
        } catch (error) {
          console.error('[MOBILE] Error fetching backup coordinates:', error);
          // Fallback to default coordinates (Central Plaza)
          coordinates = [10.24371, 123.786917];
          coordinatesSource = 'default';
          gpsValid = false;
          satellites = 0;
          console.log('[MOBILE] Using default coordinates due to API error');
        }
      }
      
      locations.push({
        id: 'bin1',
        name: 'Central Plaza',
        position: coordinates,
        level: bin1Data.bin_level || 0,
        status: getStatusFromLevel(bin1Data.bin_level || 0),
        lastCollection: bin1Data.last_active || getTimeAgo(bin1Data.timestamp),
        route: 'Route A - Central',
        gps_valid: bin1Data.gps_valid, // Use original GPS validity flag
        gps_timeout: bin1Data.gps_timeout, // Use original GPS timeout flag
        satellites: satellites,
        timestamp: bin1Data.timestamp,
        weight_kg: bin1Data.weight_kg,
        distance_cm: bin1Data.distance_cm,
        coordinates_source: bin1Data.coordinates_source, // Use original coordinates source
        last_active: bin1Data.last_active,
        gps_timestamp: bin1Data.gps_timestamp,
        latitude: bin1Data.latitude, // Include original coordinates for validation
        longitude: bin1Data.longitude
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
  const [binLocations, setBinLocations] = useState<any[]>([]);
  const wasteBins = useMemo(() => getWasteBins(), [getWasteBins]);
  
  // Update binLocations when bin1Data changes
  useEffect(() => {
    const updateBinLocations = async () => {
      try {
        const locations = await getDynamicBinLocations();
        setBinLocations(locations);
      } catch (error) {
        console.error('Error updating bin locations:', error);
        setBinLocations([]);
      }
    };
    
    updateBinLocations();
  }, [getDynamicBinLocations]);

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

