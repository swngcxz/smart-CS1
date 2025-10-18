import { useState } from 'react';
import { useApiPost, useApiGet } from './useApi';
import api from '@/lib/api';

export interface AvailableBin {
  binId: string;
  name: string;
  location: string;
  type: string;
  bin_level: number;
  latitude: number;
  longitude: number;
  gps_valid: boolean;
  last_active: number;
}

export interface BinRegistrationData {
  binId: string;
  customName?: string;
  customLocation?: string;
  assignedLocation?: string;
}

export interface BinRegistrationResponse {
  success: boolean;
  message: string;
  binId: string;
  registrationData: any;
}

export interface RegisteredBin {
  binId: string;
  assignedLocation: string;
  customName: string;
  customLocation: string;
  registeredAt: number;
  bin_level: number;
  weight_percent: number;
  height_percent: number;
  latitude: number;
  longitude: number;
  gps_valid: boolean;
  timestamp: number;
  type: string;
}

// Hook for getting available bins from Firebase
export function useAvailableBins() {
  const [availableBins, setAvailableBins] = useState<AvailableBin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchAvailableBins = async (forceRefresh = false) => {
    // Prevent excessive fetching - only fetch if more than 10 seconds have passed or forced
    const now = Date.now();
    if (!forceRefresh && now - lastFetch < 10000) {
      console.log('Skipping available bins fetch - too recent');
      return availableBins;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/available');
      console.log('Available bins:', response.data);
      setAvailableBins(response.data.availableBins || []);
      setLastFetch(now);
      return response.data.availableBins || [];
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Failed to fetch available bins';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { availableBins, fetchAvailableBins, isLoading, error };
}

// Hook for registering bins
export function useRegisterBin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerBin = async (registrationData: BinRegistrationData): Promise<BinRegistrationResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/register', registrationData);
      console.log('Bin registered successfully:', response.data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Failed to register bin';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { registerBin, isLoading, error };
}

// Hook for getting registered bins
export function useRegisteredBins() {
  const [registeredBins, setRegisteredBins] = useState<RegisteredBin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchRegisteredBins = async (forceRefresh = false) => {
    // Prevent excessive fetching - only fetch if more than 5 seconds have passed or forced
    const now = Date.now();
    if (!forceRefresh && now - lastFetch < 5000) {
      console.log('Skipping registered bins fetch - too recent');
      return registeredBins;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/registered');
      console.log('Registered bins:', response.data);
      setRegisteredBins(response.data.registeredBins || []);
      setLastFetch(now);
      return response.data.registeredBins || [];
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Failed to fetch registered bins';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { registeredBins, fetchRegisteredBins, isLoading, error };
}
