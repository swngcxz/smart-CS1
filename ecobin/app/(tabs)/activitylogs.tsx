import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { FlatList, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
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
      
      const response = await apiClient.get('/api/activitylogs');
      
      if (response.data && response.data.activities) {
        // Show all activity logs for the current user, regardless of status
        const userLogs = response.data.activities.filter((log: ActivityLog) => 
          log.assigned_janitor_id === user.id
        );
        
        // Sort by creation date (newest first)
        const sortedLogs = userLogs.sort((a: ActivityLog, b: ActivityLog) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setActivityLogs(sortedLogs);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity logs');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#4caf50'; // Green for completed
      case 'in_progress': return '#ffd54f'; // Yellow for in progress
      case 'pending': return '#2196f3';
      default: return '#ffd54f'; // Default to yellow
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return '#ff9800'; // Orange for high
      case 'medium': return '#ff9800'; // Orange for medium
      case 'low': return '#4caf50'; // Green for low
      default: return '#ff9800'; // Default to orange
    }
  };

  const formatActivityMessage = (log: ActivityLog) => {
    return `${log.activity_type.replace('_', ' ').toUpperCase()} - ${log.bin_id}`;
  };

  const formatActivityTime = (createdAt: string) => {
    const logDate = new Date(createdAt);
    return logDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderActivityLog = ({ item }: { item: ActivityLog }) => (
    <TouchableOpacity 
      style={styles.logCard}
      onPress={() => handleOpenModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>
          {item.status === 'done' ? `Completed task for ${item.bin_id}` : `Working on ${item.bin_id}`}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>
            {item.status === 'done' ? 'COMPLETED' : 'IN PROGRESS'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.logTime}>{formatActivityTime(item.created_at)}</Text>
      
      <View style={styles.logLocationRow}>
        <Ionicons name="location" size={16} color="#f44336" />
        <Text style={styles.logLocation}>{item.bin_id} - {item.bin_location}</Text>
      </View>
      
      {item.task_note && (
        <View style={styles.noteContainer}>
          <Text style={styles.logNote}>{item.task_note}</Text>
        </View>
      )}
      
      <View style={styles.logFooter}>
        <Text style={styles.fillLevelText}>Fill Level: {item.bin_level}%</Text>
        <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
          {item.priority.toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.tapToViewText}>Tap to view details</Text>
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchActivityLogs(true)}
              tintColor="#2e7d32"
            />
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
    fontSize: 16,
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
    paddingBottom: 20,
  },
  logCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  logLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logLocation: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
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
    fontWeight: "500",
  },
  priorityText: {
    fontSize: 14,
    fontWeight: "600",
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
