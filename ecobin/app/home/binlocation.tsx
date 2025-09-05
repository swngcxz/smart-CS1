
import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ProgressBar } from "react-native-paper";
import BackButton from "@/components/BackButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRealTimeData } from "../../hooks/useRealTimeData";

export default function LocationBinsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { wasteBins, loading, error } = useRealTimeData();

  // Optionally filter bins by location if needed
  const bins = id
    ? wasteBins.filter(
        (b) =>
          b.location &&
          b.location.toLowerCase().replace(/ /g, "-") === id
      )
    : wasteBins;

  const getStatusColor = (val: number) => {
    if (val >= 90) return "#f44336"; // red
    if (val >= 60) return "#ff9800"; // orange
    return "#4caf50"; // green
  };

  return (
    <ScrollView style={styles.container}>
      <BackButton />
      <Text style={styles.title}>{id?.replace("-", " ").toUpperCase()}</Text>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 40 }}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text>Loading bins...</Text>
        </View>
      ) : bins.length > 0 ? (
        bins.map((bin) => {
          const statusColor = getStatusColor(bin.level);
          const statusLabel =
            bin.level >= 90 ? "Critical" : bin.level >= 60 ? "Warning" : "Normal";

          return (
            <TouchableOpacity
              key={bin.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/home/bin-details",
                  params: {
                    binId: bin.id,
                    location: bin.location,
                    area: bin.location,
                    capacity: String(bin.capacity),
                    lastCollected: bin.lastCollected,
                    level: String(bin.level),
                    latitude: String(bin.binData?.latitude ?? ""),
                    longitude: String(bin.binData?.longitude ?? ""),
                    logs: JSON.stringify([
                      `Bin ${bin.id} was last collected ${bin.lastCollected}`,
                      `Inspection done at ${bin.location}`,
                    ]),
                  },
                })
              }
            >
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
              <Text style={styles.info}>Area: {bin.location}</Text>
            </TouchableOpacity>
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
