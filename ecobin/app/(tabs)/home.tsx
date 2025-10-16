import Header from "@/components/Header";
import { RootStackParamList } from "@/types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import apiClient from "@/utils/apiConfig";
import { useAuth } from "@/hooks/useAuth";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

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
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = React.useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [allActivityLogs, setAllActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch activity logs for the logged-in user
  const fetchActivityLogs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get('/api/activitylogs');
      
      if (response.data && response.data.activities) {
        // Filter logs assigned to the current user and only show in_progress status
        const userLogs = response.data.activities.filter((log: ActivityLog) => 
          log.assigned_janitor_id === user.id && 
          log.status === 'in_progress'
        );
        
        // Sort by creation date (newest first)
        const sortedLogs = userLogs.sort((a: ActivityLog, b: ActivityLog) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // Store all logs and show only latest 3 on home
        setAllActivityLogs(sortedLogs);
        setActivityLogs(sortedLogs.slice(0, 3));
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity logs');
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity logs when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchActivityLogs();
    }
  }, [user]);

  const getBadgeStyle = (status: string, activityType: string) => {
    if (status === 'done') {
      return styles.badgeEmptied; // Green for completed tasks
    } else if (status === 'in_progress') {
      return styles.badgePickup; // Yellow for in-progress tasks
    } else if (activityType === 'task_assignment') {
      return styles.badgeLogin; // Blue for task assignments
    }
    return styles.badgeLogin; // Default
  };

  const formatActivityMessage = (log: ActivityLog) => {
    // Since we only show in_progress tasks, always show "Working on"
    return `Working on ${log.bin_id}`;
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

  // Updated data structure - only 4 locations in overview
  const locationData = [
    {
      name: "Central Plaza",
      overallLevel: 50,
      status: "normal",
      lastCollected: "55 min ago",
      nearlyFullCount: 1, // Only Bin 3 is at 90% (nearly full)
      totalBins: 4,
      bins: [
        { id: "Bin 1", level: 0, status: "normal", capacity: "500L", type: "Mixed", lastCollected: "55 min ago", nextCollection: "Tomorrow 9:00 AM" },
        { id: "Bin 2", level: 60, status: "warning", capacity: "450L", type: "Organic", lastCollected: "3 hours ago", nextCollection: "Today 4:30 PM" },
        { id: "Bin 3", level: 90, status: "critical", capacity: "600L", type: "Recyclable", lastCollected: "1 hour ago", nextCollection: "Today 5:30 PM" },
        { id: "Bin 4", level: 50, status: "normal", capacity: "550L", type: "Mixed", lastCollected: "5 hours ago", nextCollection: "Today 6:00 PM" },
      ]
    },
    {
      name: "Park Avenue",
      overallLevel: 46,
      status: "normal",
      lastCollected: "1 day ago",
      nearlyFullCount: 2, // Bin 6 at 70% and Bin 7 at 95% (nearly full)
      totalBins: 4,
      bins: [
        { id: "Bin 5", level: 46, status: "normal", capacity: "300L", type: "Mixed", lastCollected: "1 day ago", nextCollection: "Tomorrow 10:00 AM" },
        { id: "Bin 6", level: 20, status: "normal", capacity: "250L", type: "Paper", lastCollected: "2 days ago", nextCollection: "Tomorrow 11:00 AM" },
        { id: "Bin 7", level: 70, status: "warning", capacity: "400L", type: "Plastic", lastCollected: "1 day ago", nextCollection: "Today 3:00 PM" },
        { id: "Bin 8", level: 95, status: "critical", capacity: "350L", type: "Glass", lastCollected: "1 day ago", nextCollection: "Today 2:00 PM" },
      ]
    },
    {
      name: "Mall District",
      overallLevel: 93,
      status: "critical",
      lastCollected: "4 hours ago",
      nearlyFullCount: 4, // All bins are nearly full (85%+)
      totalBins: 4,
      bins: [
        { id: "Bin 9", level: 93, status: "critical", capacity: "700L", type: "Mixed", lastCollected: "4 hours ago", nextCollection: "Today 1:00 PM" },
        { id: "Bin 10", level: 98, status: "critical", capacity: "650L", type: "Organic", lastCollected: "4 hours ago", nextCollection: "Today 1:00 PM" },
        { id: "Bin 11", level: 85, status: "critical", capacity: "500L", type: "Recyclable", lastCollected: "4 hours ago", nextCollection: "Today 1:00 PM" },
        { id: "Bin 12", level: 90, status: "critical", capacity: "550L", type: "Plastic", lastCollected: "4 hours ago", nextCollection: "Today 1:00 PM" },
      ]
    },
    {
      name: "Residential Area",
      overallLevel: 35,
      status: "normal",
      lastCollected: "2 hours ago",
      nearlyFullCount: 0,
      totalBins: 3,
      bins: [
        { id: "Bin 13", level: 20, status: "normal", capacity: "300L", type: "Mixed", lastCollected: "2 hours ago", nextCollection: "Tomorrow 8:00 AM" },
        { id: "Bin 14", level: 45, status: "normal", capacity: "250L", type: "Organic", lastCollected: "3 hours ago", nextCollection: "Tomorrow 9:00 AM" },
        { id: "Bin 15", level: 40, status: "normal", capacity: "400L", type: "Recyclable", lastCollected: "4 hours ago", nextCollection: "Tomorrow 10:00 AM" },
      ]
    },
  ];

  const getFillColor = (level: number) => {
    if (level <= 50) return "#4caf50";
    if (level <= 80) return "#ff9800";
    return "#f44336";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "#4caf50";
      case "warning": return "#ff9800";
      case "critical": return "#f44336";
      default: return "#4caf50";
    }
  };

  const handleLocationPress = (locationName: string) => {
    // Navigate to location bins page
    router.push({
      pathname: "/location-bins",
      params: {
        locationName,
        locationData: JSON.stringify(locationData.find(loc => loc.name === locationName))
      },
    });
  };

  const handleBinPress = (binId: string, locationName: string) => {
    router.push({
      pathname: "/home/bin-details",
      params: {
        binId,
        location: locationName,
        logs: JSON.stringify(activityLogs),
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.header}>
        <Header />
      </View>

      <Text style={styles.sectionTitle}>Location Overview</Text>
      
      {/* Location Cards - Vertical Layout */}
      <View style={styles.locationContainer}>
        {locationData.map((location, index) => (
          <TouchableOpacity 
            key={index} 
            onPress={() => handleLocationPress(location.name)} 
            style={styles.locationCard}
          >
            <View style={styles.locationHeader}>
              <Text style={styles.locationName}>{location.name}</Text>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusLabel, { color: getStatusColor(location.status) }]}>
                  {location.status}
                </Text>
              </View>
          </View>
            
            <Text style={styles.locationLevel}>{location.overallLevel}%</Text>
            
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                    width: `${location.overallLevel}%`,
                    backgroundColor: getFillColor(location.overallLevel),
                },
              ]}
            />
          </View>
            
            <View style={styles.locationFooter}>
              <Text style={styles.lastCollectedText}>Last collected {location.lastCollected}</Text>
              <Text style={styles.nearlyFullText}>
                {location.nearlyFullCount} nearly full bins
              </Text>
            </View>
        </TouchableOpacity>
      ))}
      </View>

      <View style={styles.activityHeader}>
        <Text style={styles.sectionTitle}>Current Tasks</Text>
        {allActivityLogs.length > 0 && (
          <TouchableOpacity onPress={() => {
            console.log('Navigating to activity logs, current logs:', allActivityLogs.length);
            router.push("/activity-logs");
          }}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading current tasks...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load activity logs</Text>
          <TouchableOpacity onPress={fetchActivityLogs} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : activityLogs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No current tasks</Text>
          <Text style={styles.emptySubtext}>You don't have any tasks in progress right now</Text>
        </View>
      ) : (
        activityLogs.map((log, index) => (
          <View key={log.id} style={styles.logCard}>
          <View style={styles.logTextContainer}>
              <Text style={styles.logMessage}>{formatActivityMessage(log)}</Text>
            <Text style={styles.logTime}>
                {formatActivityTime(log.created_at)}
            </Text>
              <Text style={styles.logSubtext}>
                📍 {log.bin_id} – {log.bin_location}
              </Text>
          </View>

          <View style={styles.rightColumn}>
              <View style={[styles.typeBadge, getBadgeStyle(log.status, log.activity_type)]}>
                <Text style={styles.badgeText}>
                  IN PROGRESS
                </Text>
            </View>
          </View>
        </View>
        ))
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginTop: 44,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#000",
  },
  card: {
    backgroundColor: "#f0f4f0",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardHeader: {
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  cardSub: {
    fontSize: 13,
    color: "#666",
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: "#ddd",
    borderRadius: 6,
    overflow: "hidden",
    marginVertical: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  cardValue: {
    fontSize: 13,
    color: "#333",
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  seeAllText: {
    color: "#2e7d32",
    fontWeight: "500",
    fontSize: 13,
    marginTop: 2,
  },
  logCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#f4f4f4",
  },
  logTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  logMessage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  logTime: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  logSubtext: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },
  rightColumn: {
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#ccc",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  badgeLogin: {
    backgroundColor: "#64b5f6",
  },
  badgePickup: {
    backgroundColor: "#ffd54f",
  },
  badgeEmptied: {
    backgroundColor: "#81c784",
  },
  // Location Overview Styles
  locationContainer: {
    marginBottom: 20,
  },
  locationCard: {
    backgroundColor: "#f0f4f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  locationLevel: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  locationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  lastCollectedText: {
    fontSize: 11,
    color: "#666",
  },
  nearlyFullText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  // Activity Logs Loading/Error Styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});
