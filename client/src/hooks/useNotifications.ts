

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export interface Notification {
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  key?: string;
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get(`/api/notifications/${userId}`);
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
      await api.patch(`/api/notifications/${userId}/mark-read/${key}`);
      setNotifications((prev) => prev.map((n) => n.key === key ? { ...n, read: true } : n));
    } catch (err) {}
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.patch(`/api/notifications/${userId}/mark-all-read`);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {}
  };

  // Delete a notification
  const deleteNotification = async (key: string) => {
    try {
      await api.delete(`/api/notifications/${userId}/${key}`);
      setNotifications((prev) => prev.filter((n) => n.key !== key));
    } catch (err) {}
  };

  return { notifications, loading, error, markAsRead, markAllAsRead, deleteNotification };
}
