import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import axiosInstance from "../../utils/axiosInstance";
import { useAccount } from "../../contexts/AccountContext";
import { safeTextRenderers } from "../../utils/textErrorHandler";

export default function ActivityLogsScreen() {
  const router = useRouter();
  const { account, loading: accountLoading } = useAccount();
  const [logs, setLogs] = useState<any[]>([]);
  const [archivedLogs, setArchivedLogs] = useState<any[]>([]);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch logs from backend
  const fetchActivityLogs = useCallback(async () => {
    if (!account?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('📱 Mobile App - Fetching activity logs for user:', account.email, 'ID:', account.id);
      
      // Get all activity logs from the server
      const response = await axiosInstance.get('/api/activitylogs');
      const allActivities = response.data.activities || [];
      
      console.log('📱 Mobile App - Total activities from server:', allActivities.length);
      
      // Filter activities based on status and assignment
      const filteredActivities = allActivities.filter((activity: any) => {
        console.log('📱 Mobile App - Filtering activity:', {
          id: activity.id,
          bin_id: activity.bin_id,
          status: activity.status,
          assigned_janitor_id: activity.assigned_janitor_id,
          user_id: account.id
        });
        
        // Only show tasks that are assigned to this user (in_progress or done)
        // Exclude all pending tasks from activity logs unless they are accepted by this user
        if ((activity.status === 'in_progress' || activity.status === 'done') && 
            activity.assigned_janitor_id === account.id) {
          console.log('✅ INCLUDING assigned task:', activity.id, 'for user:', account.id);
          return true;
        }
        
        // Do not show pending tasks in activity logs - they should only appear in notifications
        if (activity.status === 'pending') {
          console.log('❌ HIDING pending task (should only show in notifications):', activity.id);
          return false;
        }
        
        console.log('❌ HIDING other activity:', activity.id, 'status:', activity.status);
        return false;
      });
      
      console.log('📱 Mobile App - Filtered activities count:', filteredActivities.length);
      
      // Additional debug info (only in development)
      if (__DEV__ && filteredActivities.length === 0 && allActivities.length > 0) {
        console.log('📱 Mobile App - All activities were filtered out. Original activities:', 
          allActivities.map(a => ({ id: a.id, status: a.status, assigned_janitor_id: a.assigned_janitor_id }))
        );
      }
      
      // Debug: Log each activity's status fields (only in development)
      if (__DEV__ && filteredActivities.length > 0) {
        console.log(`📱 Mobile App - ${filteredActivities.length} filtered activities:`, 
          filteredActivities.map((activity: any) => ({
            id: activity.id,
            bin_id: activity.bin_id,
            status: activity.status,
            assigned_janitor_id: activity.assigned_janitor_id,
          }))
        );
      }
      
      setLogs(filteredActivities);
      
      console.log(`📱 Mobile App - Found ${allActivities.length} activity logs for ${account.email}`);
      
      // Log completed activities for debugging
      const completedActivities = allActivities.filter((activity: any) => activity.status === 'done');
      if (completedActivities.length > 0) {
        console.log('📱 Mobile App - Completed activities found:', completedActivities);
      }
    } catch (err: any) {
      console.error("📱 Mobile App - Failed to fetch activity logs:", err);
      setError(err.response?.data?.error || 'Failed to fetch activity logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [account?.id, account?.email]);

  // Fetch specific activity log by ID
  const fetchActivityLogById = async (activityId: string) => {
    try {
      console.log('📱 Mobile App - Fetching specific activity log:', activityId);
      const response = await axiosInstance.get(`/api/activitylogs/${activityId}`);
      console.log('📱 Mobile App - Got specific activity log:', response.data);
      return response.data;
    } catch (err: any) {
      console.error("📱 Mobile App - Failed to fetch specific activity log:", err);
      return null;
    }
  };

  // Fetch logs from backend on mount
  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Mobile App - Activity logs screen focused, refreshing data...');
      fetchActivityLogs();
    }, [fetchActivityLogs])
  );

  // Map backend fields to UI-expected fields
  const mappedLogs = (logs as any[]).map((log, index) => ({
    ...log,
    id: log.id || log.activity_id || `log_${index}`, // Ensure we have an ID
    type: log.activity_type || "task_assignment",
    message:
      log.task_note && log.task_note.trim() !== ""
        ? log.task_note
        : `Task for bin ${log.bin_id}`,
    bin: log.bin_id,
    location: log.bin_location,
    time: log.time,
    date: log.date,
    status: (() => {
      // Proper status logic: completed > in_progress > pending
      if (log.status === "done" || log.completed_at || log.proof_image || log.photos?.length > 0) {
        return "done"; // Task is completed (has proof)
      } else if (log.assigned_janitor_id) {
        return "in_progress"; // Janitor assigned but not completed
      } else {
        return "pending"; // No janitor assigned
      }
    })(),
    bin_status: (() => {
      // Same logic for bin_status
      if (log.bin_status === "done" || log.completed_at || log.proof_image || log.photos?.length > 0) {
        return "done";
      } else if (log.assigned_janitor_id) {
        return "in_progress";
      } else {
        return "pending";
      }
    })(),
    // Include completion details for done activities
    completion_notes: log.completion_notes || log.status_notes,
    bin_condition: log.bin_condition,
    proof_image: log.proof_image || log.photos?.[0],
    collection_time: log.collection_time || log.completed_at,
    user_id: log.user_id,
    user_name: log.user_name || log.completed_by?.user_name,
    checklist: log.checklist,
    pickup_location: log.pickup_location,
    // Additional completion data
    collected_weight: log.collected_weight,
    completed_by: log.completed_by,
    photos: log.photos || [],
    created_at: log.created_at,
    updated_at: log.updated_at,
  }));

  // ✅ Toggle selection (used in long press)
  const toggleSelection = (index: number) => {
    setSelectedLogs((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleBulkDelete = () => {
    if (selectedLogs.length === 0) return;
    Alert.alert(
      "Delete Selected Logs",
      "Are you sure you want to delete selected logs?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedLogs = logs.filter((_, i) => !selectedLogs.includes(i));
            setLogs(updatedLogs);
            setSelectedLogs([]);
          },
        },
      ]
    );
  };

  const handleArchive = () => {
    if (selectedLogs.length === 0) return;
    Alert.alert("Archive Logs", "Do you want to archive selected logs?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: () => {
          const toArchive = logs.filter((_, i) => selectedLogs.includes(i));
          setArchivedLogs((prev) => [...prev, ...toArchive]);
          const updatedLogs = logs.filter((_, i) => !selectedLogs.includes(i));
          setLogs(updatedLogs);
          setSelectedLogs([]);
        },
      },
    ]);
  };


  const handleUpdateComplete = () => {
    // Refresh the logs after update
    const fetchActivityLogs = async () => {
      if (!account?.id) return;

      try {
        let response;
        try {
          response = await axiosInstance.get(`/api/activitylogs/assigned/${account.id}`);
        } catch (assignedErr) {
          response = await axiosInstance.get(`/api/activitylogs/${account.id}`);
        }

        const activities = response.data.activities || [];
        setLogs(activities);
      } catch (err: any) {
        console.error("📱 Mobile App - Failed to refresh activity logs:", err);
      }
    };

    fetchActivityLogs();
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "login":
        return styles.badgeLogin;
      case "pickup":
        return styles.badgePickup;
      case "emptied":
        return styles.badgeEmptied;
      case "error":
        return styles.badgeError;
      case "maintenance":
        return styles.badgeMaintenance;
      default:
        return styles.badgeDefault;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "done":
        return styles.statusDone;
      case "in_progress":
        return styles.statusInProgress;
      case "cancelled":
        return styles.statusCancelled;
      case "pending":
      default:
        return styles.statusPending;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return "checkmark-circle";
      case "in_progress":
        return "time";
      case "cancelled":
        return "close-circle";
      case "pending":
      default:
        return "hourglass";
    }
  };

  const renderLogCard = (log: any, index: number, isArchived = false) => (
    <View
      key={index}
      style={[
        styles.logCard,
        selectedLogs.includes(index) && !isArchived && styles.selectedCard,
      ]}
    >
      {/* Title row with status and type badges */}
      <View style={styles.logTitleRow}>
        <Text style={styles.logTitle}>{safeTextRenderers.binTitle(log.bin)}</Text>
        <View style={{ flex: 1 }} />
        <View style={styles.badgeContainer}>
          <View style={[styles.statusBadge, getStatusBadgeStyle(log.status)]}>
            <Ionicons 
              name={getStatusIcon(log.status) as any} 
              size={12} 
              color="#fff" 
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>{safeTextRenderers.statusText(log.status)}</Text>
          </View>
          <View style={[styles.typeBadge, getBadgeStyle(log.type)]}>
            <Text style={styles.badgeText}>{safeTextRenderers.typeText(log.type)}</Text>
          </View>
        </View>
      </View>

      {/* Message */}
      <View style={styles.logMsgRow}>
        <Text style={styles.logMessage}>{safeTextRenderers.messageText(log.message)}</Text>
      </View>

      {/* Location and Time details */}
      <View style={styles.logDetailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.logSubtext}>{safeTextRenderers.locationText(log.location)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.logTime}>{safeTextRenderers.timeText(log.date, log.time)}</Text>
        </View>
      </View>

      {/* Action buttons */}
      {!isArchived && (
        <View style={styles.cardActions}>
          {log.status === "done" ? (
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => {
                console.log('📱 Mobile App - Viewing completed activity:', log);
                router.push({
                  pathname: "/home/activity-details",
                  params: { 
                    binId: log.bin ?? "N/A",
                    activityLog: JSON.stringify(log),
                    isReadOnly: "true"
                  },
                });
              }}
            >
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => {
                console.log('📱 Mobile App - Viewing pending activity:', log);
                router.push({
                  pathname: "/home/activity-details",
                  params: { 
                    binId: log.bin ?? "N/A",
                    activityLog: JSON.stringify(log),
                    isReadOnly: "false"
                  },
                });
              }}
            >
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { width: 40, alignItems: "flex-start" }]}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>
            {showArchive ? "Archived Logs" : "Activity Logs"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowArchive(!showArchive)}
          style={[styles.archiveIcon, { width: 40, alignItems: "flex-end" }]}
        >
          <Ionicons
            name={showArchive ? "time-outline" : "archive-outline"}
            size={24}
            color="#000"
          />
        </TouchableOpacity>
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading activity logs...</Text>
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              // Trigger refetch by updating a dependency
              setLogs([]);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}


      {/* Logs list */}
      {!loading && !error && (
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          {mappedLogs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No activity logs found</Text>
              <Text style={styles.emptySubtext}>
                Activity logs will appear here when tasks are assigned to you
              </Text>
            </View>
          ) : (
            <>
              {showArchive
                ? archivedLogs.map((log, idx) => renderLogCard(log, idx, true))
                : mappedLogs.map((log, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        console.log('📱 Mobile App - Clicking activity log:', log);
                          router.push({
                            pathname: "/home/activity-details",
                            params: { 
                              binId: log.bin ?? "N/A",
                              activityLog: JSON.stringify(log),
                              isReadOnly: log.status === "done" ? "true" : "false"
                            },
                          });
                      }}
                      onLongPress={() => toggleSelection(idx)}
                    >
                      {renderLogCard(log, idx)}
                    </TouchableOpacity>
                  ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Action buttons */}
      {!showArchive && selectedLogs.length > 0 && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#000000ff" }]}
            onPress={handleArchive}
          >
            <Ionicons name="archive-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Archive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#f44336" }]}
            onPress={handleBulkDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Update Activity Modal */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#000" },
  archiveIcon: { marginLeft: 10 },

  logCard: {
    flexDirection: "column",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedCard: { backgroundColor: "#e6f4ea", borderColor: "#4CAF50" },
  logMessage: { fontSize: 15, fontWeight: "600", color: "#333" },
  logTime: { fontSize: 12, color: "#777", marginTop: 4 },
  logSubtext: { fontSize: 13, color: "#555", marginTop: 4 },
  logTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 2 },
  logTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  logMsgRow: { marginBottom: 8 },
  logDetailsRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 8,
    paddingVertical: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
  },
  badgeLogin: { backgroundColor: "#64b5f6" },
  badgePickup: { backgroundColor: "#ffd54f" },
  badgeEmptied: { backgroundColor: "#81c784" },
  badgeError: { backgroundColor: "#f44336" },
  badgeMaintenance: { backgroundColor: "#ffc107" },
  badgeDefault: { backgroundColor: "#9e9e9e" },

  actionRow: {
    position: "absolute",
    bottom: 30,
    right: 20,
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
  },
  actionText: { color: "#fff", fontWeight: "bold", marginLeft: 6 },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  // Error styles
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },


  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Card action styles
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  disabledButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  disabledButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ccc',
    marginLeft: 4,
  },

  // Status indicator styles
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusIcon: {
    marginRight: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusDone: {
    backgroundColor: '#4CAF50',
  },
  statusInProgress: {
    backgroundColor: '#FF9800',
  },
  statusCancelled: {
    backgroundColor: '#F44336',
  },
  statusPending: {
    backgroundColor: '#9E9E9E',
  },
});
