import BackButton from "@/components/BackButton";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useNotifications, formatNotificationTime } from "@/hooks/useNotifications";

export default function ArchivedNotificationsScreen() {
  const { notifications, loading, error, refresh } = useNotifications();

  const archived = useMemo(() => notifications.filter((n) => n.read), [notifications]);

  return (
    <View style={styles.container}>
      <BackButton title="Archived" />

      <View style={styles.topRow}>
        <Text style={styles.header}>Archived Notifications</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading archived notifications</Text>
        </View>
      ) : (
        <FlatList
          data={archived}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const formatted = formatNotificationTime(item.timestamp);
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>{item.title}</Text>
                </View>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.timestamp}>{formatted}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="archive-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No archived notifications</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} colors={["#4CAF50"]} tintColor="#4CAF50" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flex: 1, marginTop: 44 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  header: { fontSize: 24, fontWeight: "bold" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 },
  errorText: { fontSize: 16, color: "#f44336", marginBottom: 10 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 50 },
  emptyText: { fontSize: 16, color: "#666", marginTop: 12 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 6,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "#ccc",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 16, fontWeight: "600", flex: 1 },
  message: { marginTop: 4, fontSize: 14, lineHeight: 20 },
  timestamp: { marginTop: 8, fontSize: 12, color: "gray" },
});
