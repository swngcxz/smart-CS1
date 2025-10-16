import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import apiClient from '@/utils/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';

export interface ActivityLog {
  id: string;
  user_id?: string;
  bin_id: string;
  bin_location: string;
  bin_status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  bin_level: number;
  activity_type: 'task_assignment' | 'collection' | 'maintenance' | 'bin_collection' | 'bin_emptied';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  task_note?: string;
  assigned_janitor_id?: string | null;
  assigned_janitor_name?: string | null;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  created_at: string;
  updated_at: string;
  source?: 'automatic_monitoring' | 'manual';
  available_for_acceptance?: boolean;
  acceptance_deadline?: string;
  created_by?: string;
  completion_notes?: string;
  photos?: string[];
  bin_condition?: 'good' | 'damaged' | 'needs_repair';
  collected_weight?: number;
  collection_time?: string;
  user_name?: string;
}

export interface UpdateActivityData {
  status: 'done';
  bin_status: 'done';
  completion_notes: string;
  bin_condition: 'good' | 'damaged' | 'needs_repair';
  photos: string[];
  collection_time: string;
  user_id: string;
  user_name: string;
  collected_weight?: number;
}

export interface Notification {
  id: string;
  type: 'automatic_task_available' | 'task_assignment' | 'task_accepted' | 'activity_completed';
  title: string;
  message: string;
  status: 'AVAILABLE_FOR_ACCEPTANCE' | 'ASSIGNED' | 'ACCEPTED' | 'COMPLETED';
  binId: string;
  binLevel: number;
  activityId: string;
  priority: string;
  timestamp: number;
  read: boolean;
  createdAt: string;
  isAutomaticTask?: boolean;
  availableForAcceptance?: boolean;
  acceptanceDeadline?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Fetch activity logs from API
  const fetchActivityLogs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch activity logs
      const response = await apiClient.get('/api/activitylogs');
      
