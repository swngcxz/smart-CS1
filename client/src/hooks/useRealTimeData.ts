import { useState, useEffect } from 'react';
import api from '@/lib/api';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gpsHistory, setGpsHistory] = useState<Array<{lat: number, lng: number, timestamp: number}>>([]);

  // Fetch initial data - ONLY bin1 as requested
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching initial data from Firebase...');
        
        // Only fetch bin1 data as requested
        const bin1Response = await api.get('/api/bin1');

        console.log('📡 API Response:', bin1Response);
        if (bin1Response.data) {
          console.log('🔥 Real-time bin1 data received:', bin1Response.data);
          console.log('📊 Bin Level:', bin1Response.data.bin_level, 'Status:', getStatusFromLevel(bin1Response.data.bin_level));
          setBin1Data(bin1Response.data);
          // Track GPS history if valid
          if (bin1Response.data.gps_valid && bin1Response.data.latitude && bin1Response.data.longitude) {
            setGpsHistory(prev => [...prev, {
              lat: bin1Response.data.latitude,
              lng: bin1Response.data.longitude,
              timestamp: bin1Response.data.timestamp
            }].slice(-50)); // Keep last 50 points
          }
        } else {
          console.log('⚠️ No bin1 data received from API');
        }
        
        setError(null);
      } catch (err: any) {
        console.error('❌ Error fetching initial data:', err);
        setError(err.message || 'Failed to fetch data');
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
        const bin1Response = await api.get('/api/bin1');

        if (bin1Response.data) {
          console.log('🔄 Polling update - bin1 data:', bin1Response.data);
          console.log('📊 Bin Level:', bin1Response.data.bin_level, 'Status:', getStatusFromLevel(bin1Response.data.bin_level));
          setBin1Data(bin1Response.data);
          // Track GPS history if valid
          if (bin1Response.data.gps_valid && bin1Response.data.latitude && bin1Response.data.longitude) {
            setGpsHistory(prev => [...prev, {
              lat: bin1Response.data.latitude,
              lng: bin1Response.data.longitude,
              timestamp: bin1Response.data.timestamp
            }].slice(-50)); // Keep last 50 points
          }
        }
        
        setError(null);
      } catch (err: any) {
        console.error('❌ Error fetching real-time data:', err);
        setError(err.message || 'Failed to fetch real-time data');
      }
    }, 1500); // Poll every 1.5 seconds - OPTIMIZED

    return () => clearInterval(interval);
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
        name: 'Central Plaza',
        position: coordinates,
        level: bin1Data.bin_level || 0,
        status: getStatusFromLevel(bin1Data.bin_level || 0),
        lastCollection: getTimeAgo(bin1Data.timestamp),
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
  };

  return {
    bin1Data,
    monitoringData,
    wasteBins: getWasteBins(),
    dynamicBinLocations: getDynamicBinLocations(),
    gpsHistory,
    loading,
    error,
    refresh: () => {
      setLoading(true);
      // Trigger a refresh by refetching data
      api.get('/api/bin1').then(res => setBin1Data(res.data)).catch(console.error);
      api.get('/api/bin').then(res => setMonitoringData(res.data)).catch(console.error);
      setLoading(false);
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