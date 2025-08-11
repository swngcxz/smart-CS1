import Header from "@/components/Header";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const markedDates = {
    "2025-07-24": { marked: true, dotColor: "#2e7d32" },
    "2025-07-26": { marked: true, dotColor: "#2e7d32" },
    "2025-07-29": { marked: true, dotColor: "#2e7d32" },
  };

  const collectorSchedule: Record<string, { time: string; collector: string }> = {
    "2025-07-24": { time: "9:00 AM", collector: "Collector A" },
    "2025-07-26": { time: "10:00 AM", collector: "Collector B" },
    "2025-07-29": { time: "8:30 AM", collector: "Collector C" },
  };

  const userTasks = [
    { id: "1", date: "2025-07-24", area: "Zone 1", task: "Collect Bin A" },
    { id: "2", date: "2025-07-26", area: "Zone 3", task: "Collect Bin C" },
    { id: "3", date: "2025-07-29", area: "Zone 2", task: "Collect Bin B" },
  ];

  const handleDayPress = (day: any) => {
    const date = day.dateString;
    if (collectorSchedule[date]) {
      setSelectedDate(date);
      setModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <Text style={styles.title}>Today's Collection Schedule</Text>

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

            {selectedDate && (
              <>
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Date</Text>
                  <Text style={styles.value}>{selectedDate}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Time</Text>
                  <Text style={styles.value}>{collectorSchedule[selectedDate].time}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Collector</Text>
                  <Text style={styles.value}>{collectorSchedule[selectedDate].collector}</Text>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Assigned Task Table (optional / separate) */}
      <Text style={styles.taskTitle}>Assigned Tasks</Text>
      <FlatList
        data={userTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskRow}>
            <Text style={styles.taskText}>{item.date}</Text>
            <Text style={styles.taskText}>{item.area}</Text>
            <Text style={styles.taskText}>{item.task}</Text>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={[styles.taskRow, { backgroundColor: "#e0e0e0" }]}>
            <Text style={styles.taskHeader}>Date</Text>
            <Text style={styles.taskHeader}>Area</Text>
            <Text style={styles.taskHeader}>Task</Text>
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
});
