import BackButton from "@/components/BackButton";
import PickupHistoryModal from "@/components/modals/PickupHistoryModal";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { ProgressBar } from "react-native-paper";

export default function BinDetailScreen() {
  const params = useLocalSearchParams<{
    binId: string;
    location: string;
    area: string;
    capacity: string;
    lastCollected: string;
    level: string;
    latitude: string;
    longitude: string;
    logs: string;
  }>();

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const parsedLogs: string[] = params.logs ? JSON.parse(params.logs) : [];

  const bin = {
    id: params.binId,
    name: params.location,
    location: params.area,
    capacity: params.capacity,
    latitude: parseFloat(params.latitude),
    longitude: parseFloat(params.longitude),
    level: parseInt(params.level),
    lastEmptied: params.lastCollected,
    status: "Operational",
  };

  const getStatusColor = (val: number) => {
    if (val >= 90) return "#f44336"; // red
    if (val >= 60) return "#ff9800"; // orange
    return "#4caf50"; // green
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...uris]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton />
      <Text style={styles.sectionTitle}>Bin {bin.id} Location </Text>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: bin.latitude,
          longitude: bin.longitude,
          latitudeDelta: 0.0008, // 👈 closer zoom
          longitudeDelta: 0.0008,
        }}
        mapType="satellite" // 👈 Satellite view
        showsBuildings={true} // 👈 Show 3D buildings
        showsCompass={false} // Hide compass
        showsScale={false} // Hide scale bar
      >
        <Marker coordinate={{ latitude: bin.latitude, longitude: bin.longitude }}>
          <View style={[styles.marker, { backgroundColor: getStatusColor(bin.level) }]}>
            <Text style={styles.markerText}>{bin.level}%</Text>
          </View>
        </Marker>
      </MapView>

      <View style={styles.detailsHeader}>
        <Text style={styles.title}>Details for {bin.id}</Text>
        <TouchableOpacity onPress={() => setHistoryModalVisible(true)}>
        </TouchableOpacity>
      </View>

      <Text style={styles.text}>Area: {bin.location}</Text>
      <Text style={styles.text}>Capacity: {bin.capacity} L</Text>
      <Text style={styles.text}>Current Level: {bin.level}%</Text>
      <ProgressBar
        progress={bin.level / 100}
        color={getStatusColor(bin.level)}
        style={{ height: 10, borderRadius: 5, marginBottom: 15 }}
      />
      <Text style={styles.text}>Last Collected: {bin.lastEmptied}</Text>
      <Text style={[styles.text, styles.status]}>Status: {bin.status}</Text>

      <Text style={styles.sectionTitle}>Proof of Pickup</Text>
      <View style={styles.imageContainer}>
        {images.slice(0, 3).map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.imagePreview} />
        ))}
        <TouchableOpacity style={styles.addButton} onPress={pickImage}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          {
            backgroundColor: bin.level < 80 ? "#ccc" : "#2e7d32",
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
          },
        ]}
        disabled={bin.level < 80}
        onPress={() => alert("Marked as Picked Up!")}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Pick Up</Text>
      </TouchableOpacity>

      <PickupHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        binId={bin.id}
        logs={parsedLogs}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 50, backgroundColor: "#fff", paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 15, color: "#2e7d32" },
  sectionTitle: { marginTop: 5, fontSize: 18, fontWeight: "500", color: "#000", marginBottom: 10 },
  text: { fontSize: 16, marginBottom: 10, color: "#444" },
  status: { fontWeight: "bold", color: "#2e7d32" },
  map: { width: "100%", height: 300, borderRadius: 10, marginBottom: 20 },

  // Marker with percentage
  marker: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  markerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  imageContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  imagePreview: { width: 100, height: 100, borderRadius: 10, marginRight: 10, marginBottom: 10 },
  addButton: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#aaa",
  },
  addButtonText: { fontSize: 32, color: "#444" },
  detailsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  smallHistoryText: { fontSize: 14, color: "gray", fontWeight: "500" },
});
