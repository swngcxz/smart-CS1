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

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch both data paths
        const [bin1Response, monitoringResponse] = await Promise.all([
          api.get('/api/bin1'),
          api.get('/api/bin')
        ]);

        if (bin1Response.data) {
          setBin1Data(bin1Response.data);
        }
        
        if (monitoringResponse.data) {
          setMonitoringData(monitoringResponse.data);
        }
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching initial data:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Set up real-time updates using polling (since we don't have Firebase SDK in client)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [bin1Response, monitoringResponse] = await Promise.all([
          api.get('/api/bin1'),
          api.get('/api/bin')
        ]);

        if (bin1Response.data) {
          setBin1Data(bin1Response.data);
        }
        
        if (monitoringResponse.data) {
          setMonitoringData(monitoringResponse.data);
        }
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching real-time data:', err);
        setError(err.message || 'Failed to fetch real-time data');
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Convert Firebase data to waste bin format
  const getWasteBins = (): WasteBin[] => {
    const bins: WasteBin[] = [];
    
    // Add bin1 data if available
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
    
    // Add monitoring data if available
    if (monitoringData) {
      bins.push({
        id: 'monitoring',
        location: 'Central Plaza', // Map to Central Plaza for integration
        level: monitoringData.bin_level || 0,
        status: getStatusFromLevel(monitoringData.bin_level || 0),
        lastCollected: getTimeAgo(monitoringData.timestamp),
        capacity: '500L',
        wasteType: 'Mixed',
        nextCollection: getNextCollectionTime(monitoringData.bin_level || 0),
        binData: monitoringData
      });
    }
    
    return bins;
  };

  return {
    bin1Data,
    monitoringData,
    wasteBins: getWasteBins(),
    loading,
    error,
    refresh: () => {
      setLoading(true);
      // Trigger a refresh by refetching data
      api.get('/api/bin1').then(res => setBin1Data(res.data)).catch(console.error);
      api.get('/api/bin').then(res => setMonitoringData(res.data)).catch(console.error);
      setLoading(false);
    }
  };
}

// Helper functions
function getStatusFromLevel(level: number): 'normal' | 'warning' | 'critical' {
  if (level >= 85) return 'critical';
  if (level >= 70) return 'warning';
  return 'normal';
}

function getTimeAgo(timestamp: number): string {
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
}

function getNextCollectionTime(level: number): string {
  if (level >= 85) return 'Immediate';
  if (level >= 70) return 'Today 3:00 PM';
  return 'Tomorrow 9:00 AM';
} 