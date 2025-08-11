import BackButton from "@/components/BackButton";
import PickupHistoryModal from "@/components/modals/PickupHistoryModal";
import { RootStackParamList } from "@/types/navigation";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { ProgressBar } from "react-native-paper";
type BinDetailRouteProp = RouteProp<RootStackParamList, "BinDetailScreen">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BinDetailScreen() {
  const route = useRoute<BinDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { binId, logs } = route.params as { binId: string; logs: string };
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const parsedLogs: string[] = JSON.parse(logs);
  const relatedLogs = parsedLogs.filter((log) => log.includes(binId));

  const [images, setImages] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const bin = {
    id: binId,
    name: binId,
    location: "Main Entrance",
    latitude: 10.2103,
    longitude: 123.758,
    level: 85,
    lastEmptied: "Today 9:42 AM",
    status: "Operational",
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
      <Text style={styles.sectionTitle}>Bin Location on Map</Text>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: bin.latitude,
          longitude: bin.longitude,
          latitudeDelta: 0.0015,
          longitudeDelta: 0.0015,
        }}
      >
        <Marker
          coordinate={{ latitude: bin.latitude, longitude: bin.longitude }}
          title={bin.name}
          description={bin.location}
        />
      </MapView>

      <View style={styles.detailsHeader}>
        <Text style={styles.title}>Details for {bin.id}</Text>
        <TouchableOpacity onPress={() => setHistoryModalVisible(true)}>
          <Text style={styles.smallHistoryText}>History</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.text}>Location: {bin.location}</Text>
      <Text style={styles.text}>Current Level: {bin.level}%</Text>
      <ProgressBar
        progress={bin.level / 100}
        color={bin.level >= 80 ? "red" : bin.level >= 50 ? "orange" : "green"}
        style={{ height: 10, borderRadius: 5, marginBottom: 15 }}
      />
      <Text style={styles.text}>Last Emptied: {bin.lastEmptied}</Text>
      <Text style={[styles.text, styles.status]}>Status: {bin.status}</Text>

      <Text style={styles.sectionTitle}>Proof of Pickup (Optional)</Text>
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
        binId={binId}
        logs={parsedLogs}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 50, backgroundColor: "#fff", paddingHorizontal: 20 },
  header: { marginTop: 44, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 15, color: "#2e7d32" },
  sectionTitle: { marginTop: 5, fontSize: 18, fontWeight: "500", color: "#000", marginBottom: 10 },
  text: { fontSize: 16, marginBottom: 10, color: "#444" },
  status: { fontWeight: "bold", color: "#2e7d32" },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  imagePreview: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
  },
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
  addButtonText: {
    fontSize: 32,
    color: "#444",
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  smallHistoryText: {
    fontSize: 14,
    color: "gray",
    fontWeight: "500",
  },
});
