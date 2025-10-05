

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export interface Notification {
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  key?: string;
  type?: string;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  userFirstName?: string;
  // Bin activity specific fields
  binId?: string;
  binLevel?: number;
  status?: string;
  completedBy?: string;
  collectedBy?: string;
  activityId?: string;
  binLocation?: string;
  collectedWeight?: number;
  binCondition?: string;
  completionNotes?: string;
  activityType?: string;
  // Bin maintenance specific fields
  severity?: string;
  issues?: Array<{
    binId: string;
    type: string;
    severity: string;
    message: string;
    details: any;
  }>;
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      let res;
      
      // If userId is 'admin', use the admin-specific endpoint
      if (userId === 'admin') {
        res = await api.get('/api/notifications/admin/notifications');
      } 
      // For individual users, use the user-specific endpoint
      else {
        res = await api.get(`/api/notifications/${userId}`);
      }
      
      const data = res.data;
      const notificationsObj = data.notifications || {};
      const notificationsArr = Object.entries(notificationsObj)
        .filter(([_, value]) => value && typeof value === 'object')
        .map(([key, value]: [string, any]) => ({ ...value, key }));
      notificationsArr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setNotifications(notificationsArr);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // Mark a single notification as read
  const markAsRead = async (key: string) => {
    try {
      if (userId === 'admin') {
        await api.patch(`/api/notifications/admin/mark-read/${key}`);
      } else {
        await api.patch(`/api/notifications/${userId}/mark-read/${key}`);
      }
      setNotifications((prev) => prev.map((n) => n.key === key ? { ...n, read: true } : n));
    } catch (err) {}
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      if (userId === 'admin') {
        await api.patch(`/api/notifications/admin/mark-all-read`);
      } else {
        await api.patch(`/api/notifications/${userId}/mark-all-read`);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {}
  };

  // Delete a notification
  const deleteNotification = async (key: string) => {
    try {
      if (userId === 'admin') {
        await api.delete(`/api/notifications/admin/${key}`);
      } else {
        await api.delete(`/api/notifications/${userId}/${key}`);
      }
      setNotifications((prev) => prev.filter((n) => n.key !== key));
    } catch (err) {}
  };

  return { notifications, loading, error, markAsRead, markAllAsRead, deleteNotification };
}
