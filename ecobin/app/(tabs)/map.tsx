import React from "react";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import MapView, { Callout, Marker } from "react-native-maps";
import { ProgressBar } from "react-native-paper";

type Bin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  percentage: number;
  location: string;
  lastCollectedBy: string;
  lastCollectedDate: string;
};

const bins: Bin[] = [
  {
    id: "1",
    name: "Bin A",
    latitude: 10.2098,
    longitude: 123.758,
    percentage: 75,
    location: "Near Gate A",
    lastCollectedBy: "Janitor John",
    lastCollectedDate: "2025-08-06",
  },
  {
    id: "2",
    name: "Bin B",
    latitude: 10.2102,
    longitude: 123.759,
    percentage: 40,
    location: "Beside Cafeteria",
    lastCollectedBy: "Janitor Anna",
    lastCollectedDate: "2025-08-04",
  },
  {
    id: "3",
    name: "Bin C",
    latitude: 10.2085,
    longitude: 123.757,
    percentage: 90,
    location: "Main Lobby",
    lastCollectedBy: "Janitor Mike",
    lastCollectedDate: "2025-08-07",
  },
];

export default function MapScreen() {
  const [region] = useState({
    latitude: 10.2098,
    longitude: 123.758,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const router = useRouter();

  const handleViewDetails = (binId: string) => {
    router.push({
      pathname: "/home/bin-details",
      params: { binId },
    });
  };

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  const getMarkerColor = (percentage: number) => {
    if (percentage > 75) return "red";
    if (percentage >= 50) return "orange";
    return "green";
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        mapType="satellite"
      >
        {bins.map((bin) => (
          <Marker
            key={bin.id}
            coordinate={{ latitude: bin.latitude, longitude: bin.longitude }}
          >
            <View
              style={[
                styles.markerContainer,
                { backgroundColor: getMarkerColor(bin.percentage) },
              ]}
            >
              <Text style={styles.markerText}>{bin.percentage}%</Text>
            </View>

            <Callout>
              <View style={styles.callout}>
                <Text style={styles.title}>{bin.name}</Text>

                <View style={styles.fillRow}>
                  <Text>Fill Level: {bin.percentage}%</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      bin.percentage > 75
                        ? styles.critical
                        : bin.percentage >= 50
                        ? styles.warning
                        : styles.normal,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {bin.percentage > 75
                        ? "CRITICAL"
                        : bin.percentage >= 50
                        ? "WARNING"
                        : "NORMAL"}
                    </Text>
                  </View>
                </View>

                <ProgressBar
                  progress={bin.percentage / 100}
                  style={styles.progressBar}
                  color={
                    bin.percentage > 75
                      ? "red"
                      : bin.percentage >= 50
                      ? "orange"
                      : "green"
                  }
                />
                <View style={styles.infoGroup}>
                  <Text>Location: {bin.location}</Text>
                  <Text>Last Collected By: {bin.lastCollectedBy}</Text>
                  <Text>Last Collected Date: {formatDate(bin.lastCollectedDate)}</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  markerContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },
  infoGroup: {
    marginVertical: 8,
    gap: 4,
  },
  fillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  critical: {
    backgroundColor: "red",
  },
  warning: {
    backgroundColor: "orange",
  },
  normal: {
    backgroundColor: "green",
  },
  callout: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 8,
    width: 220,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 8,
  },
});
