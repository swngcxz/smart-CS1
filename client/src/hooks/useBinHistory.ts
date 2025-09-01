import { useState, useEffect } from 'react';

interface BinHistoryRecord {
  id: string;
  binId: string;
  timestamp: string;
  weight: number;
  distance: number;
  binLevel: number;
  gps: {
    lat: number;
    lng: number;
  };
  gpsValid: boolean;
  satellites: number;
  status: 'OK' | 'ERROR' | 'MALFUNCTION';
  errorMessage?: string;
  createdAt: string;
}

interface BinHistoryStats {
  totalRecords: number;
  errorCount: number;
  malfunctionCount: number;
  avgWeight: number;
  avgBinLevel: number;
  errorRate: string;
}

export const useBinHistory = (binId?: string) => {
  const [history, setHistory] = useState<BinHistoryRecord[]>([]);
  const [errorRecords, setErrorRecords] = useState<BinHistoryRecord[]>([]);
  const [stats, setStats] = useState<BinHistoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBinHistory = async (binId: string, limit: number = 100) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/bin-history/${binId}?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.data);
      } else {
        setError(data.message || 'Failed to fetch bin history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bin history');
    } finally {
      setLoading(false);
    }
  };

  const fetchErrorRecords = async (binId?: string, limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = binId 
        ? `/api/bin-history/errors?binId=${binId}&limit=${limit}`
        : `/api/bin-history/errors?limit=${limit}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setErrorRecords(data.data);
      } else {
        setError(data.message || 'Failed to fetch error records');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch error records');
    } finally {
      setLoading(false);
    }
  };

  const fetchBinStats = async (binId: string, startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/bin-history/${binId}/stats?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Failed to fetch bin statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bin statistics');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    if (binId) {
      fetchBinHistory(binId);
    }
  };

  useEffect(() => {
    if (binId) {
      fetchBinHistory(binId);
    }
  }, [binId]);

  return {
    history,
    errorRecords,
    stats,
    loading,
    error,
    fetchBinHistory,
    fetchErrorRecords,
    fetchBinStats,
    refetch
  };
};
