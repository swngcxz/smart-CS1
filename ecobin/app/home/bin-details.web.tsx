import React from "react";
import BackButton from "@/components/BackButton";
import PickupHistoryModal from "@/components/modals/PickupHistoryModal";
import PickupWorkflowModal from "@/components/PickupWorkflowModal";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { ProgressBar } from "react-native-paper";
import { useRealTimeData } from "../../hooks/useRealTimeData";

// Web fallback components
const MapView = ({ children, style, region, ...props }: any) => (
  <View style={[style, { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }]}>
    <Text style={{ textAlign: 'center', padding: 20, color: '#6b7280', fontSize: 16 }}>
      🗺️ Map not available on web platform
    </Text>
    <Text style={{ textAlign: 'center', padding: 10, color: '#9ca3af', fontSize: 14 }}>
      Please use the mobile app for full map functionality
    </Text>
    {children}
  </View>
);

const Marker = ({ children, coordinate, title, description }: any) => (
  <View style={{ position: 'absolute', left: coordinate.longitude * 100, top: coordinate.latitude * 100 }}>
    {children}
  </View>
);

const PROVIDER_GOOGLE = 'google';

export default function BinDetailScreen() {
  const params = useLocalSearchParams<{ 
    binId: string; 
    binName?: string; 
    binLevel?: string; 
    binStatus?: string; 
    binRoute?: string; 
  }>();
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const { binLocations, loading, error, getSafeCoordinates, getTimeSinceLastGPS } = useRealTimeData();

  // SIMPLIFIED: Focus only on bin1
  const bin = (binLocations || []).find((b) => b && b.id === 'bin1');
  
  // Create safe bin data with defaults
  const safeBinData = {
    id: bin?.id || params.binId || 'bin1',
    name: bin?.name || params.binName || 'Central Plaza Bin 1',
    position: bin?.position || [10.2098, 123.758] as [number, number],
    level: typeof bin?.level === 'number' && !isNaN(bin.level) ? bin.level : parseFloat(params.binLevel || '0'),
    status: bin?.status || (params.binStatus as 'normal' | 'warning' | 'critical') || 'normal',
    route: bin?.route || params.binRoute || 'Central Plaza Route',
    lastCollection: bin?.lastCollection || new Date().toISOString(),
    gps_valid: Boolean(bin?.gps_valid),
    satellites: typeof bin?.satellites === 'number' ? bin.satellites : 0
  };

  const getStatusColor = (val: number) => {
    const safeVal = typeof val === 'number' && !isNaN(val) ? val : 0;
    if (safeVal >= 90) return "#f44336"; // red
    if (safeVal >= 60) return "#ff9800"; // orange
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
      <Text style={styles.sectionTitle}>{safeBinData.name} Location (Web)</Text>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: safeBinData.position[0],
          longitude: safeBinData.position[1],
          latitudeDelta: 0.0008,
          longitudeDelta: 0.0008,
        }}
        mapType="hybrid"
        showsBuildings={true}
        showsCompass={true}
        showsScale={true}
      >
        <Marker coordinate={{ 
          latitude: safeBinData.position[0], 
          longitude: safeBinData.position[1] 
        }}>
          <View style={[styles.marker, { backgroundColor: getStatusColor(safeBinData.level) }]}>
            <Text style={styles.markerText}>{safeBinData.level}%</Text>
          </View>
        </Marker>
      </MapView>

      <View style={styles.detailsHeader}>
        <Text style={styles.title}>Details for {safeBinData.name}</Text>
        <TouchableOpacity onPress={() => setHistoryModalVisible(true)}>
        </TouchableOpacity>
      </View>

      <Text style={styles.text}>Route: {safeBinData.route}</Text>
      <Text style={styles.text}>GPS Status: {safeBinData.gps_valid ? 'Valid' : 'Invalid'} ({safeBinData.satellites} satellites)</Text>
      <Text style={styles.text}>Current Level: {safeBinData.level}%</Text>
      <ProgressBar
        progress={safeBinData.level / 100}
        color={getStatusColor(safeBinData.level)}
        style={{ height: 10, borderRadius: 5, marginBottom: 15 }}
      />
      <Text style={styles.text}>Last Update: {new Date(safeBinData.lastCollection).toLocaleString()}</Text>
      <Text style={[styles.text, styles.status]}>Status: {safeBinData.status.toUpperCase()}</Text>

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
            backgroundColor: safeBinData.level < 80 ? "#ccc" : "#2e7d32",
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
          },
        ]}
        disabled={safeBinData.level < 80}
        onPress={() => setPickupModalVisible(true)}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Pick Up</Text>
      </TouchableOpacity>

      <PickupHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        binId={safeBinData.id}
        logs={[]}
      />

      <PickupWorkflowModal
        visible={pickupModalVisible}
        onClose={() => setPickupModalVisible(false)}
        binData={safeBinData}
        onPickupComplete={() => {
          setPickupModalVisible(false);
          alert("Pickup completed successfully!");
        }}
        onAcknowledge={() => {
          setPickupModalVisible(false);
          alert("Pickup acknowledged and added to pending tasks.");
        }}
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
