
import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ProgressBar } from "react-native-paper";
import BackButton from "@/components/BackButton";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRealTimeData } from "../../hooks/useRealTimeData";

export default function LocationBinsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { binLocations, wasteBins, loading, error } = useRealTimeData();

  // Get bins based on location
  const getBinsForLocation = () => {
    if (id === "central-plaza") {
      // Central Plaza: 1 real-time bin + 3 static bins
      const realTimeBins = wasteBins.filter((bin) => 
        bin.location && bin.location.toLowerCase().includes("central")
      );
      
      const staticBins = [
        {
          id: "central-static-1",
          name: "Central Plaza Bin 2",
          level: 45,
          status: "normal" as const,
          lastCollection: "2 hours ago",
          route: "Route A - Central",
          gps_valid: false,
          satellites: 0,
          weight_kg: 2.1,
          distance_cm: 45,
          position: [14.5995, 120.9842] as [number, number],
          capacity: "100",
          location: "Central Plaza"
        },
        {
          id: "central-static-2", 
          name: "Central Plaza Bin 3",
          level: 78,
          status: "warning" as const,
          lastCollection: "1 hour ago",
          route: "Route A - Central",
          gps_valid: false,
          satellites: 0,
          weight_kg: 3.8,
          distance_cm: 22,
          position: [14.5996, 120.9843] as [number, number],
          capacity: "100",
          location: "Central Plaza"
        },
        {
          id: "central-static-3",
          name: "Central Plaza Bin 4", 
          level: 32,
          status: "normal" as const,
          lastCollection: "3 hours ago",
          route: "Route A - Central",
          gps_valid: false,
          satellites: 0,
          weight_kg: 1.2,
          distance_cm: 68,
          position: [14.5997, 120.9844] as [number, number],
          capacity: "100",
          location: "Central Plaza"
        }
      ];

      // Convert real-time bins to the expected format
      const realTimeFormatted = realTimeBins.map((bin, index) => ({
        id: bin.id,
        name: `Central Plaza Bin ${index + 1} (Real-time)`,
        level: bin.level,
        status: bin.status,
        lastCollection: bin.lastCollected,
        route: "Route A - Central",
        gps_valid: bin.binData?.gps_valid || false,
        satellites: bin.binData?.satellites || 0,
        weight_kg: bin.binData?.weight_kg || 0,
        distance_cm: bin.binData?.distance_cm || 0,
        position: bin.binData ? [bin.binData.latitude, bin.binData.longitude] as [number, number] : [14.5995, 120.9842] as [number, number],
        capacity: bin.capacity || "100",
        location: bin.location || "Central Plaza"
      }));

      return [...realTimeFormatted, ...staticBins];
    } else {
      // Other locations: use existing logic
      return (binLocations || []).filter(
        (b) =>
          b.route &&
          b.route.toLowerCase().replace(/ /g, "-") === id
      );
    }
  };

  const bins = getBinsForLocation();

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
                    binName: bin.name,
                    binLevel: String(bin.level),
                    binStatus: bin.status,
                    binRoute: bin.route,
                    location: bin.route,
                    area: bin.route,
                    capacity: "100", // Default capacity
                    lastCollected: bin.lastCollection,
                    level: String(bin.level),
                    latitude: String(bin.position[0]),
                    longitude: String(bin.position[1]),
                    logs: JSON.stringify([
                      `Bin ${bin.name} was last collected ${bin.lastCollection}`,
                      `Inspection done at ${bin.route}`,
                    ]),
                  },
                })
              }
            >
              {/* Title row with badge */}
              <View style={styles.topRow}>
                <View style={styles.binTitleContainer}>
                  <Text style={styles.cardTitle}>{bin.name}</Text>
                  {bin.name.includes("Real-time") && (
                    <View style={styles.realTimeBadge}>
                      <Text style={styles.realTimeText}>LIVE</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.badgeText}>{statusLabel}</Text>
                </View>
              </View>

              {/* Progress */}
              <Text style={styles.percentText}>{bin.level}%</Text>
              <ProgressBar progress={bin.level / 100} color={statusColor} style={styles.progress} />

              {/* Details */}
              <View style={styles.row}>
                <Text style={styles.info}>Capacity: {(bin as any).capacity || '100'} L</Text>
                <Text style={styles.info}>Last Collected: {bin.lastCollection}</Text>
              </View>
              <Text style={styles.info}>Area: {(bin as any).location || bin.route}</Text>
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
  binTitleContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginRight: 8 },
  realTimeBadge: { 
    backgroundColor: "#00ff00", 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4 
  },
  realTimeText: { 
    fontSize: 10, 
    color: "#000", 
    fontWeight: "bold" 
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, color: "#fff", fontWeight: "bold", textTransform: "capitalize" },

  percentText: { fontSize: 16, fontWeight: "600", marginTop: 10, color: "#000" },
  progress: { height: 8, borderRadius: 6, marginVertical: 8 },

  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  info: { fontSize: 13, color: "#444", flex: 1 },
  noBins: { fontSize: 14, color: "#888", textAlign: "center", marginTop: 20 },
});
