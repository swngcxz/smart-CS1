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
  // New fields for task status updates
  taskStatus?: 'available' | 'accepted' | 'completed';
  acceptedBy?: string;
  acceptedById?: string;
  completedBy?: string;
  completedById?: string;
  availableForAcceptance?: boolean;
};

export function useNotifications(janitorId?: string, { auto = true, intervalMs = 10000 }: { auto?: boolean; intervalMs?: number } = {}) {
  const [notifications, setNotifications] = useState<JanitorNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const hasJanitorId = useMemo(() => Boolean(janitorId && janitorId.length > 0), [janitorId]);

  const fetchNotifications = useCallback(async () => {
    if (!hasJanitorId) {
      setNotifications([]);
      setError(null);
      return;
    }
    
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/bin-notifications/janitor/${janitorId}?limit=100`);
      const list: JanitorNotification[] = res.data?.notifications || [];
      setNotifications(list);
      setError(null);
    } catch (err: any) {
      // Always set empty notifications for any error - this is normal behavior
      setNotifications([]);
      setError(null); // Never show errors to user for notifications
      
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 Mobile App - Notifications fetch failed (handled silently):', {
          janitorId,
          error: err.message,
          status: err.response?.status,
          reason: 'No notifications exist yet or network issue'
        });
      }
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


