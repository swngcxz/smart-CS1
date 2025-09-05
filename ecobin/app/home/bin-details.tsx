
import BackButton from "@/components/BackButton";
import PickupHistoryModal from "@/components/modals/PickupHistoryModal";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { ProgressBar } from "react-native-paper";
import { useRealTimeData } from "../../hooks/useRealTimeData";


export default function BinDetailScreen() {
  const params = useLocalSearchParams<{ binId: string }>();
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const { wasteBins, loading, error } = useRealTimeData();

  // Find the bin by binId param
  const bin = wasteBins.find((b) => b.id === params.binId);

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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text>Loading bin data...</Text>
      </View>
    );
  }
  if (!bin) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <BackButton />
        <Text>No data found for this bin.</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton />
      <Text style={styles.sectionTitle}>Bin {bin.id} Location </Text>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: bin.binData?.latitude || 0,
          longitude: bin.binData?.longitude || 0,
          latitudeDelta: 0.0008,
          longitudeDelta: 0.0008,
        }}
        mapType="satellite"
        showsBuildings={true}
        showsCompass={false}
        showsScale={false}
      >
        <Marker coordinate={{ latitude: bin.binData?.latitude || 0, longitude: bin.binData?.longitude || 0 }}>
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
      <Text style={styles.text}>Last Collected: {bin.lastCollected}</Text>
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
        logs={[]}
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
