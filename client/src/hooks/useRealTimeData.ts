import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { getTimeAgo as getTimeAgoUtil } from '@/utils/timeUtils';

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

export function useRealTimeData() {
  const [bin1Data, setBin1Data] = useState<BinData | null>(null);
  const [monitoringData, setMonitoringData] = useState<BinData | null>(null);
  const [backupCoordinates, setBackupCoordinates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gpsHistory, setGpsHistory] = useState<Array<{lat: number, lng: number, timestamp: number}>>([]);

  // Fetch initial data - ONLY bin1 as requested
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        console.log('Fetching initial data from Firebase...');
        
        // Fetch bin1 data and backup coordinates with better error handling
        const [bin1Response, backupResponse] = await Promise.allSettled([
          api.get('/api/bin1'),
          api.get('/api/gps-backup/display/bin1').catch(err => {
            console.warn('Backup coordinates not available:', err.message);
            return { data: null };
          })
        ]);

        // Handle bin1 response
        if (bin1Response.status === 'fulfilled' && bin1Response.value.data) {
          console.log('Real-time bin1 data received:', bin1Response.value.data);
          console.log('Bin Level:', bin1Response.value.data.bin_level, 'Status:', getStatusFromLevel(bin1Response.value.data.bin_level));
          setBin1Data(bin1Response.value.data);
          // Track GPS history if valid
          if (bin1Response.value.data.gps_valid && bin1Response.value.data.latitude && bin1Response.value.data.longitude) {
            setGpsHistory(prev => [...prev, {
              lat: bin1Response.value.data.latitude,
              lng: bin1Response.value.data.longitude,
              timestamp: bin1Response.value.data.timestamp
            }].slice(-50)); // Keep last 50 points
          }
        } else {
          console.log('No bin1 data received from API');
          setBin1Data(null);
        }
        
        // Handle backup response
        if (backupResponse.status === 'fulfilled' && backupResponse.value.data) {
          console.log('Backup coordinates received:', backupResponse.value.data);
          setBackupCoordinates(backupResponse.value.data);
        }
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching initial data:', err);
        setError(err.message || 'Failed to fetch data');
        setBin1Data(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Set up real-time updates using polling - only bin1 data as requested
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [bin1Response, backupResponse] = await Promise.allSettled([
          api.get('/api/bin1'),
          api.get('/api/gps-backup/display/bin1').catch(err => {
            console.warn('Backup coordinates not available in polling:', err.message);
            return { data: null };
          })
        ]);

        // Handle bin1 response
        if (bin1Response.status === 'fulfilled' && bin1Response.value.data) {
          console.log('Polling update - bin1 data:', bin1Response.value.data);
          console.log('Bin Level:', bin1Response.value.data.bin_level, 'Status:', getStatusFromLevel(bin1Response.value.data.bin_level));
          setBin1Data(bin1Response.value.data);
          // Track GPS history if valid
          if (bin1Response.value.data.gps_valid && bin1Response.value.data.latitude && bin1Response.value.data.longitude) {
            setGpsHistory(prev => [...prev, {
              lat: bin1Response.value.data.latitude,
              lng: bin1Response.value.data.longitude,
              timestamp: bin1Response.value.data.timestamp
            }].slice(-50)); // Keep last 50 points
          }
        } else {
          // If polling fails, keep existing data and don't spam errors
          console.log('Polling failed, keeping existing data');
        }
        
        // Handle backup response
        if (backupResponse.status === 'fulfilled' && backupResponse.value.data) {
          console.log('Polling update - backup coordinates:', backupResponse.value.data);
          setBackupCoordinates(backupResponse.value.data);
        }
        
        setError(null);
      } catch (err: any) {
        // Log all errors for debugging Firebase connection issues
        console.error('Error fetching real-time data:', err);
        setError(err.message || 'Failed to fetch real-time data');
      }
    }, 5000); // Increased interval to 5 seconds to reduce load

    return () => clearInterval(interval);
  }, []);

  // Convert Firebase data to waste bin format - use actual data from Firebase
  const getWasteBins = (): WasteBin[] => {
    const bins: WasteBin[] = [];
    
    // Use actual bin1 data from Firebase
    if (bin1Data) {
      console.log('Converting bin1Data to WasteBin format:', bin1Data);
      
      // Calculate level from weight_percent if bin_level is not available or very low
      const calculatedLevel = (bin1Data.bin_level && bin1Data.bin_level > 0) ? bin1Data.bin_level : (bin1Data.weight_percent || 0);
      
      bins.push({
        id: 'bin1',
        location: 'Central Plaza', // Standardize location name for filtering
        level: calculatedLevel,
        status: getStatusFromLevel(calculatedLevel),
        lastCollected: getTimeAgoUtil(bin1Data.timestamp).text,
        capacity: '500L',
        wasteType: bin1Data.type || 'Mixed',
        nextCollection: getNextCollectionTime(calculatedLevel),
        binData: bin1Data
      });
      
      console.log('Created WasteBin:', bins[0]);
    } else {
      console.log('No bin1Data available for conversion - waiting for Firebase data');
    }
    
    return bins;
  };

  // Create dynamic bin locations with live coordinates or GPS fallback
  const getDynamicBinLocations = () => {
    const locations = [];
    
    // Always add bin1 if we have any bin data (continuous monitoring)
    if (bin1Data) {
      // Determine coordinates: use live GPS if valid, otherwise use fallback
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
        name: bin1Data.name || 'Central Plaza', // Use actual name from Firebase
        position: coordinates,
        level: bin1Data.bin_level || 0,
        status: getStatusFromLevel(bin1Data.bin_level || 0),
        lastCollection: getTimeAgoUtil(bin1Data.timestamp).text,
        route: 'Route A - Central',
        gps_valid: bin1Data.gps_valid,
        satellites: bin1Data.satellites,
        timestamp: bin1Data.timestamp,
        weight_kg: bin1Data.weight_kg,
        distance_cm: bin1Data.distance_cm,
        coordinates_source: coordinatesSource,
        last_active: bin1Data.last_active,
        gps_timestamp: bin1Data.gps_timestamp,
        type: bin1Data.type, // Include type from Firebase
        mainLocation: bin1Data.mainLocation, // Include mainLocation from Firebase
        // Include backup coordinates timestamp for proper time calculation
        backup_timestamp: backupCoordinates?.coordinates?.timestamp || backupCoordinates?.backup_timestamp
      });
    }
    
    return locations;
  };

  return {
    bin1Data,
    monitoringData,
    wasteBins: getWasteBins(),
    dynamicBinLocations: getDynamicBinLocations(),
    gpsHistory,
    loading,
    error,
    isUsingMockData: false, // Always false since we're not using mock data
    refresh: async () => {
      setLoading(true);
      try {
        // Trigger a refresh by refetching data
        const bin1Response = await api.get('/api/bin1');
        if (bin1Response.data) {
          console.log('Manual refresh - bin1 data:', bin1Response.data);
          setBin1Data(bin1Response.data);
        }
        setError(null);
      } catch (err: any) {
        console.error('Error during manual refresh:', err);
        setError(err.message || 'Failed to refresh data');
      } finally {
        setLoading(false);
      }
    },
    // GPS utility functions
    getCurrentGPSLocation: () => {
      return bin1Data?.gps_valid ? bin1Data : monitoringData?.gps_valid ? monitoringData : null;
    },
    isGPSValid: () => {
      return (bin1Data?.gps_valid && bin1Data?.latitude && bin1Data?.longitude) ||
             (monitoringData?.gps_valid && monitoringData?.latitude && monitoringData?.longitude);
    }
  };
}

// Helper functions
function getStatusFromLevel(level: number): 'normal' | 'warning' | 'critical' {
  if (level >= 85) return 'critical';
  if (level >= 70) return 'warning';
  if (level > 0) return 'normal';
  return 'normal'; // Handle 0 level as normal
}


function getNextCollectionTime(level: number): string {
  if (level >= 85) return 'Immediate';
  if (level >= 70) return 'Today 3:00 PM';
  return 'Tomorrow 9:00 AM';
} 