      if (response.data && response.data.activities) {
        // Transform activity logs into notifications
        const transformedNotifications = transformActivityLogsToNotifications(response.data.activities);
        
        // Merge with cached read status
        const cachedNotifications = await AsyncStorage.getItem('notifications');
        if (cachedNotifications) {
          const cached = JSON.parse(cachedNotifications);
          const mergedNotifications = transformedNotifications.map(newNotif => {
            const cachedNotif = cached.find((c: any) => c.id === newNotif.id);
            return cachedNotif ? { ...newNotif, read: cachedNotif.read } : newNotif;
          });
          setNotifications(mergedNotifications);
        } else {
          setNotifications(transformedNotifications);
        }
        
        setActivityLogs(response.data.activities);
        setLastUpdate(Date.now());
        
        // Cache the merged data
        const finalNotifications = cachedNotifications ? 
          JSON.parse(cachedNotifications).map((cached: any) => {
            const newNotif = transformedNotifications.find((n: any) => n.id === cached.id);
            return newNotif ? { ...newNotif, read: cached.read } : cached;
          }) : transformedNotifications;
        await AsyncStorage.setItem('notifications', JSON.stringify(finalNotifications));
        await AsyncStorage.setItem('activityLogs', JSON.stringify(response.data.activities));
        setError(null);
      } else {
        setNotifications([]);
        setActivityLogs([]);
      }
    } catch (err: any) {
      // Silently handle network errors to prevent console spam
      if (err.message && !err.message.includes('Network Error') && !err.message.includes('timeout')) {
        setError(err.message || 'Failed to fetch notifications');
      }
      setNotifications([]);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Transform activity logs to notifications based on logged-in user
  const transformActivityLogsToNotifications = (logs: ActivityLog[]): Notification[] => {
    if (!user) {
      return [];
    }
    
    return logs
      .filter(log => {
        const isAutomatic = log.source === 'automatic_monitoring';
        const isAssignedToMe = log.assigned_janitor_id === user.id;
        const isPending = log.status === 'pending';
        const isAvailableForAcceptance = log.available_for_acceptance === true;
        
        // Show automatic tasks that are pending and available for acceptance
        if (isAutomatic && isPending && isAvailableForAcceptance) {
          return true;
        }
        
        // Show manual tasks that are assigned directly to the logged-in user and in progress
        if (!isAutomatic && isAssignedToMe && log.status === 'in_progress') {
          return true;
        }
        
        // Also show pending tasks that look like automatic tasks (fallback for missing source field)
        if (!isAutomatic && isPending && log.assigned_janitor_id === null && log.user_id === null) {
          return true;
        }
        
        return false;
      })
      .map(log => {
        const isAutomatic = log.source === 'automatic_monitoring';
        const isAssignedToMe = log.assigned_janitor_id === user.id;
        const isPendingAutomatic = log.status === 'pending' && log.assigned_janitor_id === null && log.user_id === null;
        
        let title = '';
        let message = '';
        let type: Notification['type'] = 'task_assignment';
        let status: Notification['status'] = 'ASSIGNED';
        
        if ((isAutomatic && log.status === 'pending') || isPendingAutomatic) {
          title = '🚨 Automatic Task Available';
          message = `Bin ${log.bin_id} at ${log.bin_location} is ${log.bin_level}% full and needs immediate attention. Click to accept this task.`;
          type = 'automatic_task_available';
          status = 'AVAILABLE_FOR_ACCEPTANCE';
        } else if (!isAutomatic && isAssignedToMe && log.status === 'in_progress') {
          title = '📋 Task Assigned to You';
          message = `You have been assigned a task for bin ${log.bin_id} at ${log.bin_location}. Task: ${log.task_note || 'No additional notes'}`;
          type = 'task_assignment';
          status = 'ASSIGNED';
        }
        
        return {
          id: log.id,
          type,
          title,
          message,
          status,
          binId: log.bin_id,
          binLevel: log.bin_level,
          activityId: log.id,
          priority: log.priority,
          timestamp: new Date(log.created_at).getTime(),
          read: false,
          createdAt: log.created_at,
          isAutomaticTask: isAutomatic || isPendingAutomatic,
          availableForAcceptance: (isAutomatic && log.status === 'pending') || isPendingAutomatic,
          acceptanceDeadline: log.acceptance_deadline
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
  };

  // Update activity log with completion data
  const updateActivityLog = useCallback(async (
    activityId: string,
    updateData: UpdateActivityData
  ): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      setLoading(true);
      setError(null);

      console.log('Updating activity log:', {
        activityId,
        updateData: {
          ...updateData,
          photos: updateData.photos.length // Log photo count instead of URLs for privacy
        }
      });

      const response = await apiClient.put(`/api/activitylogs/${activityId}`, updateData);

      if (response.data) {
        console.log('Activity log updated successfully:', response.data);
        
        // Refresh notifications after updating
        await fetchActivityLogs();
        
        return {
          success: true,
          data: response.data,
          message: 'Activity updated successfully'
        };
      } else {
        throw new Error('No data returned from server');
      }
    } catch (err: any) {
      console.error('Failed to update activity log:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update activity';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [fetchActivityLogs]);

  // Complete activity with all required data
  const completeActivity = useCallback(async (
    activityId: string,
    completionNotes: string,
    binCondition: 'good' | 'damaged' | 'needs_repair',
    photoUrls: string[],
    userId: string,
    userName: string,
    collectedWeight?: number
  ): Promise<{ success: boolean; data?: any; message?: string }> => {
    const updateData: UpdateActivityData = {
      status: 'done',
      bin_status: 'done',
      completion_notes: completionNotes,
      bin_condition: binCondition,
      photos: photoUrls,
      collection_time: new Date().toISOString(),
      user_id: userId,
      user_name: userName,
      collected_weight: collectedWeight
    };

    return await updateActivityLog(activityId, updateData);
  }, [updateActivityLog]);

  // Accept a task
  const acceptTask = useCallback(async (activityId: string, janitorId: string, janitorName: string) => {
    try {
      const response = await apiClient.put(`/api/activitylogs/${activityId}/assign`, {
        assigned_janitor_id: janitorId,
        assigned_janitor_name: janitorName,
        status: 'in_progress'
      });
      
      if (response.data) {
        
        // Refresh notifications after accepting
        await fetchActivityLogs();
        
        return {
          success: true,
          message: 'Task accepted successfully',
          data: response.data
        };
      }
    } catch (err: any) {
      console.error('Failed to accept task:', err.message);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to accept task',
        error: err.message
      };
    }
  }, [fetchActivityLogs]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      
      // Update cache
      const updatedNotifications = notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      );
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
    } catch (err: any) {
      // Silently handle storage errors
    }
  }, [notifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
      setNotifications(updatedNotifications);
      
      // Update cache
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
    } catch (err: any) {
      // Silently handle storage errors
    }
  }, [notifications]);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    return notifications.filter(notif => !notif.read).length;
  }, [notifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: 'all' | 'unread' | 'read') => {
    switch (type) {
      case 'unread':
        return notifications.filter(notif => !notif.read);
      case 'read':
        return notifications.filter(notif => notif.read);
      default:
        return notifications;
    }
  }, [notifications]);

  // Get automatic task notifications
  const getAutomaticTaskNotifications = useCallback(() => {
    return notifications.filter(notif => notif.isAutomaticTask && notif.availableForAcceptance);
  }, [notifications]);

  // Get manual assigned notifications
  const getManualAssignedNotifications = useCallback(() => {
    return notifications.filter(notif => !notif.isAutomaticTask && notif.status === 'ASSIGNED');
  }, [notifications]);

  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchActivityLogs();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Set up real-time updates using polling with exponential backoff and app state awareness
  useEffect(() => {
    if (!user) return;
    
    let pollInterval = 30000; // Start with 30 seconds
    let consecutiveErrors = 0;
    const maxPollInterval = 300000; // Max 5 minutes
    let timeoutId: ReturnType<typeof setTimeout>;
    let isPolling = true;
    
    const poll = async () => {
      // Stop polling if app is in background or component unmounted
      if (!isPolling || AppState.currentState !== 'active') {
        return;
      }
      
      try {
        const response = await apiClient.get('/api/activitylogs');
        
        if (response.data && response.data.activities) {
          const transformedNotifications = transformActivityLogsToNotifications(response.data.activities);
          
          // Merge with cached read status
          const cachedNotifications = await AsyncStorage.getItem('notifications');
          if (cachedNotifications) {
            const cached = JSON.parse(cachedNotifications);
            const mergedNotifications = transformedNotifications.map(newNotif => {
              const cachedNotif = cached.find((c: any) => c.id === newNotif.id);
              return cachedNotif ? { ...newNotif, read: cachedNotif.read } : newNotif;
            });
            setNotifications(mergedNotifications);
          } else {
            setNotifications(transformedNotifications);
          }
          
          setActivityLogs(response.data.activities);
          setLastUpdate(Date.now());
          
          // Cache the merged data
          const finalNotifications = cachedNotifications ? 
            JSON.parse(cachedNotifications).map((cached: any) => {
              const newNotif = transformedNotifications.find((n: any) => n.id === cached.id);
              return newNotif ? { ...newNotif, read: cached.read } : cached;
            }) : transformedNotifications;
          await AsyncStorage.setItem('notifications', JSON.stringify(finalNotifications));
          await AsyncStorage.setItem('activityLogs', JSON.stringify(response.data.activities));
          setError(null);
          
          // Reset error count on successful fetch
          consecutiveErrors = 0;
          pollInterval = 30000; // Reset to 30 seconds
        }
      } catch (err: any) {
        consecutiveErrors++;
        
        // Increase polling interval on consecutive errors (exponential backoff)
        if (consecutiveErrors > 3) {
          pollInterval = Math.min(pollInterval * 1.5, maxPollInterval);
        }
        
        // Silently handle network errors to prevent console spam
        // Only set error if it's a critical error, not just network issues
        if (err.message && !err.message.includes('Network Error') && !err.message.includes('timeout')) {
          setError(err.message || 'Failed to fetch real-time notifications');
        }
      }
      
      // Schedule next poll only if still polling and app is active
      if (isPolling && AppState.currentState === 'active') {
        timeoutId = setTimeout(poll, pollInterval);
      }
    };
    
    // Handle app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && isPolling) {
        // Resume polling when app becomes active
        timeoutId = setTimeout(poll, 1000); // Quick poll when app becomes active
      }
    };
    
    // Start polling
    timeoutId = setTimeout(poll, pollInterval);
    
    // Listen to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      isPolling = false;
      clearTimeout(timeoutId);
      subscription?.remove();
    };
  }, [user]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await fetchActivityLogs();
    } finally {
      setLoading(false);
    }
  }, [fetchActivityLogs]);

  return {
    notifications,
    activityLogs,
    loading,
    error,
    lastUpdate,
    refresh,
    updateActivityLog,
    completeActivity,
    acceptTask,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    getNotificationsByType,
    getAutomaticTaskNotifications,
    getManualAssignedNotifications,
  };
}

// Helper function to format notification time
export function formatNotificationTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) { // Less than 1 minute
    return 'Just now';
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min ago`;
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}

// Helper function to get priority color
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return '#f44336'; // Red
    case 'high':
      return '#ff9800'; // Orange
    case 'medium':
      return '#ffc107'; // Yellow
    case 'low':
      return '#4caf50'; // Green
    default:
      return '#666'; // Gray
  }
}

// Helper function to get priority emoji
export function getPriorityEmoji(priority: string): string {
  switch (priority) {
    case 'urgent':
      return '🔴';
    case 'high':
      return '🟠';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
}
