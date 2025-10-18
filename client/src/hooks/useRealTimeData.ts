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
  const [bin2Data, setBin2Data] = useState<BinData | null>(null);
  const [allBinsData, setAllBinsData] = useState<BinData[]>([]);
  const [monitoringData, setMonitoringData] = useState<BinData | null>(null);
  const [backupCoordinates, setBackupCoordinates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gpsHistory, setGpsHistory] = useState<Array<{lat: number, lng: number, timestamp: number}>>([]);

  // Fetch initial data - Get all bins from Firebase
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        console.log('Fetching all bins data from Firebase...');
        
        // Fetch all bins data and backup coordinates with better error handling
      const [allBinsResponse, backupResponse] = await Promise.allSettled([
        api.get('/api/all'),
          api.get('/api/gps-backup/display/bin1').catch(err => {
            console.warn('Backup coordinates not available:', err.message);
            return { data: null };
          })
        ]);

        // Handle all bins response
        if (allBinsResponse.status === 'fulfilled' && allBinsResponse.value.data?.success) {
          const bins = allBinsResponse.value.data.bins;
          console.log('All bins data received:', bins);
          
          // Set individual bin data
          bins.forEach((bin: any) => {
            if (bin.binId === 'bin1') {
              setBin1Data(bin);
              console.log('Bin1 data set:', bin);
            } else if (bin.binId === 'bin2') {
              setBin2Data(bin);
              console.log('Bin2 data set:', bin);
            } else if (bin.binId === 'data') {
              setMonitoringData(bin);
              console.log('Monitoring data set:', bin);
            }
          });
          
          setAllBinsData(bins);
          
          // Track GPS history for all bins
          bins.forEach((bin: any) => {
            if (bin.gps_valid && bin.latitude && bin.longitude) {
            setGpsHistory(prev => [...prev, {
                lat: bin.latitude,
                lng: bin.longitude,
                timestamp: bin.timestamp,
                binId: bin.binId
              }].slice(-100)); // Keep last 100 points for all bins
            }
          });
        } else {
          console.log('No bins data received from API');
          setBin1Data(null);
          setBin2Data(null);
          setAllBinsData([]);
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
        setBin2Data(null);
        setAllBinsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Set up real-time updates using polling - get all bins data
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [allBinsResponse, backupResponse] = await Promise.allSettled([
          api.get('/api/all'),
          api.get('/api/gps-backup/display/bin1').catch(err => {
            console.warn('Backup coordinates not available in polling:', err.message);
            return { data: null };
          })
        ]);

        // Handle all bins response
        if (allBinsResponse.status === 'fulfilled' && allBinsResponse.value.data?.success) {
          const bins = allBinsResponse.value.data.bins;
          console.log('Polling update - all bins data:', bins);
          
          // Update individual bin data
          bins.forEach((bin: any) => {
            if (bin.binId === 'bin1') {
              setBin1Data(bin);
              console.log('Bin1 updated:', bin.bin_level, 'Status:', getStatusFromLevel(bin.bin_level));
            } else if (bin.binId === 'bin2') {
              setBin2Data(bin);
              console.log('Bin2 updated:', bin.bin_level, 'Status:', getStatusFromLevel(bin.bin_level));
            } else if (bin.binId === 'data') {
              setMonitoringData(bin);
              console.log('Monitoring data updated:', bin.bin_level, 'Status:', getStatusFromLevel(bin.bin_level));
            }
          });
          
          setAllBinsData(bins);
          
          // Track GPS history for all bins
          bins.forEach((bin: any) => {
            if (bin.gps_valid && bin.latitude && bin.longitude) {
            setGpsHistory(prev => [...prev, {
                lat: bin.latitude,
                lng: bin.longitude,
                timestamp: bin.timestamp,
                binId: bin.binId
              }].slice(-100)); // Keep last 100 points for all bins
            }
          });
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
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Convert Firebase data to waste bin format - use actual data from Firebase for all bins
  const getWasteBins = (): WasteBin[] => {
    const bins: WasteBin[] = [];
    
    // Process all bins from Firebase
    allBinsData.forEach((binData) => {
      if (binData) {
        console.log(`Converting ${binData.binId} to WasteBin format:`, binData);
      
      // Calculate level from weight_percent if bin_level is not available or very low
        const calculatedLevel = (binData.bin_level && binData.bin_level > 0) ? binData.bin_level : (binData.weight_percent || 0);
        
        // Determine location name based on bin ID
        let locationName = 'Unknown Location';
        if (binData.binId === 'bin1') {
          locationName = 'Central Plaza';
        } else if (binData.binId === 'bin2') {
          locationName = 'East Wing';
        } else if (binData.binId === 'data') {
          locationName = 'S1Bin3';
        } else {
          locationName = binData.name || `Bin ${binData.binId}`;
        }
      
      bins.push({
          id: binData.binId,
          location: locationName,
        level: calculatedLevel,
        status: getStatusFromLevel(calculatedLevel),
          lastCollected: getTimeAgoUtil(binData.timestamp).text,
        capacity: '500L',
          wasteType: binData.type || 'Mixed',
        nextCollection: getNextCollectionTime(calculatedLevel),
          binData: binData
        });
        
        console.log(`Created WasteBin for ${binData.binId}:`, bins[bins.length - 1]);
      }
    });
    
    if (bins.length === 0) {
      console.log('No bins data available for conversion - waiting for Firebase data');
    } else {
      console.log(`Created ${bins.length} waste bins from Firebase data`);
    }
    
    return bins;
  };

  // Create dynamic bin locations with live coordinates for all bins
  const getDynamicBinLocations = () => {
    const locations = [];
    
    // Process all bins from Firebase
    allBinsData.forEach((binData) => {
      if (binData) {
      // Determine coordinates: use live GPS if valid, otherwise use fallback
      let coordinates: [number, number];
      let coordinatesSource: string;
      
        if (binData.latitude && binData.longitude) {
        // ESP32 provides coordinates (either live GPS or cached)
          coordinates = [binData.latitude, binData.longitude];
          coordinatesSource = binData.coordinates_source || 'gps_live';
      } else {
        // No coordinates from ESP32 - use default fallback position
        coordinates = [10.24371, 123.786917]; // Default Central Plaza coordinates
        coordinatesSource = 'no_data';
      }
        
        // Determine location name based on bin ID
        let locationName = 'Unknown Location';
        if (binData.binId === 'bin1') {
          locationName = 'Central Plaza';
        } else if (binData.binId === 'bin2') {
          locationName = 'East Wing';
        } else if (binData.binId === 'data') {
          locationName = 'S1Bin3';
        } else {
          locationName = binData.name || `Bin ${binData.binId}`;
        }
      
      locations.push({
          id: binData.binId,
          name: locationName,
        position: coordinates,
          level: binData.bin_level || 0,
          status: getStatusFromLevel(binData.bin_level || 0),
          lastCollection: getTimeAgoUtil(binData.timestamp).text,
        route: 'Route A - Central',
          gps_valid: binData.gps_valid,
          satellites: binData.satellites,
          timestamp: binData.timestamp,
          weight_kg: binData.weight_kg,
          distance_cm: binData.distance_cm,
        coordinates_source: coordinatesSource,
          last_active: binData.last_active,
          gps_timestamp: binData.gps_timestamp,
          type: binData.type,
          mainLocation: binData.mainLocation,
        backup_timestamp: backupCoordinates?.coordinates?.timestamp || backupCoordinates?.backup_timestamp
      });
    }
    });
    
    console.log(`Created ${locations.length} dynamic bin locations from Firebase data`);
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