import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import axiosInstance from "../../utils/axiosInstance";

export default function ActivityLogsScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [archivedLogs, setArchivedLogs] = useState<any[]>([]);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [showArchive, setShowArchive] = useState(false);

  // Fetch logs from backend on mount
  useEffect(() => {
    const janitorId = "Ogf04pQwTMAChaFm0Af8"; // Replace with dynamic user id if needed
    axiosInstance
      .get(`/api/activitylogs/assigned/${janitorId}`)
      .then((res) => {
        setLogs(res.data.activities || []);
      })
      .catch((err) => {
        console.error("Failed to fetch activity logs", err);
      });
  }, []);

  // Map backend fields to UI-expected fields
  const mappedLogs = (logs as any[]).map((log) => ({
    ...log,
    type: log.activity_type || "task_assignment",
    message:
      log.task_note && log.task_note.trim() !== ""
        ? log.task_note
        : `Task for bin ${log.bin_id}`,
    bin: log.bin_id,
    location: log.bin_location,
    time: log.time,
    date: log.date,
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
      {/* Title row */}
      <View style={styles.logTitleRow}>
        <Text style={styles.logTitle}>{`Bin ${log.bin}`}</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.typeBadge, getBadgeStyle(log.type)]}>
          <Text style={styles.badgeText}>{String(log.type)}</Text>
        </View>
      </View>

      {/* Message */}
      <View style={styles.logMsgRow}>
        <Text style={styles.logMessage}>{String(log.message)}</Text>
      </View>

      {/* Location + Date/Time */}
      <View style={styles.logLocTimeRow}>
        {log.location && (
          <Text style={styles.logSubtext}>{`📍 ${log.location}`}</Text>
        )}
        <View style={{ flex: 1 }} />
        <Text style={styles.logTime}>{`${log.date} ${log.time}`}</Text>
      </View>
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

      {/* Logs list */}
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {showArchive
          ? archivedLogs.map((log, idx) => renderLogCard(log, idx, true))
          : mappedLogs.map((log, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  router.push({
                    pathname: "/home/proof-of-pickup",
                    params: { binId: log.bin ?? "N/A" }, // ✅ expo-router correct way
                  });
                }}
                onLongPress={() => toggleSelection(idx)}
              >
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
  logLocTimeRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },

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
});
