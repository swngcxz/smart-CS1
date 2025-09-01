import BackButton from "@/components/BackButton";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const initialNotifications = [
  {
    id: "1",
    title: "New Task Assigned",
    message: "You have a new waste collection task.",
    timestamp: "2025-07-23T10:45:00",
    isRead: false,
  },
  {
    id: "2",
    title: "Task Completed",
    message: "Your previous task was marked as completed.",
    timestamp: "2025-07-22T16:20:00",
    isRead: true,
  },
  {
    id: "3",
    title: "Reminder",
    message: "Check bin 2nd floor before 5PM.",
    timestamp: "2025-07-24T08:15:00",
    isRead: false,
  },
  {
    id: "4",
    title: "Maintenance Notice",
    message: "System update tonight at 9 PM.",
    timestamp: "2025-07-21T11:30:00",
    isRead: true,
  },
];

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "read" | "unread">("all");

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Delete this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setNotifications((prev) => prev.filter((n) => n.id !== id)),
      },
    ]);
  };

  const handleMarkAsDone = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.isRead === (filter === "read"));

  return (
    <View style={styles.container}>
      <BackButton title="Home" />

      <Text style={styles.header}>Notifications</Text>

      {/* Filter Box */}
      <View style={styles.filterBox}>
        <TouchableOpacity
          onPress={() => setFilter("all")}
          style={[styles.filterButton, filter === "all" && styles.activeFilter]}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === "all" && styles.activeFilterText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("unread")}
          style={[
            styles.filterButton,
            filter === "unread" && styles.activeFilter,
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === "unread" && styles.activeFilterText,
            ]}
          >
            Unread
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter("read")}
          style={[
            styles.filterButton,
            filter === "read" && styles.activeFilter,
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === "read" && styles.activeFilterText,
            ]}
          >
            Read
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const date = new Date(item.timestamp);
          const formattedTimestamp = date.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          return (
            <TouchableOpacity
              onLongPress={() => handleDelete(item.id)} // long press delete popup
              delayLongPress={500}
            >
              <View style={[styles.card, item.isRead && styles.read]}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.timestamp}>{formattedTimestamp}</Text>

                {!item.isRead && (
                  <TouchableOpacity
                    style={styles.markButton}
                    onPress={() => handleMarkAsDone(item.id)}
                  >
                    <Text style={styles.markButtonText}>Mark as Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 30 }}>
            No notifications
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1, marginTop: 44 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  filterBox: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    padding: 3,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: "black", // default text color
  },
  activeFilter: {
    backgroundColor: "#4CAF50",
  },
  activeFilterText: {
    color: "white", // active text becomes white
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  read: { opacity: 0.6 },
  title: { fontSize: 16, fontWeight: "600" },
  message: { marginTop: 5, fontSize: 14 },
  timestamp: { marginTop: 8, fontSize: 12, color: "gray" },
  markButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#4CAF50",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  markButtonText: {
    color: "white",
    fontSize: 12,
  },
});
