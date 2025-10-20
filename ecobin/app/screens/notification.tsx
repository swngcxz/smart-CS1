import BackButton from "@/components/BackButton";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useNotifications, formatNotificationTime, getPriorityColor, getPriorityEmoji } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SkeletonList } from "@/components/SkeletonLoader";

export default function NotificationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, loading, error, refresh, markAsRead, markAllAsRead, getNotificationsByType, acceptTask } =
    useNotifications();

  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [showActionButtons, setShowActionButtons] = useState(false);

  // Debug logging
  console.log("NotificationScreen Debug:", {
    user: user ? { id: user.id, name: user.name } : null,
    notificationsCount: notifications.length,
    loading,
    error,
    filter,
  });

  const handleArchiveAll = () => {
    Alert.alert("Archive All", "Are you sure you want to archive all notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive All",
        onPress: () => markAllAsRead(), // Using markAllAsRead as archive functionality
      },
    ]);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDeleteNotification = async (id: string) => {
    Alert.alert("Delete Notification", "Are you sure you want to delete this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          // Add delete functionality here
          console.log("Deleting notification:", id);
          setShowActionButtons(false);
          setSelectedNotificationId(null);
        },
      },
    ]);
  };

  const handleArchiveNotification = async (id: string) => {
    Alert.alert("Archive Notification", "Are you sure you want to archive this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: async () => {
          await markAsRead(id); // Using markAsRead as archive functionality
          setShowActionButtons(false);
          setSelectedNotificationId(null);
        },
      },
    ]);
  };

  const handleLongPress = (notificationId: string) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Delete", "Archive"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: "Notification Actions",
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleDeleteNotification(notificationId);
          } else if (buttonIndex === 2) {
            handleArchiveNotification(notificationId);
          }
        }
      );
    } else {
      // For Android, show a custom modal
      setSelectedNotificationId(notificationId);
      setShowActionButtons(true);
    }
  };

  const handleCloseActionButtons = () => {
    setShowActionButtons(false);
    setSelectedNotificationId(null);
  };

  const handleAcceptTask = async (activityId: string, notificationId: string) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to accept tasks");
      return;
    }

    try {
      const result = await acceptTask(activityId, user.id, user.fullName || user.name || "Janitor");

      if (result && result.success) {
        // Mark the notification as read after accepting
        await markAsRead(notificationId);

        // Set a flag to indicate activity logs need refresh
        await AsyncStorage.setItem("activityLogsNeedRefresh", Date.now().toString());

        // Refresh notifications to show updated state
        await refresh();

        Alert.alert("Success", "Task accepted successfully! Check your Activity Logs to see the new task.", [
          {
            text: "OK",
            onPress: () => {
              // Optionally navigate to activity logs
              // You can uncomment this if you want to auto-navigate
              // router.push('/activity-logs');
            },
          },
        ]);
      } else {
        Alert.alert("Error", (result && result.message) || "Failed to accept task");
      }
    } catch (error) {
      console.error("Error accepting task:", error);
      Alert.alert("Error", "Failed to accept task. Please try again.");
    }
  };

  const filteredNotifications = getNotificationsByType(filter);

  return (
    <View style={styles.container}>
      <BackButton title="Back" />

      <View style={styles.topRow}>
        <Text style={styles.header}>Notifications</Text>
        <TouchableOpacity onPress={handleArchiveAll}>
          <Ionicons name="archive-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setFilter("all")}
            style={[styles.filterButton, filter === "all" && styles.activeFilter]}
          >
            <Text style={[styles.filterButtonText, filter === "all" && styles.activeFilterText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("unread")}
            style={[styles.filterButton, filter === "unread" && styles.activeFilter]}
          >
            <Text style={[styles.filterButtonText, filter === "unread" && styles.activeFilterText]}>Unread</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("read")}
            style={[styles.filterButton, filter === "read" && styles.activeFilter]}
          >
            <Text style={[styles.filterButtonText, filter === "read" && styles.activeFilterText]}>Read</Text>
          </TouchableOpacity>
        </View>
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
          ListHeaderComponent={loading && notifications.length === 0 ? <SkeletonList /> : null}
          renderItem={({ item }) => {
            const formattedTimestamp = formatNotificationTime(item.timestamp);
            const priorityColor = getPriorityColor(item.priority);
            const priorityEmoji = getPriorityEmoji(item.priority);

            return (
              <View style={[styles.card, item.read && styles.read]}>
                <TouchableOpacity onLongPress={() => handleLongPress(item.id)} delayLongPress={500} activeOpacity={0.7}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.title}>{item.title}</Text>
                    <View style={styles.priorityContainer}>
                      <Text style={styles.priorityEmoji}>{priorityEmoji}</Text>
                      <Text style={[styles.priorityText, { color: priorityColor }]}>{item.priority.toUpperCase()}</Text>
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
                      <TouchableOpacity style={styles.markButton} onPress={() => handleMarkAsRead(item.id)}>
                        <Text style={styles.markButtonText}>Mark as Read</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} colors={["#4CAF50"]} tintColor="#4CAF50" />
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

      {/* iPhone-style Action Sheet Modal for Android */}
      <Modal
        visible={showActionButtons && selectedNotificationId !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseActionButtons}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionSheetContainer}>
            <View style={styles.actionSheet}>
              <Text style={styles.actionSheetTitle}>Notification Actions</Text>

              <TouchableOpacity
                style={styles.actionSheetButton}
                onPress={() => handleDeleteNotification(selectedNotificationId!)}
              >
                <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                <Text style={[styles.actionSheetButtonText, styles.destructiveText]}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionSheetButton}
                onPress={() => handleArchiveNotification(selectedNotificationId!)}
              >
                <Ionicons name="archive-outline" size={20} color="#007aff" />
                <Text style={styles.actionSheetButtonText}>Archive</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                style={[styles.actionSheetButton, styles.cancelButton]}
                onPress={handleCloseActionButtons}
              >
                <Text style={[styles.actionSheetButtonText, styles.cancelText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  filterContainer: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: "#fff",
    borderWidth: 0,
    minWidth: 105,
    alignItems: "center",
    justifyContent: "center",
  },
  activeFilter: {
    backgroundColor: "#4CAF50",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeFilterText: {
    color: "#fff",
    fontWeight: "600",
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
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 6,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  read: {
    opacity: 0.6,
    borderLeftColor: "#ccc",
  },
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
    color: "gray",
  },
  buttonContainer: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  acceptButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 90,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  acceptButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  markButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 90,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  markButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  actionSheetContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  actionSheet: {
    backgroundColor: "#f2f2f7",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
  },
  actionSheetTitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#8e8e93",
    textAlign: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f2f2f7",
  },
  actionSheetButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#c6c6c8",
  },
  actionSheetButtonText: {
    fontSize: 17,
    fontWeight: "400",
    color: "#007aff",
    marginLeft: 12,
  },
  destructiveText: {
    color: "#ff3b30",
  },
  cancelText: {
    color: "#007aff",
    fontWeight: "600",
  },
  separator: {
    height: 8,
    backgroundColor: "#f2f2f7",
  },
  cancelButton: {
    backgroundColor: "#f2f2f7",
    borderBottomWidth: 0,
  },
});
