import { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from './useAuth';

export interface ActivityLog {
  id: string;
  type: string;
  message: string;
  bin?: string;
  location?: string;
  time: string;
  date: string;
  [key: string]: any;
}

export function useUserActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // You may want to get the user from a global context or auth hook
  // For now, let's assume userId is available after login
  const { login } = useAuth(); // Replace with actual user context if available

  // TODO: Replace with actual userId from auth context or storage
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Example: fetch userId from async storage or context
    // setUserId(...)
    if (!userId) return;
    setLoading(true);
    axiosInstance
      .get(`/api/activitylogs/assigned/${userId}`)
      .then((res) => {
        console.log('Fetched activities:', res.data.activities);
        setLogs(res.data.activities || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to fetch activity logs');
        setLoading(false);
      });
  }, [userId]);

  return { logs, loading, error, setUserId };
}
