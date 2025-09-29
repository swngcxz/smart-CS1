import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface GPSFallbackCoordinates {
  binId: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
  timestamp: number;
}

export interface GPSFallbackStatus {
  isInitialized: boolean;
  cachedCoordinatesCount: number;
  cachedBins: string[];
}

export function useGPSFallback() {
  const [status, setStatus] = useState<GPSFallbackStatus | null>(null);
  const [coordinates, setCoordinates] = useState<Record<string, GPSFallbackCoordinates>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch GPS fallback status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/gps-fallback/status');
      setStatus(response.data.status);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to fetch GPS fallback status');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all fallback coordinates
  const fetchCoordinates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/gps-fallback/coordinates');
      setCoordinates(response.data.coordinates);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to fetch GPS fallback coordinates');
    } finally {
      setLoading(false);
    }
  };

  // Fetch coordinates for a specific bin
  const fetchBinCoordinates = async (binId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/gps-fallback/coordinates/${binId}`);
      return response.data.coordinates;
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || `Failed to fetch coordinates for bin ${binId}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Manually save coordinates for a bin
  const saveCoordinates = async (binId: string, latitude: number, longitude: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/api/gps-fallback/coordinates/${binId}`, {
        latitude,
        longitude
      });
      
      // Refresh coordinates after saving
      await fetchCoordinates();
      
      return response.data;
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to save coordinates');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear old coordinates
  const clearOldCoordinates = async (maxAgeHours: number = 24) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.delete(`/api/gps-fallback/coordinates/cleanup?maxAgeHours=${maxAgeHours}`);
      
      // Refresh coordinates after cleanup
      await fetchCoordinates();
      
      return response.data;
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to clear old coordinates');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchStatus();
    fetchCoordinates();
  }, []);

  return {
    status,
    coordinates,
    loading,
    error,
    fetchStatus,
    fetchCoordinates,
    fetchBinCoordinates,
    saveCoordinates,
    clearOldCoordinates,
    refetch: () => {
      fetchStatus();
      fetchCoordinates();
    }
  };
}
