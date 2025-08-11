import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

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

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [bin1Response, monitoringResponse] = await Promise.all([
          axiosInstance.get('/api/bin1'),
          axiosInstance.get('/api/bin')
        ]);
        if (bin1Response.data) setBin1Data(bin1Response.data);
        if (monitoringResponse.data) setMonitoringData(monitoringResponse.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [bin1Response, monitoringResponse] = await Promise.all([
          axiosInstance.get('/api/bin1'),
          axiosInstance.get('/api/bin')
        ]);
        if (bin1Response.data) setBin1Data(bin1Response.data);
        if (monitoringResponse.data) setMonitoringData(monitoringResponse.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch real-time data');
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getWasteBins = (): WasteBin[] => {
    const bins: WasteBin[] = [];
    if (bin1Data) {
      bins.push({
        id: 'bin1',
        location: 'Central Plaza',
        level: bin1Data.bin_level || 0,
        status: getStatusFromLevel(bin1Data.bin_level || 0),
        lastCollected: getTimeAgo(bin1Data.timestamp),
        capacity: '500L',
        wasteType: 'Mixed',
        nextCollection: getNextCollectionTime(bin1Data.bin_level || 0),
        binData: bin1Data
      });
    }
    if (monitoringData) {
      bins.push({
        id: 'monitoring',
        location: 'Central Plaza',
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
      axiosInstance.get('/api/bin1').then(res => setBin1Data(res.data)).catch(console.error);
      axiosInstance.get('/api/bin').then(res => setMonitoringData(res.data)).catch(console.error);
      setLoading(false);
    }
  };
}

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
