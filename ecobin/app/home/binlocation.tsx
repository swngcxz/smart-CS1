import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { ProgressBar } from "react-native-paper";

const binsData = {
  "central-plaza": [
    { id: "A1", location: "Bin A1", level: 45, capacity: 120, lastCollected: "2 days ago", locationArea: "Central Plaza - North" },
    { id: "A2", location: "Bin A2", level: 70, capacity: 100, lastCollected: "5 hours ago", locationArea: "Central Plaza - East" },
    { id: "A3", location: "Bin A3", level: 20, capacity: 90, lastCollected: "1 day ago", locationArea: "Central Plaza - West" },
    { id: "A4", location: "Bin A4", level: 95, capacity: 110, lastCollected: "3 hours ago", locationArea: "Central Plaza - South" },
  ],
  "park-avenue": [
    { id: "B1", location: "Bin B1", level: 60, capacity: 150, lastCollected: "6 hours ago", locationArea: "Park Avenue - Gate 1" },
    { id: "B2", location: "Bin B2", level: 75, capacity: 140, lastCollected: "12 hours ago", locationArea: "Park Avenue - Gate 2" },
    { id: "B3", location: "Bin B3", level: 50, capacity: 100, lastCollected: "1 day ago", locationArea: "Park Avenue - Playground" },
    { id: "B4", location: "Bin B4", level: 90, capacity: 130, lastCollected: "2 hours ago", locationArea: "Park Avenue - Parking Lot" },
  ],
  "residential-area": [
    { id: "C1", location: "Bin C1", level: 40, capacity: 120, lastCollected: "1 day ago", locationArea: "Residential Area - Block A" },
    { id: "C2", location: "Bin C2", level: 80, capacity: 110, lastCollected: "8 hours ago", locationArea: "Residential Area - Block B" },
    { id: "C3", location: "Bin C3", level: 65, capacity: 130, lastCollected: "12 hours ago", locationArea: "Residential Area - Block C" },
    { id: "C4", location: "Bin C4", level: 95, capacity: 100, lastCollected: "2 hours ago", locationArea: "Residential Area - Block D" },
  ],
  "mall-district": [
    { id: "D1", location: "Bin D1", level: 30, capacity: 200, lastCollected: "3 days ago", locationArea: "Mall District - Entrance" },
    { id: "D2", location: "Bin D2", level: 55, capacity: 170, lastCollected: "10 hours ago", locationArea: "Mall District - Food Court" },
    { id: "D3", location: "Bin D3", level: 85, capacity: 150, lastCollected: "4 hours ago", locationArea: "Mall District - Parking" },
    { id: "D4", location: "Bin D4", level: 99, capacity: 180, lastCollected: "1 hour ago", locationArea: "Mall District - Cinema" },
  ],
};

export default function LocationBinsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const bins = binsData[id as keyof typeof binsData] || [];

  const getStatusColor = (val: number) => {
    if (val >= 90) return "#f44336"; // red
    if (val >= 60) return "#ff9800"; // orange
    return "#4caf50"; // green
  };

  return (
    <ScrollView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{id?.replace("-", " ").toUpperCase()}</Text>

      {bins.length > 0 ? (
        bins.map((bin) => {
          const statusColor = getStatusColor(bin.level);
          const statusLabel =
            bin.level >= 90 ? "Critical" : bin.level >= 60 ? "Warning" : "Normal";

          return (
            <View key={bin.id} style={styles.card}>
              {/* Title row with badge */}
              <View style={styles.topRow}>
                <Text style={styles.cardTitle}>{bin.location}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.badgeText}>{statusLabel}</Text>
                </View>
              </View>

              {/* Progress */}
              <Text style={styles.percentText}>{bin.level}%</Text>
              <ProgressBar progress={bin.level / 100} color={statusColor} style={styles.progress} />

              {/* Details */}
              <View style={styles.row}>
                <Text style={styles.info}>Capacity: {bin.capacity} L</Text>
                <Text style={styles.info}>Last Collected: {bin.lastCollected}</Text>
              </View>
              <Text style={styles.info}>Area: {bin.locationArea}</Text>
            </View>
          );
        })
      ) : (
        <Text style={styles.noBins}>No bins registered in this location.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, marginTop: 50 },
  backButton: { marginBottom: 10 },
  backText: { fontSize: 16, color: "#2e7d32", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, color: "#000", textAlign: "center" },

  // Bin card
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, color: "#fff", fontWeight: "bold", textTransform: "capitalize" },

  percentText: { fontSize: 16, fontWeight: "600", marginTop: 10, color: "#000" },
  progress: { height: 8, borderRadius: 6, marginVertical: 8 },

  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  info: { fontSize: 13, color: "#444", flex: 1 },
  noBins: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 20 },
});
