// app/(tabs)/home.tsx
import React from "react";
import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useRealTimeData } from "../../hooks/useRealTimeData";
import { ProgressBar } from "react-native-paper";
import { useRouter } from "expo-router";
import axiosInstance from "../../utils/axiosInstance";

export default function HomeScreen() {
  const router = useRouter();
  const { wasteBins, loading } = useRealTimeData();

  // Static locations (except Central Plaza, which is real-time)
  const staticLocations = [
    { id: "central-plaza", name: "Central Plaza" },
    { id: "park-avenue", name: "Park Avenue", bins: [30, 40, 55, 60], lastCollected: "1 day ago" },
    { id: "mall-district", name: "Mall District", bins: [90, 95, 85, 100], lastCollected: "4 hours ago" },
    { id: "residential-area", name: "Residential Area", bins: [45, 60, 50, 70], lastCollected: "6 hours ago" },
  ];

  // Central Plaza real-time
  const centralPlazaBins = wasteBins.filter((bin) => bin.location.toLowerCase() === "central plaza");
  const centralPlazaLevels = centralPlazaBins.map((bin) => bin.level);
  const centralPlazaAvg = centralPlazaLevels.length > 0 ? centralPlazaLevels.reduce((s, v) => s + v, 0) / centralPlazaLevels.length : 0;
  const centralPlazaNearlyFull = centralPlazaLevels.filter((v) => v >= 80).length;
  const centralPlazaLastCollected = centralPlazaBins.length > 0 ? centralPlazaBins[0].lastCollected : "Unknown";

  // Activity logs from backend
  const [logs, setLogs] = useState<any[]>([]);
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
  const mappedLogs = logs.map((log) => ({
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

  const getStatusColor = (val: number) => {
    if (val >= 90) return "#f44336";
    if (val >= 60) return "#ff9800";
    return "#4caf50";
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "login": return styles.badgeLogin;
      case "pickup": return styles.badgePickup;
      case "emptied": return styles.badgeEmptied;
      case "error": return styles.badgeError;
      default: return styles.badgeDefault;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={styles.header}><Header /></View>
      <Text style={styles.sectionTitle}>Bin Locations</Text>
      {/* Central Plaza (real-time) */}
      <TouchableOpacity
        key="central-plaza"
        style={styles.locationCard}
        onPress={() =>
          router.push({
            pathname: "/home/binlocation",
            params: { id: "central-plaza" },
          })
        }
      >
        <View style={styles.topRow}>
          <Text style={styles.locationName}>Central Plaza</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(centralPlazaAvg) }]}> 
            <Text style={styles.badgeText}>
              {centralPlazaAvg >= 90 ? "critical" : centralPlazaAvg >= 60 ? "warning" : "normal"}
            </Text>
          </View>
        </View>
        <Text style={styles.percentText}>{Math.round(centralPlazaAvg)}%</Text>
        <ProgressBar progress={centralPlazaAvg / 100} color={getStatusColor(centralPlazaAvg)} style={styles.progress} />
        <Text style={styles.subText}>Nearly full bins: {centralPlazaNearlyFull} / {centralPlazaLevels.length}</Text>
        <Text style={styles.subText}>Last collected: {centralPlazaLastCollected}</Text>
      </TouchableOpacity>

      {/* Other locations (static) */}
      {staticLocations.slice(1).map((loc) => {
        // Robust checks for missing bins and lastCollected
        const bins = Array.isArray(loc.bins) ? loc.bins : [];
        const avg = bins.length > 0 ? bins.reduce((s, v) => s + v, 0) / bins.length : 0;
        const nearlyFull = bins.filter((v) => v >= 80).length;
        const lastCollected = typeof loc.lastCollected === "string" ? loc.lastCollected : "Unknown";
        return (
          <TouchableOpacity
            key={loc.id}
            style={styles.locationCard}
            onPress={() =>
              router.push({
                pathname: "/home/binlocation",
                params: { id: loc.id },
              })
            }
          >
            <View style={styles.topRow}>
              <Text style={styles.locationName}>{loc.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(avg) }]}> 
                <Text style={styles.badgeText}>
                  {avg >= 90 ? "critical" : avg >= 60 ? "warning" : "normal"}
                </Text>
              </View>
            </View>
            <Text style={styles.percentText}>{Math.round(avg)}%</Text>
            <ProgressBar progress={avg / 100} color={getStatusColor(avg)} style={styles.progress} />
            <Text style={styles.subText}>Nearly full bins: {nearlyFull} / {bins.length}</Text>
            <Text style={styles.subText}>Last collected: {lastCollected}</Text>
          </TouchableOpacity>
        );
      })}
      <View style={styles.activityHeader}>
        <Text style={styles.sectionTitle}>Activity Logs</Text>
        <TouchableOpacity onPress={() => router.push("/home/activity-logs")}> 
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
  {mappedLogs.slice(0, 3).map((log, i) => (
        <TouchableOpacity
          key={i}
          onPress={() =>
            router.push({
              pathname: "/home/proof-of-pickup",
              params: { binId: log.bin ?? "N/A" },
            })
          }
        >
          <View style={styles.logCard}>
            <View style={styles.logTextContainer}>
              <Text style={styles.logMessage}>{log.message}</Text>
              <Text style={styles.logTime}>{log.date} – {log.time}</Text>
              <Text style={styles.logSubtext}>📍 Bin {log.bin} – {log.location}</Text>
            </View>
            <View style={[styles.typeBadge, getBadgeStyle(log.type)]}>
              <Text style={styles.badgeText}>{log.type.toUpperCase()}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 16, marginBottom: 90 },
  header: { marginTop: 44, marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: "600", marginBottom: 15, color: "#000" },

  // Location cards
  locationCard: { backgroundColor: "#fafafa", borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#ddd", elevation: 2 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  locationName: { fontSize: 16, fontWeight: "600", color: "#333" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, color: "#fff", fontWeight: "bold", textTransform: "capitalize" },
  percentText: { fontSize: 22, fontWeight: "700", color: "#000", marginTop: 8 },
  progress: { height: 6, borderRadius: 6, marginVertical: 6 },
  subText: { fontSize: 12, color: "#555" },

  // Logs
  activityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 20 },
  seeAllText: { color: "#2e7d32", fontWeight: "500", fontSize: 13, marginTop: 2 },
  logCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, padding: 14, marginBottom: 12, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#ddd" },
  logTextContainer: { flex: 1, paddingRight: 10 },
  logMessage: { fontSize: 14, fontWeight: "600", color: "#333" },
  logTime: { fontSize: 12, color: "#777", marginTop: 4 },
  logSubtext: { fontSize: 13, color: "#555", marginTop: 4 },

  // Badges
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "center" },
  badgeLogin: { backgroundColor: "#64b5f6" },
  badgePickup: { backgroundColor: "#ffd54f" },
  badgeEmptied: { backgroundColor: "#81c784" },
  badgeError: { backgroundColor: "#f44336" },
  badgeDefault: { backgroundColor: "#9e9e9e" },
});
