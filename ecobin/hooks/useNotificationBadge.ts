import { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNotifications } from './useNotifications';

export interface NotificationBadge {
  unreadCount: number;
  totalCount: number;
  hasNotifications: boolean;
  lastNotificationTime?: string;
}

export function useNotificationBadge(janitorId?: string, { auto = true, intervalMs = 5000 }: { auto?: boolean; intervalMs?: number } = {}) {
  const [badgeData, setBadgeData] = useState<NotificationBadge>({
    unreadCount: 0,
    totalCount: 0,
    hasNotifications: false
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const hasJanitorId = useMemo(() => Boolean(janitorId && janitorId.length > 0), [janitorId]);
  
  // Fallback to useNotifications hook for better reliability
  const { notifications: fallbackNotifications } = useNotifications(janitorId, { 
    auto: false, // Don't auto-fetch, we'll handle it
    intervalMs: 10000 
  });

  const fetchNotificationBadge = useCallback(async () => {
    if (!hasJanitorId) {
      // No janitor ID - set default badge data
      setBadgeData({
        unreadCount: 0,
        totalCount: 0,
        hasNotifications: false
      });
      setError(null);
      return;
    }
    
    setLoading(true);
    try {
      // Fetch notifications for badge count with better error handling
      const res = await axiosInstance.get(`/api/bin-notifications/janitor/${janitorId}?limit=50`);
      
      // Handle different response structures
      let notifications: any[] = [];
      if (res.data?.notifications) {
        notifications = res.data.notifications;
      } else if (Array.isArray(res.data)) {
        notifications = res.data;
      }
      
      // Calculate badge data
      const unreadNotifications = notifications.filter(n => n && !n.read);
      const totalCount = notifications.length;
      const unreadCount = unreadNotifications.length;
      const lastNotification = notifications.length > 0 ? notifications[0] : null;
      
      setBadgeData({
        unreadCount,
        totalCount,
        hasNotifications: unreadCount > 0,
        lastNotificationTime: lastNotification?.timestamp
      });
      
      setError(null);
    } catch (err: any) {
      // Always set default badge data for any error - this is normal behavior
      setBadgeData({
        unreadCount: 0,
        totalCount: 0,
        hasNotifications: false
      });
      setError(null); // Never show errors to user for notifications
      
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 Mobile App - Notification badge fetch failed (handled silently):', {
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

  // Fallback effect: Use existing useNotifications data when API fails
  useEffect(() => {
    if (fallbackNotifications && fallbackNotifications.length >= 0) {
      const unreadNotifications = fallbackNotifications.filter(n => n && !n.read);
      const totalCount = fallbackNotifications.length;
      const unreadCount = unreadNotifications.length;
      const lastNotification = fallbackNotifications.length > 0 ? fallbackNotifications[0] : null;
      
      setBadgeData({
        unreadCount,
        totalCount,
        hasNotifications: unreadCount > 0,
        lastNotificationTime: lastNotification?.timestamp
      });
      
      // Clear error if we have fallback data
      if (error) {
        setError(null);
      }
    }
  }, [fallbackNotifications, error]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await axiosInstance.put(`/api/bin-notifications/${notificationId}/read`);
      // Update badge data immediately
      setBadgeData(prev => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
        hasNotifications: Math.max(0, prev.unreadCount - 1) > 0
      }));
      return true;
    } catch (err) {
      // Log error for debugging but don't show popup
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 Mobile App - Failed to mark notification as read:', err);
      }
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await axiosInstance.put(`/api/bin-notifications/janitor/${janitorId}/mark-all-read`);
      setBadgeData(prev => ({
        ...prev,
        unreadCount: 0,
        hasNotifications: false
      }));
      return true;
    } catch (err) {
      // Log error for debugging but don't show popup
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 Mobile App - Failed to mark all notifications as read:', err);
      }
      return false;
    }
  }, [janitorId]);

  // Auto-fetch notifications
  useEffect(() => {
    if (!auto || !hasJanitorId) return;
    fetchNotificationBadge();
  }, [auto, hasJanitorId, fetchNotificationBadge]);

  // Set up polling for real-time updates
  useEffect(() => {
    if (!auto || !hasJanitorId) return;
    const id = setInterval(fetchNotificationBadge, intervalMs);
    return () => clearInterval(id);
  }, [auto, hasJanitorId, fetchNotificationBadge, intervalMs]);

  return { 
    badgeData, 
    loading, 
    error, 
    refresh: fetchNotificationBadge, 
    markAsRead, 
    markAllAsRead 
  };
}
