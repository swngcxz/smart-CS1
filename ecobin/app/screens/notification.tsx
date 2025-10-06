import BackButton from "@/components/BackButton";
import React from "react";
import { useMemo, useState, useCallback, useEffect } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";

import { useAccount } from "@/contexts/AccountContext"; // current user info from /auth/me
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationBadge } from "@/hooks/useNotificationBadge";
import axiosInstance from "@/utils/axiosInstance";

export default function NotificationScreen() {
  const { account } = useAccount();
  const janitorId = useMemo(() => account?.id, [account]);
  const { notifications, loading, error, markAsRead, refresh, setNotifications } = useNotifications(janitorId, { auto: true, intervalMs: 10000 });
  const { badgeData, markAllAsRead } = useNotificationBadge(janitorId, { auto: true, intervalMs: 5000 });
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [taskStatuses, setTaskStatuses] = useState<{[key: string]: 'available' | 'accepted' | 'completed'}>({});

  // Function to check task statuses
  const checkTaskStatuses = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/activitylogs');
      const data = response.data;
      
      const statuses: {[key: string]: 'available' | 'accepted' | 'completed'} = {};
      
      if (data.activities) {
        data.activities.forEach((activity: any) => {
          const key = `${activity.bin_id}_${activity.activity_type}`;
          
          if (activity.status === 'pending' && !activity.assigned_janitor_id) {
            statuses[key] = 'available';
          } else if (activity.status === 'in_progress' && activity.assigned_janitor_id) {
            statuses[key] = 'accepted';
          } else if (activity.status === 'done') {
            statuses[key] = 'completed';
          }
        });
      }
      
      setTaskStatuses(statuses);
    } catch (error) {
      console.error('Error checking task statuses:', error);
      // Set empty statuses on error to prevent UI issues
      setTaskStatuses({});
    }
  }, []);

  // Check task statuses when component mounts and notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      checkTaskStatuses();
    }
  }, [notifications.length, checkTaskStatuses]); // Only depend on length to prevent excessive calls

  // Function to get task status for a notification
  const getTaskStatus = useCallback((item: any): 'available' | 'accepted' | 'completed' => {
    // First check if the notification has been updated with new status fields
    if (item.taskStatus) {
      return item.taskStatus;
    }
    
    // Check if notification has been marked as accepted or completed
    if (item.status === 'ACCEPTED' || item.acceptedBy) {
      return 'accepted';
    }
    if (item.status === 'COMPLETED' || item.completedBy) {
      return 'completed';
    }
    
    // Fallback to checking activity logs
    const key = `${item.binId}_${item.type || 'task_assignment'}`;
    return taskStatuses[key] || 'available';
  }, [taskStatuses]);

  // Function to check if task is accepted by current user
  const isTaskAcceptedByMe = useCallback(async (item: any): Promise<boolean> => {
    try {
      const response = await axiosInstance.get('/api/activitylogs');
      const data = response.data;
      
      if (data.activities) {
        const activity = data.activities.find((activity: any) => 
          activity.bin_id === item.binId && 
          activity.status === 'in_progress' && 
          activity.assigned_janitor_id === janitorId
        );
        return !!activity;
      }
      return false;
    } catch (error) {
      console.error('Error checking if task accepted by me:', error);
      return false;
    }
  }, [janitorId]);

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Delete this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setNotifications((prev) => prev.filter((n) => n.id !== id)),
      },
    ]);
  };

  const handleMarkAsDone = async (id: string) => {
    await markAsRead(id);
  };

  const handleAcceptTask = async (item: any) => {
    try {
      Alert.alert(
        "Accept Task",
        `Do you want to accept this task for bin ${item.binId}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Accept",
            style: "default",
            onPress: async () => {
              try {
                let activityId = item.activityId || item.id;
                
                // If no activityId, try to find the corresponding activity log
                if (!activityId || activityId === item.id) {
                  // Fetch available activities to find the right one
                  const activitiesResponse = await axiosInstance.get('/api/activitylogs');
                  const activitiesData = activitiesResponse.data;
                  
                  // Find pending activity for this bin
                  const pendingActivity = activitiesData.activities?.find((activity: any) => 
                    activity.bin_id === item.binId && 
                    activity.status === 'pending' && 
                    !activity.assigned_janitor_id
                  );
                  
                  if (pendingActivity) {
                    activityId = pendingActivity.id;
                  } else {
                    Alert.alert("Error", "No pending task found for this bin");
                    return;
                  }
                }

                // Call the task assignment endpoint
                const response = await axiosInstance.put(`/api/activitylogs/${activityId}/assign`, {
                  assigned_janitor_id: janitorId,
                  assigned_janitor_name: account?.fullName || 'Janitor',
                  status: 'in_progress'
                });

                Alert.alert("Success", "Task accepted successfully!");
                // Automatically mark the notification as read
                await markAsRead(item.id);
                // Refresh notifications and task statuses
                await refresh();
                await checkTaskStatuses();
              } catch (fetchError) {
                console.error('Error in task acceptance:', fetchError);
                Alert.alert("Error", "Failed to accept task");
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error accepting task:', error);
      Alert.alert("Error", "Failed to accept task");
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    // Also update local notifications state
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), checkTaskStatuses()]);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredNotifications = notifications.filter((n: any) => {
    // First apply read/unread filter
    const passesReadFilter = filter === "all" || (n.read ? "read" : "unread") === filter;
    
    // Then filter out notifications for tasks that are no longer available
    const isTaskNotification = n.type === 'automatic_task_available' || 
                             n.type === 'task_assignment' || 
                             (n as any)?.availableForAcceptance ||
                             n.title?.includes('Task Available') ||
                             n.title?.includes('Automatic Task') ||
                             (n.title?.includes('Bin') && n.title?.includes('Needs Collection'));
    
    if (isTaskNotification) {
      const taskStatus = getTaskStatus(n);
      // Show task notifications if:
      // 1. Task is still available (can be accepted)
      // 2. Task is accepted/completed but notification is unread (user should see the update)
      // 3. Task is completed and notification is read (for reference)
      const isTaskStillRelevant = taskStatus === 'available' || 
                                 (taskStatus === 'accepted' && !n.read) ||
                                 (taskStatus === 'completed' && !n.read) ||
                                 (taskStatus === 'completed' && n.read);
      return passesReadFilter && isTaskStillRelevant;
    }
    
    // For non-task notifications, just apply read filter
    return passesReadFilter;
  });

  return (
    <View style={styles.container}>
      <BackButton title="Home" />

      <View style={styles.headerContainer}>
        <Text style={styles.header}>Notifications</Text>
        {badgeData.hasNotifications && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {!!error && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{String(error)}</Text>
      )}

      {/* Notification Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {badgeData.totalCount} total • {badgeData.unreadCount} unread
        </Text>
      </View>

      {/* Filter Box */}
      <View style={styles.filterBox}>
        <TouchableOpacity
          onPress={() => setFilter("all")}
          style={[styles.filterButton, filter === "all" && styles.activeFilter]}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === "all" && styles.activeFilterText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("unread")}
          style={[
            styles.filterButton,
            filter === "unread" && styles.activeFilter,
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === "unread" && styles.activeFilterText,
            ]}
          >
            Unread
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("read")}
          style={[
            styles.filterButton,
            filter === "read" && styles.activeFilter,
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === "read" && styles.activeFilterText,
            ]}
          >
            Read
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item: any) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => {
          // Handle different timestamp formats
          let date;
          if ((item.timestamp as any)?._seconds) {
            // Firestore timestamp object
            date = new Date((item.timestamp as any)._seconds * 1000);
          } else if (item.timestamp) {
            // Regular timestamp string or Date
            date = new Date(item.timestamp);
          } else {
            // Fallback to createdAt
            date = new Date((item as any).createdAt || new Date());
          }
          
          const formattedTimestamp = isNaN(date.getTime()) 
            ? 'Invalid Date' 
            : date.toLocaleString("en-US", {
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

          // Get task status for this notification
          const taskStatus = getTaskStatus(item);
          const isTaskNotification = item.type === 'automatic_task_available' || 
                                   item.type === 'task_assignment' || 
                                   (item as any)?.availableForAcceptance ||
                                   item.title?.includes('Task Available') ||
                                   item.title?.includes('Automatic Task') ||
                                   (item.title?.includes('Bin') && item.title?.includes('Needs Collection'));

          return (
            <TouchableOpacity
              onLongPress={() => handleDelete(item.id)} // long press delete popup
              delayLongPress={500}
            >
              <View style={[styles.card, item.read && styles.read, taskStatus === 'accepted' && styles.acceptedCard]}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.title}>{item.title}</Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.message}>{item.message}</Text>
                
                {/* Task Status Indicator */}
                {isTaskNotification && (
                  <View style={styles.statusContainer}>
                    {taskStatus === 'available' && (
                      <Text style={styles.statusTextAvailable}>🟢 Task Available</Text>
                    )}
                    {taskStatus === 'accepted' && (
                      <View>
                        <Text style={styles.statusTextAccepted}>🟠 Task Accepted by Someone</Text>
                        {(item as any).acceptedBy && (
                          <Text style={styles.acceptedByText}>Accepted by: {(item as any).acceptedBy}</Text>
                        )}
                      </View>
                    )}
                    {taskStatus === 'completed' && (
                      <View>
                        <Text style={styles.statusTextCompleted}>✅ Task Completed</Text>
                        {(item as any).completedBy && (
                          <Text style={styles.completedByText}>Completed by: {(item as any).completedBy}</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
                
                {item.type && (
                  <Text style={styles.typeText}>Type: {item.type}</Text>
                )}
                {item.binId && (
                  <Text style={styles.binText}>Bin: {item.binId}</Text>
                )}
                <Text style={styles.timestamp}>{formattedTimestamp}</Text>

                {!item.read && (
                  <View style={styles.buttonContainer}>
                    {/* Show Accept button for task notifications - only if task is available */}
                    {isTaskNotification && taskStatus === 'available' && (
                      <TouchableOpacity
                        style={[styles.markButton, styles.acceptButton]}
                        onPress={() => handleAcceptTask(item)}
                      >
                        <Text style={styles.markButtonText}>Accept Task</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Show disabled Accept button for accepted tasks */}
                    {isTaskNotification && taskStatus === 'accepted' && (
                      <TouchableOpacity
                        style={[styles.markButton, styles.disabledButton]}
                        disabled={true}
                      >
                        <Text style={styles.disabledButtonText}>
                          {(item as any).acceptedBy ? `Accepted by ${(item as any).acceptedBy}` : 'Task Accepted'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Show disabled button for completed tasks */}
                    {isTaskNotification && taskStatus === 'completed' && (
                      <TouchableOpacity
                        style={[styles.markButton, styles.disabledButton]}
                        disabled={true}
                      >
                        <Text style={styles.disabledButtonText}>
                          {(item as any).completedBy ? `Completed by ${(item as any).completedBy}` : 'Task Completed'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Show Mark as Read button for all notifications */}
                    <TouchableOpacity
                      style={[styles.markButton, styles.readButton]}
                      onPress={() => handleMarkAsDone(item.id)}
                    >
                      <Text style={styles.markButtonText}>Mark as Read</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubText}>
              {filter === "unread" ? "All notifications have been read" : "No notifications available"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1, marginTop: 44 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  header: { fontSize: 24, fontWeight: "bold" },
  markAllButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  markAllText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  summaryContainer: {
    backgroundColor: "#f0f8ff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  filterBox: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    padding: 3,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: "black",
  },
  activeFilter: {
    backgroundColor: "#4CAF50",
  },
  activeFilterText: {
    color: "white",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  read: { 
    opacity: 0.6,
    borderLeftColor: "#ccc",
  },
  acceptedCard: {
    borderLeftColor: "#FF6B35", // Orange border for accepted tasks
    backgroundColor: "#FFF5F0", // Light orange background
  },
  statusContainer: {
    marginTop: 8,
    marginBottom: 5,
  },
  statusTextAvailable: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  statusTextAccepted: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "bold",
  },
  statusTextCompleted: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "bold",
  },
  acceptedByText: {
    fontSize: 10,
    color: "#FF6B35",
    fontStyle: "italic",
    marginTop: 2,
  },
  completedByText: {
    fontSize: 10,
    color: "#2196F3",
    fontStyle: "italic",
    marginTop: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  title: { fontSize: 16, fontWeight: "600", flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4444",
    marginLeft: 8,
  },
  message: { marginTop: 5, fontSize: 14, lineHeight: 20 },
  typeText: {
    marginTop: 5,
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  binText: {
    marginTop: 2,
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  timestamp: { marginTop: 8, fontSize: 12, color: "gray" },
  buttonContainer: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  markButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  acceptButton: {
    backgroundColor: "#FF6B35", // Orange color for accept
  },
  readButton: {
    backgroundColor: "#4CAF50", // Green color for read
  },
  disabledButton: {
    backgroundColor: "#CCCCCC", // Gray color for disabled
  },
  markButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  disabledButtonText: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
