import { useState, useEffect } from 'react';

interface BinNotification {
  id: string;
  binId: string;
  janitorId: string;
  type: string;
  title: string;
  message: string;
  status: string;
  binLevel?: number;
  gps: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  read: boolean;
  createdAt: string;
}

interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  todayNotifications: number;
  thisWeekNotifications: number;
}

export const useBinNotifications = (janitorId?: string) => {
  const [notifications, setNotifications] = useState<BinNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async (janitorId: string, limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/bin-notifications/janitor/${janitorId}?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications);
        // Update stats if available
        if (data.unreadCount !== undefined) {
          setStats(prev => ({
            ...prev,
            totalNotifications: data.totalCount,
            unreadNotifications: data.unreadCount
          }));
        }
      } else {
        setError(data.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (janitorId?: string) => {
    try {
      setError(null);
      
      const url = janitorId 
        ? `/api/bin-notifications/stats?janitorId=${janitorId}`
        : '/api/bin-notifications/stats';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.message || 'Failed to fetch notification stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notification stats');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/bin-notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        
        // Update stats
        if (stats) {
          setStats(prev => prev ? {
            ...prev,
            unreadNotifications: Math.max(0, prev.unreadNotifications - 1)
          } : null);
        }
        
        return true;
      } else {
        setError(data.message || 'Failed to mark notification as read');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      return false;
    }
  };

  const markAllAsRead = async (janitorId: string) => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) {
        return true;
      }

      const promises = unreadNotifications.map(notification => markAsRead(notification.id));
      await Promise.all(promises);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
      return false;
    }
  };

  const sendManualNotification = async (binId: string, message: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/bin-notifications/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ binId, message })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh notifications if janitorId is provided
        if (janitorId) {
          await fetchNotifications(janitorId);
        }
        return data;
      } else {
        setError(data.message || 'Failed to send manual notification');
        return data;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send manual notification');
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    if (janitorId) {
      fetchNotifications(janitorId);
      fetchStats(janitorId);
    }
  };

  // Auto-fetch notifications when janitorId changes
  useEffect(() => {
    if (janitorId) {
      fetchNotifications(janitorId);
      fetchStats(janitorId);
    }
  }, [janitorId]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (!janitorId) return;

    const interval = setInterval(() => {
      fetchNotifications(janitorId);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [janitorId]);

  return {
    notifications,
    stats,
    loading,
    error,
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    sendManualNotification,
    refetch
  };
};
