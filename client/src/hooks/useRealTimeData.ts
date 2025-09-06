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
  const [dynamicBinLocations, setDynamicBinLocations] = useState<any[]>([]);

  // Fetch initial data - bin1 and dynamic locations
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching initial data from Firebase...');
        
        // Fetch bin1 data
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

        // Create dynamic bin locations from bin1 data
        if (bin1Response.data && bin1Response.data.latitude && bin1Response.data.longitude && bin1Response.data.latitude !== 0 && bin1Response.data.longitude !== 0) {
          const dynamicBins = [{
            id: 'monitoring-bin1',
            name: 'Central Plaza',
            position: [bin1Response.data.latitude, bin1Response.data.longitude],
            level: bin1Response.data.bin_level || 0,
            status: getStatusFromLevel(bin1Response.data.bin_level || 0),
            lastCollection: bin1Response.data.timestamp ? new Date(bin1Response.data.timestamp).toISOString() : new Date().toISOString(),
            route: 'Route A - Central',
            gps_valid: Boolean(bin1Response.data.gps_valid),
            satellites: parseInt(bin1Response.data.satellites) || 0
          }];
          console.log('🗺️ Dynamic bin locations created:', dynamicBins);
          setDynamicBinLocations(dynamicBins);
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

  // Set up real-time updates using polling - bin1 data and dynamic locations
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

        // Update dynamic bin locations from bin1 data
        if (bin1Response.data && bin1Response.data.latitude && bin1Response.data.longitude && bin1Response.data.latitude !== 0 && bin1Response.data.longitude !== 0) {
          const dynamicBins = [{
            id: 'monitoring-bin1',
            name: 'Central Plaza',
            position: [bin1Response.data.latitude, bin1Response.data.longitude],
            level: bin1Response.data.bin_level || 0,
            status: getStatusFromLevel(bin1Response.data.bin_level || 0),
            lastCollection: bin1Response.data.timestamp ? new Date(bin1Response.data.timestamp).toISOString() : new Date().toISOString(),
            route: 'Route A - Central',
            gps_valid: Boolean(bin1Response.data.gps_valid),
            satellites: parseInt(bin1Response.data.satellites) || 0
          }];
          console.log('🔄 Polling update - bin locations:', dynamicBins);
          setDynamicBinLocations(dynamicBins);
        }
        
        setError(null);
      } catch (err: any) {
        console.error('❌ Error fetching real-time data:', err);
        setError(err.message || 'Failed to fetch real-time data');
      }
    }, 5000); // Poll every 5 seconds

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

  return {
    bin1Data,
    monitoringData,
    wasteBins: getWasteBins(),
    dynamicBinLocations,
    gpsHistory,
    loading,
    error,
    refresh: () => {
      setLoading(true);
      // Trigger a refresh by refetching data
      api.get('/api/bin1').then(res => {
        setBin1Data(res.data);
        // Update dynamic bin locations
        if (res.data && res.data.latitude && res.data.longitude && res.data.latitude !== 0 && res.data.longitude !== 0) {
          const dynamicBins = [{
            id: 'monitoring-bin1',
            name: 'Central Plaza',
            position: [res.data.latitude, res.data.longitude],
            level: res.data.bin_level || 0,
            status: getStatusFromLevel(res.data.bin_level || 0),
            lastCollection: res.data.timestamp ? new Date(res.data.timestamp).toISOString() : new Date().toISOString(),
            route: 'Route A - Central',
            gps_valid: Boolean(res.data.gps_valid),
            satellites: parseInt(res.data.satellites) || 0
          }];
          setDynamicBinLocations(dynamicBins);
        }
      }).catch(console.error);
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