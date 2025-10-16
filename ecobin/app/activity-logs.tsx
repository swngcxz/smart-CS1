import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  AppState,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLogs, ActivityLog } from '@/hooks/useActivityLogs';
import ActivityDetailsModal from '@/components/ActivityDetailsModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ActivityLogsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { fetchUserActivityLogs, loading, error } = useActivityLogs();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch all activity logs for the logged-in user
  const fetchActivityLogs = async () => {
    if (!user) return;

    try {
      const userLogs = await fetchUserActivityLogs(user.id);
      // Sort by status priority: pending first, then in_progress, then done last
      const sortedLogs = userLogs.sort((a: ActivityLog, b: ActivityLog) => {
        // Define status priority order
        const statusPriority = { pending: 0, in_progress: 1, done: 2 };
        const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 3;
        const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 3;
        
        // First sort by status priority
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Then sort by creation date (newest first) within the same status
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setActivityLogs(sortedLogs);
    } catch (err: any) {
      console.error('Failed to fetch activity logs:', err);
      setActivityLogs([]);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivityLogs();
    setRefreshing(false);
  };

  const handleActivityPress = (activity: ActivityLog) => {
    setSelectedActivity(activity);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedActivity(null);
  };

  const handleActivityUpdate = () => {
    fetchActivityLogs(); // Refresh the list after update
  };

  // Check for refresh flag when screen becomes active
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        const refreshFlag = await AsyncStorage.getItem('activityLogsNeedRefresh');
        if (refreshFlag) {
          // Clear the flag and refresh activity logs
          await AsyncStorage.removeItem('activityLogsNeedRefresh');
          if (user) {
            fetchActivityLogs();
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user]);

  // Fetch activity logs when component mounts
  useEffect(() => {
    if (user) {
      fetchActivityLogs();
    }
  }, [user]);

  // Refresh when screen comes into focus (e.g., when navigating from notifications)
  useFocusEffect(
    React.useCallback(() => {
      const checkAndRefresh = async () => {
        const refreshFlag = await AsyncStorage.getItem('activityLogsNeedRefresh');
        if (refreshFlag && user) {
          // Clear the flag and refresh activity logs
          await AsyncStorage.removeItem('activityLogsNeedRefresh');
          fetchActivityLogs();
        }
      };
      
      checkAndRefresh();
    }, [user])
  );

  const getBadgeStyle = (status: string, activityType: string) => {
    if (status === 'done') {
      return styles.badgeCompleted; // Green for completed tasks
    } else if (status === 'in_progress') {
      return styles.badgeInProgress; // Yellow for in-progress tasks
    } else if (activityType === 'task_assignment') {
      return styles.badgeAssigned; // Blue for task assignments
    }
    return styles.badgeAssigned; // Default
  };

  const formatActivityMessage = (log: ActivityLog) => {
    if (log.status === 'done') {
      return `Completed task for ${log.bin_id}`;
    } else if (log.status === 'in_progress') {
      return `Working on ${log.bin_id}`;
    } else {
      return `Task assigned for ${log.bin_id}`;
    }
  };

  const formatActivityTime = (createdAt: string) => {
    const now = new Date();
    const logDate = new Date(createdAt);
    const diffInHours = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return logDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
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
  };

  const renderActivityLogItem = ({ item }: { item: ActivityLog }) => (
    <TouchableOpacity 
      style={styles.logCard}
      onPress={() => handleActivityPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.logTextContainer}>
        <Text style={styles.logMessage}>{formatActivityMessage(item)}</Text>
        <Text style={styles.logTime}>
          {formatActivityTime(item.created_at)}
        </Text>
        <Text style={styles.logSubtext}>
          📍 {item.bin_id} – {item.bin_location}
        </Text>
        {item.task_note && (
          <Text style={styles.taskNote}>
            Note: {item.task_note}
          </Text>
        )}
        <View style={styles.logMeta}>
          <Text style={styles.binLevel}>
            Fill Level: {item.bin_level}%
          </Text>
          <View style={styles.priorityContainer}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {item.priority.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightColumn}>
        <View style={[styles.typeBadge, getBadgeStyle(item.status, item.activity_type)]}>
          <Text style={styles.badgeText}>
            {item.status === 'done' ? 'COMPLETED' : 
             item.status === 'in_progress' ? 'IN PROGRESS' : 
             'ASSIGNED'}
          </Text>
        </View>
        <Text style={styles.tapHint}>Tap to view details</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Activity Logs</Text>
      
      <View style={styles.headerRight}>
        <Text style={styles.logCount}>
          {activityLogs.length} logs
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No Activity Logs</Text>
      <Text style={styles.emptyMessage}>
        You don't have any activity logs yet. Tasks you accept or complete will appear here.
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Error</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchActivityLogs}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // Show UI immediately with loading indicator

  if (error) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingHeader}>
          <ActivityIndicator size="small" color="#2e7d32" />
          <Text style={styles.loadingHeaderText}>Loading activity logs...</Text>
        </View>
      )}
      
      <FlatList
        data={activityLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderActivityLogItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2e7d32']}
            tintColor="#2e7d32"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      <ActivityDetailsModal
        visible={modalVisible}
        activity={selectedActivity}
        onClose={handleCloseModal}
        onUpdate={handleActivityUpdate}
        user={user}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  logCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  logMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  logSubtext: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  taskNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 6,
  },
  logMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  binLevel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rightColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#ccc',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tapHint: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  badgeCompleted: {
    backgroundColor: '#81c784', // Green
  },
  badgeInProgress: {
    backgroundColor: '#ffd54f', // Yellow
  },
  badgeAssigned: {
    backgroundColor: '#64b5f6', // Blue
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    marginBottom: 10,
    borderRadius: 8,
  },
  loadingHeaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
