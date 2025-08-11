import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  const handleViewDetails = (binId: string) => {
    router.push({
      pathname: "/home/bin-details",
      params: { binId },
    });
  };

  // const handleOpenStreetView = async (latitude: number, longitude: number) => {
  //   const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;
  //   const supported = await Linking.canOpenURL(url);
  //   if (supported) {
  //     await Linking.openURL(url);
  //   } else {
  //     alert("Cannot open Google Maps. Please check your device settings.");
  //   }
  // };
  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  const filteredBins = bins.filter((bin) => {
    const matchesSearch =
      bin.name.toLowerCase().includes(search.toLowerCase()) ||
      bin.location.toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (filter === "<50") matchesFilter = bin.percentage < 50;
    else if (filter === "50-75") matchesFilter = bin.percentage >= 50 && bin.percentage <= 75;
    else if (filter === ">75") matchesFilter = bin.percentage > 75;

    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search bins or locations..."
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.filterContainer}>
        {["all", "<50", "50-75", ">75"].map((range) => (
          <TouchableOpacity
            key={range}
            style={[styles.filterButton, filter === range && styles.filterButtonActive]}
            onPress={() => setFilter(range)}
          >
            <Text style={styles.filterText}>{range}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map */}
      <MapView style={StyleSheet.absoluteFillObject} initialRegion={region}>
        {filteredBins.map((bin) => (
          <Marker key={bin.id} coordinate={{ latitude: bin.latitude, longitude: bin.longitude }}>
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.title}>{bin.name}</Text>

                <View style={styles.fillRow}>
                  <Text>Fill Level: {bin.percentage}%</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      bin.percentage > 75 ? styles.critical : bin.percentage >= 50 ? styles.warning : styles.normal,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {bin.percentage > 75 ? "CRITICAL" : bin.percentage >= 50 ? "WARNING" : "NORMAL"}
                    </Text>
                  </View>
                </View>

                <ProgressBar
                  progress={bin.percentage / 100}
                  style={styles.progressBar}
                  color={bin.percentage > 75 ? "red" : bin.percentage >= 50 ? "orange" : "green"}
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
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 140,
    marginBottom: 10,
    zIndex: 2,
  },
  infoGroup: {
    marginVertical: 8,
    gap: 4,
  },

  filterButton: {
    backgroundColor: "#ddd",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  filterButtonActive: {
    backgroundColor: "green",
  },
  filterText: {
    color: "white",
    fontWeight: "600",
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

  searchBar: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    zIndex: 2,
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  pickerContainer: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 12,
    zIndex: 2,
    elevation: 3,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  callout: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 8,
    width: 220,
  },
  label: {
    fontWeight: "600",
    marginTop: 4,
  },
  value: {
    fontWeight: "400",
    color: "#333",
  },
  percentage: {
    fontWeight: "bold",
    color: "#2e7d32",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 6,
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
  mapButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  mapButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
