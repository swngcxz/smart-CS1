
import React from "react";
import BackButton from "@/components/BackButton";
import PickupHistoryModal from "@/components/modals/PickupHistoryModal";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { ProgressBar } from "react-native-paper";
import { useRealTimeData } from "../../hooks/useRealTimeData";

export default function BinDetailScreen() {
  const params = useLocalSearchParams<{ 
    binId: string; 
    binName?: string; 
    binLevel?: string; 
    binStatus?: string; 
    binRoute?: string; 
  }>();
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const { binLocations, loading, error } = useRealTimeData();

  // Find the bin by binId param or use passed parameters
  const bin = (binLocations || []).find((b) => b.id === params.binId);
  
  // Create bin data from params if not found in real-time data
  const binData = bin || {
    id: params.binId,
    name: params.binName || 'Unknown Bin',
    position: [10.2098, 123.758] as [number, number],
    level: parseFloat(params.binLevel || '0'),
    status: (params.binStatus as 'normal' | 'warning' | 'critical') || 'normal',
    route: params.binRoute || 'Unknown Route',
    lastCollection: new Date().toISOString(),
    gps_valid: true,
    satellites: 0
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text>Loading bin data...</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton />
      <Text style={styles.sectionTitle}>{binData.name} Location</Text>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: binData.position[0],
          longitude: binData.position[1],
          latitudeDelta: 0.0008,
          longitudeDelta: 0.0008,
        }}
        mapType="hybrid"
        showsBuildings={true}
        showsCompass={true}
        showsScale={true}
      >
        <Marker coordinate={{ 
          latitude: binData.position[0], 
          longitude: binData.position[1] 
        }}>
          <View style={[styles.marker, { backgroundColor: getStatusColor(binData.level) }]}>
            <Text style={styles.markerText}>{binData.level}%</Text>
          </View>
        </Marker>
      </MapView>

      <View style={styles.detailsHeader}>
        <Text style={styles.title}>Details for {binData.name}</Text>
        <TouchableOpacity onPress={() => setHistoryModalVisible(true)}>
        </TouchableOpacity>
      </View>

      <Text style={styles.text}>Route: {binData.route}</Text>
      <Text style={styles.text}>GPS Status: {binData.gps_valid ? 'Valid' : 'Invalid'} ({binData.satellites} satellites)</Text>
      <Text style={styles.text}>Current Level: {binData.level}%</Text>
      <ProgressBar
        progress={binData.level / 100}
        color={getStatusColor(binData.level)}
        style={{ height: 10, borderRadius: 5, marginBottom: 15 }}
      />
      <Text style={styles.text}>Last Update: {new Date(binData.lastCollection).toLocaleString()}</Text>
      <Text style={[styles.text, styles.status]}>Status: {binData.status.toUpperCase()}</Text>

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
