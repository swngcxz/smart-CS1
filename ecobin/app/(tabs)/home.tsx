import Header from "@/components/Header";
import { RootStackParamList } from "@/types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, FlatList, Modal, Pressable } from "react-native";
import apiClient from "@/utils/apiConfig";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "react-native-calendars";
import {
  useMaintenanceSchedules,
  formatMaintenanceType,
  getMaintenanceTypeColor,
  formatMaintenanceDate,
  getMaintenanceCalendarDotColor,
  formatMaintenanceTimeRange,
  isDateInPast as isMaintenanceDateInPast,
} from "@/hooks/useMaintenanceSchedules";
import {
  useTrashCollectionSchedules,
  formatTrashCollectionType,
  getTrashCollectionTypeColor,
  formatTrashCollectionDate,
  getTrashCollectionCalendarDotColor,
  formatTrashCollectionTimeRange,
  isDateInPast as isTrashCollectionDateInPast,
} from "@/hooks/useTrashCollectionSchedules";

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

  // Schedule state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Use the separate schedule hooks
  const {
    schedules: maintenanceSchedules,
    loading: maintenanceLoading,
    getSchedulesByDate: getMaintenanceSchedulesByDate,
    getTodaySchedules: getTodayMaintenanceSchedules,
  } = useMaintenanceSchedules();
  const {
    schedules: trashCollectionSchedules,
    loading: trashCollectionLoading,
    getSchedulesByDate: getTrashCollectionSchedulesByDate,
    getTodaySchedules: getTodayTrashCollectionSchedules,
  } = useTrashCollectionSchedules();

  // Fetch activity logs for the logged-in user
  const fetchActivityLogs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get("/api/activitylogs");

      if (response.data && response.data.activities) {
        // Filter logs assigned to the current user and only show in_progress status
        const userLogs = response.data.activities.filter(
          (log: ActivityLog) => log.assigned_janitor_id === user.id && log.status === "in_progress"
        );

        // Sort by creation date (newest first)
        const sortedLogs = userLogs.sort(
          (a: ActivityLog, b: ActivityLog) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Store all logs and show only latest 3 on home
        setAllActivityLogs(sortedLogs);
        setActivityLogs(sortedLogs.slice(0, 3));
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch activity logs");
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
    if (status === "done") {
      return styles.badgeEmptied; // Green for completed tasks
    } else if (status === "in_progress") {
      return styles.badgePickup; // Yellow for in-progress tasks
    } else if (activityType === "task_assignment") {
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
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else {
      return logDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
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
        {
          id: "Bin 1",
          level: 0,
          status: "normal",
          capacity: "500L",
          type: "Mixed",
          lastCollected: "55 min ago",
          nextCollection: "Tomorrow 9:00 AM",
        },
        {
          id: "Bin 2",
          level: 60,
          status: "warning",
          capacity: "450L",
          type: "Organic",
          lastCollected: "3 hours ago",
          nextCollection: "Today 4:30 PM",
        },
        {
          id: "Bin 3",
          level: 90,
          status: "critical",
          capacity: "600L",
          type: "Recyclable",
          lastCollected: "1 hour ago",
          nextCollection: "Today 5:30 PM",
        },
        {
          id: "Bin 4",
          level: 50,
          status: "normal",
          capacity: "550L",
          type: "Mixed",
          lastCollected: "5 hours ago",
          nextCollection: "Today 6:00 PM",
        },
      ],
    },
    {
      name: "Park Avenue",
      overallLevel: 46,
      status: "normal",
      lastCollected: "1 day ago",
      nearlyFullCount: 2, // Bin 6 at 70% and Bin 7 at 95% (nearly full)
      totalBins: 4,
      bins: [
        {
          id: "Bin 5",
          level: 46,
          status: "normal",
          capacity: "300L",
          type: "Mixed",
          lastCollected: "1 day ago",
          nextCollection: "Tomorrow 10:00 AM",
        },
        {
          id: "Bin 6",
          level: 20,
          status: "normal",
          capacity: "250L",
          type: "Paper",
          lastCollected: "2 days ago",
          nextCollection: "Tomorrow 11:00 AM",
        },
        {
          id: "Bin 7",
          level: 70,
          status: "warning",
          capacity: "400L",
          type: "Plastic",
          lastCollected: "1 day ago",
          nextCollection: "Today 3:00 PM",
        },
        {
          id: "Bin 8",
          level: 95,
          status: "critical",
          capacity: "350L",
          type: "Glass",
          lastCollected: "1 day ago",
          nextCollection: "Today 2:00 PM",
        },
      ],
    },
    {
      name: "Mall District",
      overallLevel: 93,
      status: "critical",
      lastCollected: "4 hours ago",
      nearlyFullCount: 4, // All bins are nearly full (85%+)
      totalBins: 4,
      bins: [
        {
          id: "Bin 9",
          level: 93,
          status: "critical",
          capacity: "700L",
          type: "Mixed",
          lastCollected: "4 hours ago",
          nextCollection: "Today 1:00 PM",
        },
        {
          id: "Bin 10",
          level: 98,
          status: "critical",
          capacity: "650L",
          type: "Organic",
          lastCollected: "4 hours ago",
          nextCollection: "Today 1:00 PM",
        },
        {
          id: "Bin 11",
          level: 85,
          status: "critical",
          capacity: "500L",
          type: "Recyclable",
          lastCollected: "4 hours ago",
          nextCollection: "Today 1:00 PM",
        },
        {
          id: "Bin 12",
          level: 90,
          status: "critical",
          capacity: "550L",
          type: "Plastic",
          lastCollected: "4 hours ago",
          nextCollection: "Today 1:00 PM",
        },
      ],
    },
    {
      name: "Residential Area",
      overallLevel: 35,
      status: "normal",
      lastCollected: "2 hours ago",
      nearlyFullCount: 0,
      totalBins: 3,
      bins: [
        {
          id: "Bin 13",
          level: 20,
          status: "normal",
          capacity: "300L",
          type: "Mixed",
          lastCollected: "2 hours ago",
          nextCollection: "Tomorrow 8:00 AM",
        },
        {
          id: "Bin 14",
          level: 45,
          status: "normal",
          capacity: "250L",
          type: "Organic",
          lastCollected: "3 hours ago",
          nextCollection: "Tomorrow 9:00 AM",
        },
        {
          id: "Bin 15",
          level: 40,
          status: "normal",
          capacity: "400L",
          type: "Recyclable",
          lastCollected: "4 hours ago",
          nextCollection: "Tomorrow 10:00 AM",
        },
      ],
    },
  ];

  const getFillColor = (level: number) => {
    if (level <= 50) return "#4caf50";
    if (level <= 80) return "#ff9800";
    return "#f44336";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "#4caf50";
      case "warning":
        return "#ff9800";
      case "critical":
        return "#f44336";
      default:
        return "#4caf50";
    }
  };

  const handleLocationPress = (locationName: string) => {
    // Navigate to location bins page
    router.push({
      pathname: "/location-bins",
      params: {
        locationName,
        locationData: JSON.stringify(locationData.find((loc) => loc.name === locationName)),
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

  // Schedule functions
  const handleDayPress = (day: any) => {
    const date = day.dateString;
    const schedulesForDate = [...getMaintenanceSchedulesByDate(date), ...getTrashCollectionSchedulesByDate(date)];

    if (schedulesForDate.length > 0) {
      setSelectedDate(date);
      setModalVisible(true);
    }
  };

  // Combine all schedules for display
  const allSchedules = [...maintenanceSchedules, ...trashCollectionSchedules];
  const todaySchedules = [...getTodayMaintenanceSchedules(), ...getTodayTrashCollectionSchedules()];
  const toAmPm = (hhmm: string) => {
    const match = hhmm.match(/^\s*(\d{1,2}):(\d{2})\s*$/);
    if (!match) return hhmm;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const period = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${period}`;
  };

  const formatTimeLabel = (time?: string) => {
    if (!time) return "TBD";
    // If already contains AM/PM, keep as-is
    if (/am|pm/i.test(time)) return time;
    // Handle ranges like "08:00-17:00" or "08:00 - 17:00"
    const range = time.split(/\s*-\s*/);
    if (range.length === 2) {
      return `${toAmPm(range[0])} - ${toAmPm(range[1])}`;
    }
    return toAmPm(time);
  };

  // Create marked dates: green background for any day with schedules, gray for today
  const markedDates = (() => {
    const result: Record<string, any> = {};
    // Mark days that have any schedule in green
    const scheduledDays = new Set(allSchedules.map((s) => s.date));
    scheduledDays.forEach((dateKey) => {
      result[dateKey] = {
        customStyles: {
          container: {
            backgroundColor: "#2e7d32",
            borderRadius: 999,
          },
          text: {
            color: "#ffffff",
            fontWeight: "700",
          },
        },
      };
    });

    // Mark today's date in gray (overrides green if both)
    const todayKey = new Date().toISOString().split("T")[0];
    result[todayKey] = {
      customStyles: {
        container: {
          backgroundColor: "#9e9e9e",
          borderRadius: 999,
        },
        text: {
          color: "#ffffff",
          fontWeight: "700",
        },
      },
    };

    return result;
  })();

  // Get schedules for selected date
  const selectedDateSchedules = selectedDate
    ? [...getMaintenanceSchedulesByDate(selectedDate), ...getTrashCollectionSchedulesByDate(selectedDate)]
    : [];

  // Format assigned tasks for display with new structure (only upcoming schedules)
  const assignedTasks = allSchedules
    .filter((schedule) => {
      // Use appropriate date check based on schedule type
      const isPast =
        schedule.type === "maintenance"
          ? isMaintenanceDateInPast(schedule.date)
          : isTrashCollectionDateInPast(schedule.date);
      return !isPast;
    })
    .map((schedule) => {
      // Type-safe property access
      const name =
        "staffName" in schedule ? schedule.staffName : "driverName" in schedule ? schedule.driverName : "Unassigned";
      const startTime =
        "start_time" in schedule
          ? schedule.start_time
          : "start_collected" in schedule
          ? schedule.start_collected
          : undefined;
      const endTime =
        "end_time" in schedule ? schedule.end_time : "end_collected" in schedule ? schedule.end_collected : undefined;

      // Use appropriate formatting based on schedule type
      const formattedTime =
        schedule.type === "maintenance"
          ? formatMaintenanceTimeRange(startTime, endTime)
          : formatTrashCollectionTimeRange(startTime, endTime);

      const formattedType = schedule.type === "maintenance" ? formatMaintenanceType() : formatTrashCollectionType();

      return {
        id: schedule.id,
        name: name || "Unassigned",
        time: formattedTime,
        area: schedule.area,
        type: formattedType,
        status: schedule.status,
        date: schedule.date, // Keep for filtering
      };
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.header}>
        <Header />
      </View>

      <Text style={styles.sectionTitle}>Location Overview</Text>

      {/* Location Cards - Vertical Layout */}
      <View style={styles.locationContainer}>
        {locationData.map((location, index) => (
          <View key={index} style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationLevelRight}>{location.overallLevel}%</Text>
            </View>

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
              <Text style={styles.nearlyFullText}>{location.nearlyFullCount} nearly full bins</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Schedule Section */}
      <Text style={styles.sectionTitle}>Schedule Overview</Text>

      {/* Loading indicator for schedules */}
      {(maintenanceLoading || trashCollectionLoading) && (
        <View style={styles.loadingHeader}>
          <ActivityIndicator size="small" color="#2e7d32" />
          <Text style={styles.loadingHeaderText}>Loading schedules...</Text>
        </View>
      )}

      <View style={styles.scheduleContainer}>
        <View style={styles.calendarWrapper}>
          <Calendar
            markedDates={markedDates}
            enableSwipeMonths
            hideExtraDays
            firstDay={1}
            showWeekNumbers={false}
            disableMonthChange={false}
            disableArrowLeft={false}
            disableArrowRight={false}
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#2e7d32",
              selectedDayBackgroundColor: "#2e7d32",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#ffffff",
              todayBackgroundColor: "#4caf50",
              dayTextColor: "#2d3748",
              textDisabledColor: "#a0aec0",
              dotColor: "#2e7d32",
              selectedDotColor: "#ffffff",
              arrowColor: "#2e7d32",
              monthTextColor: "#1a202c",
              indicatorColor: "#2e7d32",
              textDayFontWeight: "600",
              textMonthFontWeight: "700",
              textDayHeaderFontWeight: "600",
              textDayFontSize: 16,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 14,
            }}
            onDayPress={handleDayPress}
            markingType="custom"
            hideArrows={false}
            renderArrow={(direction) =>
              direction === "left" ? (
                <Ionicons name="chevron-back" size={24} color="#2e7d32" />
              ) : (
                <Ionicons name="chevron-forward" size={24} color="#2e7d32" />
              )
            }
            renderHeader={(date) => {
              const month = date.toString("MMMM yyyy");
              return (
                <View style={styles.calendarHeader}>
                  <Text style={styles.calendarHeaderText}>{month}</Text>
                </View>
              );
            }}
          />
        </View>
      </View>

      {/* Schedule Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackground} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <Pressable
              accessibilityLabel="Close"
              onPress={() => setModalVisible(false)}
              hitSlop={12}
              style={styles.closeIcon}
            >
              <Text style={styles.closeIconText}>×</Text>
            </Pressable>

            <Text style={styles.modalTitle}>Schedule Details</Text>

            {selectedDate && selectedDateSchedules.length > 0 && (
              <>
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Date</Text>
                  <Text style={styles.value}>
                    {selectedDateSchedules.some((s) => s.type === "maintenance")
                      ? formatMaintenanceDate(selectedDate)
                      : formatTrashCollectionDate(selectedDate)}
                  </Text>
                </View>

                {selectedDateSchedules.map((schedule, index) => {
                  const typeLabel =
                    schedule.type === "maintenance" ? formatMaintenanceType() : formatTrashCollectionType();
                  const typeColor = schedule.type === "maintenance" ? "#1565C0" : getTrashCollectionTypeColor();
                  const assignee =
                    "staffName" in schedule
                      ? schedule.staffName
                      : "driverName" in schedule
                      ? schedule.driverName
                      : "Unassigned";
                  return (
                    <View key={schedule.id} style={styles.scheduleItemCard}>
                      <View style={styles.scheduleItemHeader}>
                        <View style={[styles.typeChip, { backgroundColor: typeColor }]}>
                          <Text style={styles.typeChipText}>{typeLabel}</Text>
                        </View>
                        <View style={styles.timeRow}>
                          <Ionicons name="time-outline" size={14} color="#555" style={{ marginRight: 4 }} />
                          <Text style={styles.timeText}>{formatTimeLabel(schedule.time)}</Text>
                        </View>
                      </View>

                      <View style={styles.scheduleItemRow}>
                        <Text style={styles.rowLabel}>Area</Text>
                        <Text style={styles.rowValue}>{schedule.area}</Text>
                      </View>

                      <View style={styles.scheduleItemFooter}>
                        <Text style={styles.assignedText}>Assigned: {assignee}</Text>
                      </View>

                      {index < selectedDateSchedules.length - 1 && <View style={styles.divider} />}
                    </View>
                  );
                })}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: "#f8f9fa",
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  locationLevelRight: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "right",
    marginLeft: 8,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: "#f44336",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  emptySubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  // Schedule Styles
  scheduleContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 80,
    marginHorizontal: 0,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  calendarWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 0,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#ffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  calendarHeaderText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a202c",
    letterSpacing: 0.5,
  },
  loadingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#f8f9fa",
    marginBottom: 10,
    borderRadius: 8,
  },
  loadingHeaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  // Modal Styles
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "88%",
    elevation: 5,
    position: "relative",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#111",
  },
  closeIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 10,
  },
  closeIconText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2e7d32",
    lineHeight: 22,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    color: "#333",
  },
  value: {
    color: "#111",
    fontWeight: "600",
  },
  scheduleCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  scheduleItem: {
    marginBottom: 15,
  },
  scheduleItemCard: {
    marginBottom: 15,
  },
  scheduleItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  timeText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  rowLabel: {
    fontWeight: "600",
    color: "#333",
  },
  rowValue: {
    color: "#111",
    fontWeight: "600",
  },
  scheduleItemFooter: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assignedText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "600",
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statusDone: {
    backgroundColor: "#4caf50",
  },
  statusInProgress: {
    backgroundColor: "#ff9800",
  },
  statusPending: {
    backgroundColor: "#9e9e9e",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 10,
  },
});
