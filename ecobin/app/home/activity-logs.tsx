import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const initialLogs = [
  { type: "emptied", message: "Emptied Bin A1", bin: "A1", location: "Main Entrance", time: "9:42 AM", date: "Today" },
  { type: "pickup", message: "Picked up Bin B2", bin: "B2", location: "Cafeteria", time: "8:15 AM", date: "Today" },
  { type: "login", message: "User Logged In", time: "7:58 AM", date: "Today" },
  { type: "error", message: "Sensor Error in Bin D4", bin: "D4", location: "Parking Lot", time: "2:10 AM", date: "Yesterday" },
];

export default function ActivityLogsScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState(initialLogs);
  const [archivedLogs, setArchivedLogs] = useState<typeof initialLogs>([]);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [showArchive, setShowArchive] = useState(false);

  const toggleSelection = (index: number) => {
    setSelectedLogs((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
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

  const renderLogCard = (log: any, index: number, isArchived = false) => (
    <View
      key={index}
      style={[
        styles.logCard,
        selectedLogs.includes(index) && !isArchived && styles.selectedCard,
      ]}
    >
      <View style={styles.logTextContainer}>
        <Text style={styles.logMessage}>{log.message}</Text>
        <Text style={styles.logTime}>
          {log.date} – {log.time}
        </Text>
        {log.bin && log.location && (
          <Text style={styles.logSubtext}>📍 Bin {log.bin} – {log.location}</Text>
        )}
      </View>

      {/* Badge with colored background */}
      <View style={[styles.typeBadge, getBadgeStyle(log.type)]}>
        <Text style={styles.badgeText}>{log.type}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {showArchive ? "Archived Logs" : "Activity Logs"}
        </Text>
        <TouchableOpacity onPress={() => setShowArchive(!showArchive)}>
          <Ionicons
            name={showArchive ? "time-outline" : "archive-outline"}
            size={24}
            color="#000"
            style={styles.archiveIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Logs list */}
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {showArchive
          ? archivedLogs.map((log, idx) => renderLogCard(log, idx, true))
          : logs.map((log, idx) => (
              <TouchableOpacity key={idx} onPress={() => toggleSelection(idx)}>
                {renderLogCard(log, idx)}
              </TouchableOpacity>
            ))}
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 60 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#000", flex: 1, textAlign: "center" },
  archiveIcon: { marginLeft: 10 },

  logCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedCard: { backgroundColor: "#e6f4ea", borderColor: "#4CAF50" },
  logTextContainer: { flex: 1, paddingRight: 10 },
  logMessage: { fontSize: 15, fontWeight: "600", color: "#333" },
  logTime: { fontSize: 12, color: "#777", marginTop: 4 },
  logSubtext: { fontSize: 13, color: "#555", marginTop: 4 },

  /* Badge styles */
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
    textTransform: "uppercase", // first letter uppercase
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
});
