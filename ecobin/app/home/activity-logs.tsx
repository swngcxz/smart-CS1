import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const initialLogs = [
  { type: "emptied", message: "Emptied Bin A1", bin: "A1", location: "Main Entrance", time: "9:42 AM", date: "Today" },
  { type: "pickup", message: "Picked up Bin B2", bin: "B2", location: "Cafeteria", time: "8:15 AM", date: "Today" },
  { type: "login", message: "User Logged In", time: "7:58 AM", date: "Today" },
  {
    type: "emptied",
    message: "Emptied Bin C3",
    bin: "C3",
    location: "Library Hall",
    time: "6:12 PM",
    date: "Yesterday",
  },
  { type: "session", message: "Session Started", time: "4:35 PM", date: "Yesterday" },
  { type: "session", message: "Session Ended", time: "5:45 PM", date: "Yesterday" },
  {
    type: "error",
    message: "Sensor Error in Bin D4",
    bin: "D4",
    location: "Parking Lot",
    time: "2:10 AM",
    date: "Yesterday",
  },
  {
    type: "maintenance",
    message: "Maintenance Scheduled for Bin E1",
    bin: "E1",
    location: "Reception",
    time: "1:00 PM",
    date: "2 Days Ago",
  },
  { type: "login", message: "User Logged In", time: "7:00 AM", date: "2 Days Ago" },
  {
    type: "pickup",
    message: "Picked up Bin F6",
    bin: "F6",
    location: "2nd Floor Lobby",
    time: "11:22 AM",
    date: "2 Days Ago",
  },
  {
    type: "emptied",
    message: "Emptied Bin G7",
    bin: "G7",
    location: "Server Room",
    time: "3:55 PM",
    date: "3 Days Ago",
  },
];

export default function ActivityLogsScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);

  const toggleSelection = (index: number) => {
    setSelectedLogs((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  const handleBulkDelete = () => {
    if (selectedLogs.length === 0) return;

    Alert.alert("Delete Selected Logs", "Are you sure you want to delete selected logs?", [
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
    ]);
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "login":
        return { backgroundColor: "#64b5f6" };
      case "emptied":
        return { backgroundColor: "#81c784" };
      case "pickup":
        return { backgroundColor: "#ffd54f" };
      case "session":
        return { backgroundColor: "#9575cd" };
      case "error":
        return { backgroundColor: "#e57373" };
      case "maintenance":
        return { backgroundColor: "#4dd0e1" };
      default:
        return { backgroundColor: "#bdbdbd" };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Logs</Text>
        <Ionicons name="archive-outline" size={24} color="#000" style={styles.archiveIcon} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {logs.map((log, index) => (
          <TouchableOpacity key={index} onPress={() => toggleSelection(index)}>
            <View style={styles.logCard}>
              {/* Left side: message and info */}
              <View style={styles.logTextContainer}>
                <Text style={styles.logMessage}>{log.message}</Text>
                <Text style={styles.logTime}>
                  {log.date} – {log.time}
                </Text>
                {log.bin && log.location && (
                  <Text style={styles.logSubtext}>
                    📍 Bin {log.bin} – {log.location}
                  </Text>
                )}
              </View>

              {/* Right side: badge above checkbox */}
              <View style={styles.rightColumn}>
                <View style={[styles.typeBadge, getBadgeStyle(log.type)]}>
                  <Text style={styles.badgeText}>{log.type.toUpperCase()}</Text>
                </View>
                <View style={styles.checkboxCircle}>
                  {selectedLogs.includes(index) && <View style={styles.innerDot} />}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedLogs.length > 0 && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleBulkDelete}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
      )}
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
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
  },
  archiveIcon: {
    marginLeft: 10,
  },

  logCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  logTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  logMessage: {
    fontSize: 15,
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

  // Right column container
  rightColumn: {
    alignItems: "center",
    justifyContent: "center",
  },

  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

  checkboxCircle: {
    width: 15,
    height: 15,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  innerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "green",
  },

  deleteButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#f44336",
    borderRadius: 30,
    padding: 14,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
