import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { FlatList, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useLocalSearchParams } from "expo-router";
import apiClient from "@/utils/apiConfig";
import ActivityDetailsModal from "@/components/ActivityDetailsModal";

interface ActivityLog {
  id: string;
  bin_id: string;
  bin_location: string;
  bin_level: number;
  activity_type: string;
  task_note?: string;
  assigned_janitor_id?: string;
  assigned_janitor_name?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  completion_notes?: string;
  photos?: string[];
  bin_condition?: string;
  collected_weight?: number;
  collection_time?: string;
  user_name?: string;
}

export default function ActivityLogsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch activity logs
  const fetchActivityLogs = async (isRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiClient.get("/api/activitylogs");

      if (response.data && response.data.activities) {
        // Show all activity logs for the current user, regardless of status
        const userLogs = response.data.activities.filter((log: ActivityLog) => log.assigned_janitor_id === user.id);

        // Sort by creation date (newest first)
        const sortedLogs = userLogs.sort(
          (a: ActivityLog, b: ActivityLog) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setActivityLogs(sortedLogs);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch activity logs");
      setActivityLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch activity logs when component mounts
  useEffect(() => {
    if (user) {
      fetchActivityLogs();
    }
  }, [user]);

  // Handle opening activity details modal
  const handleOpenModal = (activity: ActivityLog) => {
    setSelectedActivity(activity);
    setModalVisible(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedActivity(null);
  };

  // Handle updating activity (refresh the list)
  const handleUpdateActivity = () => {
    fetchActivityLogs();
  };

  // Handle automatic opening of activity when arriving at bin location
  useEffect(() => {
    try {
      // Only proceed if we have the required params and activity logs are loaded
      if (!params || !params.openActivityId || !params.binLocation || activityLogs.length === 0) {
        return;
      }

      console.log("[ActivityLogsScreen] Looking for activity:", {
        binId: params.openActivityId,
        location: params.binLocation,
      });

      // Find the activity that matches the bin ID and location
      const targetActivity = activityLogs.find(
        (log) => log.bin_id === params.openActivityId && log.bin_location === params.binLocation
      );

      if (targetActivity) {
        console.log("[ActivityLogsScreen] Found target activity:", targetActivity.id);
        setSelectedActivity(targetActivity);
        setModalVisible(true);

        // Clear the params to prevent re-triggering
        router.replace("/(tabs)/activitylogs");
      } else {
        console.log("[ActivityLogsScreen] No matching activity found");
      }
    } catch (error) {
      console.error("[ActivityLogsScreen] Error handling params:", error);
    }
  }, [params, activityLogs]);

  // Handle navigation to map with route
  const handleNavigateToMap = (
    binId: string,
    binLocation: string,
    coordinates: { latitude: number; longitude: number },
    activityStatus?: string
  ) => {
    // Navigate to map tab with route parameters
    router.push({
      pathname: "/(tabs)/map",
      params: {
        navigateToBin: "true",
        binId: binId,
        binLocation: binLocation,
        latitude: coordinates.latitude.toString(),
        longitude: coordinates.longitude.toString(),
        activityStatus: activityStatus || "pending",
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "#4caf50"; // Green for completed
      case "in_progress":
        return "#ffd54f"; // Yellow for in progress
      case "pending":
        return "#2196f3";
      default:
        return "#ffd54f"; // Default to yellow
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "#f44336"; // Red for high
      case "medium":
        return "#ff9800"; // Orange for medium
      case "low":
        return "#4caf50"; // Green for low
      default:
        return "#ff9800"; // Default to orange
    }
  };

  const formatActivityMessage = (log: ActivityLog) => {
    return `${log.activity_type.replace("_", " ").toUpperCase()} - ${
      log.bin_id.charAt(0).toUpperCase() + log.bin_id.slice(1).toLowerCase()
    }`;
  };

  const formatActivityTime = (createdAt: string) => {
    const logDate = new Date(createdAt);
    return logDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderActivityLog = ({ item }: { item: ActivityLog }) => (
    <TouchableOpacity style={styles.logCard} onPress={() => handleOpenModal(item)} activeOpacity={0.7}>
      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>
          {item.status === "done"
            ? `Completed task for ${item.bin_id.charAt(0).toUpperCase() + item.bin_id.slice(1).toLowerCase()}`
            : `Working on ${item.bin_id.charAt(0).toUpperCase() + item.bin_id.slice(1).toLowerCase()}`}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status === "done" ? "Completed" : "In progress"}</Text>
        </View>
      </View>

      <View style={styles.logLocationRow}>
        <Text style={styles.logLocation}>
          {item.bin_id.charAt(0).toUpperCase() + item.bin_id.slice(1).toLowerCase()} - {item.bin_location}
        </Text>
        <Text style={styles.logTime}>{formatActivityTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading activity logs...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Activity Logs</Text>
        <Text style={styles.logCount}>{activityLogs.length} logs</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchActivityLogs()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activityLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderActivityLog}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchActivityLogs(true)} tintColor="#2e7d32" />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No activity logs found</Text>
              <Text style={styles.emptySubtext}>Your activity history will appear here</Text>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Activity Details Modal */}
      <ActivityDetailsModal
        visible={modalVisible}
        activity={selectedActivity}
        onClose={handleCloseModal}
        onUpdate={handleUpdateActivity}
        onNavigateToMap={handleNavigateToMap}
        user={user}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  logCount: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 4,
  },
  logCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 12,
  },
  logTime: {
    fontSize: 11,
    color: "#666",
  },
  logLocationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 10,
  },
  logLocation: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  noteContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  logNote: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },
  logFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fillLevelText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  priorityBadgeText: {
    fontSize: 8,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  tapToViewText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: "absolute",
    top: 0,
    right: 0,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
