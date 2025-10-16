import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Calendar } from "react-native-calendars";
import { useMaintenanceSchedules, formatMaintenanceType, getMaintenanceTypeColor, formatMaintenanceDate, getMaintenanceCalendarDotColor, formatMaintenanceTimeRange, isDateInPast as isMaintenanceDateInPast } from "@/hooks/useMaintenanceSchedules";
import { useTrashCollectionSchedules, formatTrashCollectionType, getTrashCollectionTypeColor, formatTrashCollectionDate, getTrashCollectionCalendarDotColor, formatTrashCollectionTimeRange, isDateInPast as isTrashCollectionDateInPast } from "@/hooks/useTrashCollectionSchedules";

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Use the separate schedule hooks
  const { schedules: maintenanceSchedules, loading: maintenanceLoading, getSchedulesByDate: getMaintenanceSchedulesByDate, getTodaySchedules: getTodayMaintenanceSchedules } = useMaintenanceSchedules();
  const { schedules: trashCollectionSchedules, loading: trashCollectionLoading, getSchedulesByDate: getTrashCollectionSchedulesByDate, getTodaySchedules: getTodayTrashCollectionSchedules } = useTrashCollectionSchedules();

  // Combine all schedules for display
  const allSchedules = [...maintenanceSchedules, ...trashCollectionSchedules];
  const todaySchedules = [...getTodayMaintenanceSchedules(), ...getTodayTrashCollectionSchedules()];

  // Debug logging
  console.log('📅 All schedules:', allSchedules);
  console.log('🔧 Maintenance schedules count:', maintenanceSchedules.length);
  console.log('🗑️ Trash collection schedules count:', trashCollectionSchedules.length);

  // Create marked dates for calendar with past date validation
  const markedDates = allSchedules.reduce((acc, schedule) => {
    const dateKey = schedule.date;
    if (!acc[dateKey]) {
      // Use appropriate dot color based on schedule type
      const dotColor = schedule.type === 'maintenance' 
        ? getMaintenanceCalendarDotColor(schedule.date)
        : getTrashCollectionCalendarDotColor(schedule.date);
      acc[dateKey] = { marked: true, dotColor };
    }
    return acc;
  }, {} as Record<string, { marked: boolean; dotColor: string }>);

  console.log('📅 Marked dates:', markedDates);

  // Get schedules for selected date
  const selectedDateSchedules = selectedDate ? [
    ...getMaintenanceSchedulesByDate(selectedDate),
    ...getTrashCollectionSchedulesByDate(selectedDate)
  ] : [];

  // Format assigned tasks for display with new structure (only upcoming schedules)
  const assignedTasks = allSchedules
    .filter(schedule => {
      // Use appropriate date check based on schedule type
      const isPast = schedule.type === 'maintenance' 
        ? isMaintenanceDateInPast(schedule.date)
        : isTrashCollectionDateInPast(schedule.date);
      return !isPast;
    })
    .map(schedule => {
      // Type-safe property access
      const name = 'staffName' in schedule ? schedule.staffName : 
                   'driverName' in schedule ? schedule.driverName : 'Unassigned';
      const startTime = 'start_time' in schedule ? schedule.start_time : 
                        'start_collected' in schedule ? schedule.start_collected : undefined;
      const endTime = 'end_time' in schedule ? schedule.end_time : 
                      'end_collected' in schedule ? schedule.end_collected : undefined;
      
      // Use appropriate formatting based on schedule type
      const formattedTime = schedule.type === 'maintenance'
        ? formatMaintenanceTimeRange(startTime, endTime)
        : formatTrashCollectionTimeRange(startTime, endTime);
      
      const formattedType = schedule.type === 'maintenance'
        ? formatMaintenanceType()
        : formatTrashCollectionType();
      
      return {
        id: schedule.id,
        name: name || 'Unassigned',
        time: formattedTime,
        area: schedule.area,
        type: formattedType,
        status: schedule.status,
        date: schedule.date, // Keep for filtering
      };
    });

  // Debug logging for upcoming schedules
  console.log('📅 Upcoming schedules count:', assignedTasks.length);

  const handleDayPress = (day: any) => {
    const date = day.dateString;
    const schedulesForDate = [
      ...getMaintenanceSchedulesByDate(date),
      ...getTrashCollectionSchedulesByDate(date)
    ];
    
    if (schedulesForDate.length > 0) {
      setSelectedDate(date);
      setModalVisible(true);
    }
  };

  // Show UI immediately, loading indicator in header
  const isLoading = maintenanceLoading || trashCollectionLoading;

  return (
    <View style={styles.container}>
      <Header />
      <Text style={styles.title}>Schedule Management</Text>
      
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingHeader}>
          <ActivityIndicator size="small" color="#2e7d32" />
          <Text style={styles.loadingHeaderText}>Loading schedules...</Text>
        </View>
      )}

      <Calendar
        markedDates={markedDates}
        enableSwipeMonths
        theme={{
          backgroundColor: "#ffffff",
          calendarBackground: "#ffffff",
          textSectionTitleColor: "#388e3c",
          selectedDayBackgroundColor: "#a5d6a7",
          selectedDayTextColor: "#1b5e20",
          todayTextColor: "#2e7d32",
          dayTextColor: "#333",
          dotColor: "#2e7d32",
          arrowColor: "#2e7d32",
          monthTextColor: "#2e7d32",
          textDayFontWeight: "500",
          textMonthFontWeight: "bold",
          textDayFontSize: 16,
          textMonthFontSize: 18,
        }}
        onDayPress={handleDayPress}
      />

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
                    {selectedDateSchedules.some(s => s.type === 'maintenance') 
                      ? formatMaintenanceDate(selectedDate) 
                      : formatTrashCollectionDate(selectedDate)}
                  </Text>
                </View>
                <Text style={styles.scheduleCount}>
                  {selectedDateSchedules.length} schedule{selectedDateSchedules.length > 1 ? 's' : ''} found
                </Text>
                
                {selectedDateSchedules.map((schedule, index) => (
                  <View key={schedule.id} style={styles.scheduleItem}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.label}>Type</Text>
                      <Text style={[styles.value, { 
                        color: schedule.type === 'maintenance' 
                          ? getMaintenanceTypeColor() 
                          : getTrashCollectionTypeColor() 
                      }]}>
                        {schedule.type === 'maintenance' 
                          ? formatMaintenanceType() 
                          : formatTrashCollectionType()}
                      </Text>
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={styles.label}>Area</Text>
                      <Text style={styles.value}>{schedule.area}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Time</Text>
                      <Text style={styles.value}>{schedule.time || 'TBD'}</Text>
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={styles.label}>Status</Text>
                      <Text style={styles.value}>{schedule.status}</Text>
                </View>
                <View style={styles.rowBetween}>
                      <Text style={styles.label}>Assigned To</Text>
                      <Text style={styles.value}>
                        {'staffName' in schedule ? schedule.staffName : 
                         'driverName' in schedule ? schedule.driverName : 'Unassigned'}
                      </Text>
                    </View>
                    {index < selectedDateSchedules.length - 1 && <View style={styles.divider} />}
                </View>
                ))}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Assigned Tasks Table */}
      <Text style={styles.taskTitle}>Assigned Tasks</Text>
      <FlatList
        data={assignedTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskRow}>
            <Text style={styles.taskText}>{item.name}</Text>
            <Text style={styles.taskText}>{item.time}</Text>
            <Text style={styles.taskText}>{item.area}</Text>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={[styles.taskRow, { backgroundColor: "#e0e0e0" }]}>
            <Text style={styles.taskHeader}>Name</Text>
            <Text style={styles.taskHeader}>Time</Text>
            <Text style={styles.taskHeader}>Area</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming schedules found</Text>
          </View>
        )}
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
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
  taskTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
    color: "#000",
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  taskHeader: {
    flex: 1,
    fontWeight: "bold",
    color: "#000",
  },
  taskText: {
    flex: 1,
    color: "#333",
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
  scheduleCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  scheduleItem: {
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 10,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
});
