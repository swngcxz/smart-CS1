import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

export type JanitorNotification = {
  id: string;
  binId: string;
  type: string;
  title: string;
  message: string;
  status?: string;
  binLevel?: number | null;
  gps?: { lat: number; lng: number };
  timestamp: string | Date;
  read?: boolean;
};

export function useNotifications(janitorId?: string, { auto = true, intervalMs = 10000 }: { auto?: boolean; intervalMs?: number } = {}) {
  const [notifications, setNotifications] = useState<JanitorNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const hasJanitorId = useMemo(() => Boolean(janitorId && janitorId.length > 0), [janitorId]);

  const fetchNotifications = useCallback(async () => {
    if (!hasJanitorId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/bin-notifications/janitor/${janitorId}?limit=100`);
      const list: JanitorNotification[] = res.data?.notifications || [];
      setNotifications(list);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [hasJanitorId, janitorId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await axiosInstance.put(`/api/bin-notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!auto || !hasJanitorId) return;
    fetchNotifications();
  }, [auto, hasJanitorId, fetchNotifications]);

  useEffect(() => {
    if (!auto || !hasJanitorId) return;
    const id = setInterval(fetchNotifications, intervalMs);
    return () => clearInterval(id);
  }, [auto, hasJanitorId, fetchNotifications, intervalMs]);

  return { notifications, loading, error, refresh: fetchNotifications, markAsRead, setNotifications };
}


