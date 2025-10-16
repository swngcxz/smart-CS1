import { useState, useCallback } from 'react';
import apiClient from '@/utils/apiConfig';

export interface ActivityLog {
  id: string;
  bin_id: string;
  bin_location: string;
  bin_level: number;
  activity_type: string;
  task_note?: string;
  assigned_janitor_id?: string;
  assigned_janitor_name?: string;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  completion_notes?: string;
  photos?: string[];
  bin_condition?: 'good' | 'damaged' | 'needs_repair';
  collected_weight?: number;
  collection_time?: string;
  user_id?: string;
  user_name?: string;
}


export function useActivityLogs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Fetch activity logs for a specific user
  const fetchUserActivityLogs = useCallback(async (userId?: string): Promise<ActivityLog[]> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/api/activitylogs');
      
      if (response.data && response.data.activities) {
        // Filter logs relevant to the user
        const userLogs = response.data.activities.filter((log: ActivityLog) => 
          log.assigned_janitor_id === userId || 
          log.user_id === userId ||
          log.status === 'pending' // Include pending tasks available for acceptance
        );
        
        return userLogs;
      }
      
      return [];
    } catch (err: any) {
      console.error('Failed to fetch activity logs:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch activity logs';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get activity log by ID
  const getActivityLogById = useCallback(async (activityId: string): Promise<ActivityLog | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(`/api/activitylogs/${activityId}`);
      
      if (response.data) {
        return response.data;
      }
      
      return null;
    } catch (err: any) {
      console.error('Failed to fetch activity log:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch activity log';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    fetchUserActivityLogs,
    getActivityLogById,
    clearError
  };
}
