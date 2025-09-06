import BackButton from "@/components/BackButton";
import React from "react";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAccount } from "@/hooks/useAccount"; // current user info from /auth/me
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationScreen() {
  const { account } = useAccount();
  const janitorId = useMemo(() => account?.id, [account]);
  const { notifications, loading, error, markAsRead, refresh, setNotifications } = useNotifications(janitorId, { auto: true, intervalMs: 10000 });
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

  const handleMarkAsDone = async (id: string) => {
    await markAsRead(id);
  };

  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n: any) => (n.read ? "read" : "unread") === filter);

  return (
    <View style={styles.container}>
      <BackButton title="Home" />

      <Text style={styles.header}>Notifications</Text>
      {!!error && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{String(error)}</Text>
      )}

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
        keyExtractor={(item: any) => item.id}
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

                {!item.read && (
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
