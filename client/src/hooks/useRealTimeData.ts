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
  binId?: string; // Alternative property name used in API responses
  name?: string;
  type?: string;
  coordinates_source?: string;
  last_active?: number;
  gps_timestamp?: number;
  mainLocation?: string;
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
        // console.log('Fetching all bins data from Firebase...'); // Reduced logging
        
        // Fetch all bins data and backup coordinates with better error handling
      const [allBinsResponse, backupResponse] = await Promise.allSettled([
        api.get('/api/all'),
          api.get('/api/gps-backup/display/bin1').catch(err => {
            // console.warn('Backup coordinates not available:', err.message); // Reduced logging
            return { data: null };
          })
        ]);

        // Handle all bins response
        if (allBinsResponse.status === 'fulfilled' && allBinsResponse.value.data?.success) {
          const bins = allBinsResponse.value.data.bins;
          console.log('All bins data received:', bins.length, 'bins'); // Keep but simplified
          // console.log('🔍 BINS DEBUG - Available bin IDs:', bins.map((b: any) => b.binId)); // Reduced logging
          // console.log('🔍 BINS DEBUG - Bin2 in response:', bins.find((b: any) => b.binId === 'bin2')); // Reduced logging
          
          // Set individual bin data (exclude backup data)
          bins.forEach((bin: any) => {
            if (bin.binId === 'bin1') {
              setBin1Data(bin);
              // console.log('Bin1 data set:', bin); // Reduced logging
            } else if (bin.binId === 'bin2') {
              setBin2Data(bin);
              // console.log('🔄 INITIAL BIN2 DATA SET:', { // Reduced logging
              //   bin_level: bin.bin_level,
              //   weight_percent: bin.weight_percent,
              //   timestamp: bin.timestamp,
              //   status: getStatusFromLevel(bin.bin_level),
              //   fullData: bin
              // });
            } else if (bin.binId === 'data') {
              setMonitoringData(bin);
              // console.log('Monitoring data set:', bin); // Reduced logging
            }
            // Skip backup data - it's not a bin
          });
          
          setAllBinsData(bins);
          
          // Track GPS history for all bins (exclude backup data)
          bins.forEach((bin: any) => {
            if (bin.binId !== 'backup' && bin.gps_valid && bin.latitude && bin.longitude) {
            setGpsHistory(prev => [...prev, {
                lat: bin.latitude,
                lng: bin.longitude,
                timestamp: bin.timestamp,
                binId: bin.binId
              }].slice(-100)); // Keep last 100 points for all bins
            }
          });
        } else {
          // console.log('No bins data received from API'); // Reduced logging
          setBin1Data(null);
          setBin2Data(null);
          setAllBinsData([]);
        }
        
        // Handle backup response
        if (backupResponse.status === 'fulfilled' && backupResponse.value.data) {
          // console.log('Backup coordinates received:', backupResponse.value.data); // Reduced logging
          // Transform backup data to match expected structure
          const backupData = backupResponse.value.data;
          if (backupData.coordinates) {
            setBackupCoordinates(backupData);
          } else if (backupData.bin1) {
            // Handle direct backup structure
            setBackupCoordinates({
              coordinates: {
                latitude: backupData.bin1.backup_latitude,
                longitude: backupData.bin1.backup_longitude,
                timestamp: backupData.bin1.backup_timestamp
              }
            });
          }
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
      // console.log("⏰ useRealTimeData - Polling for updates..."); // Reduced logging
      try {
        const [allBinsResponse, backupResponse] = await Promise.allSettled([
          api.get('/api/all'),
          api.get('/api/gps-backup/display/bin1').catch(err => {
            // console.warn('Backup coordinates not available in polling:', err.message); // Reduced logging
            return { data: null };
          })
        ]);

        // Handle all bins response
        if (allBinsResponse.status === 'fulfilled' && allBinsResponse.value.data?.success) {
          const bins = allBinsResponse.value.data.bins;
          // console.log('Polling update - all bins data:', bins); // Reduced logging
          // console.log('Polling update - bin1 name:', bins.find(b => b.binId === 'bin1')?.name); // Reduced logging
          // console.log('🔍 POLLING DEBUG - Available bin IDs:', bins.map((b: any) => b.binId)); // Reduced logging
          // console.log('🔍 POLLING DEBUG - Bin2 in response:', bins.find((b: any) => b.binId === 'bin2')); // Reduced logging
          
          // Update state with new data
          setAllBinsData(bins);
          // console.log('✅ Polling update - State updated with new bin data'); // Reduced logging
          
          // Update individual bin data (exclude backup data)
          bins.forEach((bin: any) => {
            if (bin.binId === 'bin1') {
              setBin1Data(bin);
              // console.log('Bin1 updated:', bin.bin_level, 'Status:', getStatusFromLevel(bin.bin_level)); // Reduced logging
            } else if (bin.binId === 'bin2') {
              setBin2Data(bin);
              // console.log('🔄 BIN2 UPDATED:', { // Reduced logging
              //   bin_level: bin.bin_level,
              //   weight_percent: bin.weight_percent,
              //   timestamp: bin.timestamp,
              //   status: getStatusFromLevel(bin.bin_level),
              //   fullData: bin
              // });
            } else if (bin.binId === 'data') {
              setMonitoringData(bin);
              // console.log('Monitoring data updated:', bin.bin_level, 'Status:', getStatusFromLevel(bin.bin_level)); // Reduced logging
            }
            // Skip backup data - it's not a bin
          });
          
          setAllBinsData(bins);
          
          // Track GPS history for all bins (exclude backup data)
          bins.forEach((bin: any) => {
            if (bin.binId !== 'backup' && bin.gps_valid && bin.latitude && bin.longitude) {
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
          // console.log('Polling failed, keeping existing data'); // Reduced logging
        }
        
        // Handle backup response
        if (backupResponse.status === 'fulfilled' && backupResponse.value.data) {
          // console.log('Polling update - backup coordinates:', backupResponse.value.data); // Reduced logging
          // Transform backup data to match expected structure
          const backupData = backupResponse.value.data;
          if (backupData.coordinates) {
            setBackupCoordinates(backupData);
          } else if (backupData.bin1) {
            // Handle direct backup structure
            setBackupCoordinates({
              coordinates: {
                latitude: backupData.bin1.backup_latitude,
                longitude: backupData.bin1.backup_longitude,
                timestamp: backupData.bin1.backup_timestamp
              }
            });
          }
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
    
    // Process all bins from Firebase (exclude backup data)
    allBinsData.forEach((binData) => {
      const binId = binData.binId || binData.bin_id;
      if (binData && binId !== 'backup') {
        console.log(`Converting ${binId} to WasteBin format:`, binData);
      
      // Calculate level from weight_percent if bin_level is not available or very low
        const calculatedLevel = (binData.bin_level && binData.bin_level > 0) ? binData.bin_level : (binData.weight_percent || 0);
        
        // Determine location name based on bin ID - use standardized location names
        let locationName = 'Unknown Location';
        if (binId === 'bin1') {
          locationName = 'Central Plaza';
        } else if (binId === 'bin2') {
          locationName = 'Park Avenue';
        } else if (binId === 'data') {
          locationName = 'S1Bin3';
        } else {
          // For other bins, try to extract location from name or use fallback
          if (binData.name) {
            // Extract location from name (e.g., "Central Plaza Bin1" -> "Central Plaza")
            const nameParts = binData.name.split(' ');
            if (nameParts.length >= 2) {
              locationName = nameParts.slice(0, -1).join(' '); // Remove last word (usually "Bin1", "Bin2", etc.)
            } else {
              locationName = binData.name;
            }
          } else {
            locationName = `Bin ${binId}`;
          }
        }
      
      bins.push({
          id: binId,
          location: locationName,
        level: calculatedLevel,
        status: getStatusFromLevel(calculatedLevel),
          lastCollected: getTimeAgoUtil(binData.timestamp).text,
        capacity: '500L',
          wasteType: binData.type || 'Mixed',
        nextCollection: getNextCollectionTime(calculatedLevel),
          binData: binData
        });
        
        console.log(`Created WasteBin for ${binId}:`, bins[bins.length - 1]);
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
    
    // Process all bins from Firebase (exclude backup data)
    allBinsData.forEach((binData) => {
      const binId = binData.binId || binData.bin_id;
      if (binData && binId !== 'backup') {
      // Determine coordinates: use live GPS if valid, otherwise use backup coordinates
      let coordinates: [number, number];
      let coordinatesSource: string;
      
        if (binData.latitude && binData.longitude && binData.latitude !== 0 && binData.longitude !== 0) {
        // ESP32 provides valid coordinates (either live GPS or cached)
          coordinates = [binData.latitude, binData.longitude];
          coordinatesSource = binData.coordinates_source || 'gps_live';
      } else if (backupCoordinates?.coordinates && binId === 'bin1') {
        // Use backup coordinates for bin1 when GPS is offline
        coordinates = [backupCoordinates.coordinates.latitude, backupCoordinates.coordinates.longitude];
        coordinatesSource = 'gps_backup';
      } else if (binId === 'bin2') {
        // For bin2, use slightly offset coordinates from bin1 backup (since no bin2 backup available)
        const bin1BackupLat = backupCoordinates?.coordinates?.latitude || 10.24371;
        const bin1BackupLng = backupCoordinates?.coordinates?.longitude || 123.786917;
        // Offset bin2 by ~100 meters northeast
        coordinates = [bin1BackupLat + 0.0009, bin1BackupLng + 0.0009];
        coordinatesSource = 'gps_backup_offset';
      } else {
        // No coordinates available - use default fallback position
        coordinates = [10.24371, 123.786917]; // Default Central Plaza coordinates
        coordinatesSource = 'no_data';
      }
        
        // Determine location name based on bin ID - use standardized location names
        let locationName = 'Unknown Location';
        if (binId === 'bin1') {
          locationName = 'Central Plaza';
        } else if (binId === 'bin2') {
          locationName = 'Park Avenue';
        } else if (binId === 'data') {
          locationName = 'S1Bin3';
        } else {
          // For other bins, try to extract location from name or use fallback
          if (binData.name) {
            // Extract location from name (e.g., "Central Plaza Bin1" -> "Central Plaza")
            const nameParts = binData.name.split(' ');
            if (nameParts.length >= 2) {
              locationName = nameParts.slice(0, -1).join(' '); // Remove last word (usually "Bin1", "Bin2", etc.)
            } else {
              locationName = binData.name;
            }
          } else {
            locationName = `Bin ${binId}`;
          }
        }
      
      locations.push({
          id: binId,
          name: binData.name || locationName, // Use actual bin name from database, fallback to location name
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
      
      console.log(`📍 Created DynamicBinLocation for ${binId}:`, {
        id: binId,
        name: binData.name || locationName,
        locationName: locationName,
        coordinates: coordinates,
        coordinatesSource: coordinatesSource
      });
    }
    });
    
    console.log(`Created ${locations.length} dynamic bin locations from Firebase data`);
    return locations;
  };

  return {
    bin1Data,
    bin2Data,
    monitoringData,
    wasteBins: getWasteBins(),
    dynamicBinLocations: getDynamicBinLocations(),
    gpsHistory,
    loading,
    error,
    isUsingMockData: false, // Always false since we're not using mock data
    refresh: async () => {
      console.log("🔄 useRealTimeData - Manual refresh triggered");
      setLoading(true);
      try {
        // Trigger a refresh by refetching all bins data
        const [allBinsResponse, backupResponse] = await Promise.allSettled([
          api.get('/api/all'),
          api.get('/api/gps-backup/display/bin1').catch(err => {
            console.warn('Backup coordinates not available during refresh:', err.message);
            return { data: null };
          })
        ]);

        // Handle all bins response
        if (allBinsResponse.status === 'fulfilled' && allBinsResponse.value.data?.success) {
          const bins = allBinsResponse.value.data.bins;
          console.log('Manual refresh - all bins data:', bins);
          
          // Update individual bin data (exclude backup data)
          bins.forEach((bin: any) => {
            if (bin.binId === 'bin1') {
              setBin1Data(bin);
              console.log('Manual refresh - Bin1 updated:', bin);
            } else if (bin.binId === 'bin2') {
              setBin2Data(bin);
              console.log('Manual refresh - Bin2 updated:', bin);
            } else if (bin.binId === 'data') {
              setMonitoringData(bin);
              console.log('Manual refresh - Monitoring data updated:', bin);
            }
            // Skip backup data - it's not a bin
          });
          
          setAllBinsData(bins);
        }
        
        // Handle backup response
        if (backupResponse.status === 'fulfilled' && backupResponse.value.data) {
          console.log('Manual refresh - backup coordinates:', backupResponse.value.data);
          // Transform backup data to match expected structure
          const backupData = backupResponse.value.data;
          if (backupData.coordinates) {
            setBackupCoordinates(backupData);
          } else if (backupData.bin1) {
            // Handle direct backup structure
            setBackupCoordinates({
              coordinates: {
                latitude: backupData.bin1.backup_latitude,
                longitude: backupData.bin1.backup_longitude,
                timestamp: backupData.bin1.backup_timestamp
              }
            });
          }
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