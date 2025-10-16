import BackButton from "@/components/BackButton";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useNotifications, formatNotificationTime, getPriorityColor, getPriorityEmoji } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkeletonList } from "@/components/SkeletonLoader";

export default function NotificationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    notifications, 
    loading, 
    error, 
    refresh, 
    markAsRead, 
    markAllAsRead, 
    getNotificationsByType,
    acceptTask
  } = useNotifications();
  
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");

  // Debug logging
  console.log('NotificationScreen Debug:', {
    user: user ? { id: user.id, name: user.name } : null,
    notificationsCount: notifications.length,
    loading,
    error,
    filter
  });

  const handleDeleteAll = () => {
    Alert.alert("Mark All as Read", "Are you sure you want to mark all notifications as read?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark All as Read",
        onPress: () => markAllAsRead(),
      },
    ]);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleAcceptTask = async (activityId: string, notificationId: string) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to accept tasks");
      return;
    }

    try {
      const result = await acceptTask(
        activityId, 
        user.id, 
        user.fullName || user.name || 'Janitor'
      );

      if (result.success) {
        // Mark the notification as read after accepting
        await markAsRead(notificationId);
        
        // Set a flag to indicate activity logs need refresh
        await AsyncStorage.setItem('activityLogsNeedRefresh', Date.now().toString());
        
        // Refresh notifications to show updated state
        await refresh();
        
        Alert.alert(
          "Success", 
          "Task accepted successfully! Check your Activity Logs to see the new task.",
          [
            {
              text: "OK",
              onPress: () => {
                // Optionally navigate to activity logs
                // You can uncomment this if you want to auto-navigate
                // router.push('/activity-logs');
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", result.message || "Failed to accept task");
      }
    } catch (error) {
      console.error('Error accepting task:', error);
      Alert.alert("Error", "Failed to accept task. Please try again.");
    }
  };

  const filteredNotifications = getNotificationsByType(filter);

  return (
    <View style={styles.container}>
      <BackButton title="Home" />

      <View style={styles.topRow}>
        <Text style={styles.header}>Notifications</Text>
        <TouchableOpacity onPress={handleDeleteAll}>
          <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setFilter("all")}
          style={[styles.filterButton, filter === "all" && styles.activeFilter]}
        >
          <Text>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("unread")}
          style={[styles.filterButton, filter === "unread" && styles.activeFilter]}
        >
          <Text>Unread</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("read")}
          style={[styles.filterButton, filter === "read" && styles.activeFilter]}
        >
          <Text>Read</Text>
        </TouchableOpacity>
      </View>

      {!user ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Please log in to view notifications</Text>
          <Text style={styles.emptySubtext}>You need to be authenticated to see your notifications</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading notifications</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          loading && notifications.length === 0 ? (
            <SkeletonList />
          ) : null
        }
        renderItem={({ item }) => {
            const formattedTimestamp = formatNotificationTime(item.timestamp);
            const priorityColor = getPriorityColor(item.priority);
            const priorityEmoji = getPriorityEmoji(item.priority);

          return (
              <View style={[styles.card, item.read && styles.read]}>
                <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.title}</Text>
                  <View style={styles.priorityContainer}>
                    <Text style={styles.priorityEmoji}>{priorityEmoji}</Text>
                    <Text style={[styles.priorityText, { color: priorityColor }]}>
                      {item.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.timestamp}>{formattedTimestamp}</Text>

                {!item.read && (
                  <View style={styles.buttonContainer}>
                    {/* Show Accept button for automatic tasks that are available for acceptance */}
                    {item.isAutomaticTask && item.availableForAcceptance && (
                      <TouchableOpacity 
                        style={styles.acceptButton} 
                        onPress={() => handleAcceptTask(item.activityId, item.id)}
                      >
                        <Text style={styles.acceptButtonText}>Accept Task</Text>
                </TouchableOpacity>
                    )}
                    
                    {/* Always show Mark as Read button for unread notifications */}
                    <TouchableOpacity 
                      style={styles.markButton} 
                      onPress={() => handleMarkAsRead(item.id)}
                    >
                      <Text style={styles.markButtonText}>Mark as Read</Text>
                    </TouchableOpacity>
                  </View>
              )}
            </View>
          );
        }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No notifications found</Text>
              <Text style={styles.emptySubtext}>
                {filter === "all" 
                  ? "You're all caught up!" 
                  : filter === "unread" 
                    ? "No unread notifications" 
                    : "No read notifications"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1, marginTop: 44 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  header: { fontSize: 24, fontWeight: "bold" },
  filterRow: {
    flexDirection: "row",
    marginBottom: 15,
    justifyContent: "space-around",
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  activeFilter: {
    backgroundColor: "#cde1ff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  read: { opacity: 0.6 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: { 
    fontSize: 16, 
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },
  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "600",
  },
  message: { 
    marginTop: 5, 
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: { 
    marginTop: 8, 
    fontSize: 12, 
    color: "gray" 
  },
  buttonContainer: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  acceptButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 80,
  },
  acceptButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  markButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 80,
  },
  markButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
