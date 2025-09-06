import React from "react";
import BackButton from "@/components/BackButton";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ProofOfPickupScreen() {
  const { binId, location } = useLocalSearchParams();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");

  const now = new Date();
  // 📅 Format date like "September 3, 2025"
  const currentDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  // ⏰ Time in HH:MM AM/PM
  const currentTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    console.log(
      `Bin ${binId} at ${location} marked as picked up\nDate: ${currentDate}\nTime: ${currentTime}\nRemarks: ${
        remarks || "None"
      }\nImage: ${image}`
    );
    router.replace("/home/activity-logs");
  };

  return (
    <View style={styles.container}>
      <BackButton />

      <Text style={styles.title}>Proof of Pickup</Text>

      {/* Bin details */}
      <View style={styles.detailsBox}>
        <Text style={styles.detail}><Text style={styles.label}>Bin ID:</Text> {binId ?? "N/A"}</Text>
        <Text style={styles.detail}><Text style={styles.label}>Location:</Text> {location ?? "Unknown"}</Text>
        <Text style={styles.detail}><Text style={styles.label}>Date:</Text> {currentDate}</Text>
        <Text style={styles.detail}><Text style={styles.label}>Time:</Text> {currentTime}</Text>
      </View>

      <Text style={styles.instructions}>
        Upload a clear photo after marking this bin as collected.
      </Text>

      {/* Upload Image */}
      <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={styles.plus}>+</Text>
        )}
      </TouchableOpacity>

      {/* Remarks Textbox */}
      <TextInput
        style={styles.textInput}
        placeholder="Write any messages..."
        placeholderTextColor="#888"
        value={remarks}
        onChangeText={setRemarks}
        multiline
      />

      {/* Submit button */}
      <TouchableOpacity
        style={[styles.button, !image && styles.disabled]}
        onPress={handleSubmit}
        disabled={!image}
      >
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdfdfd",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
    color: "#2e7d32",
  },
  detailsBox: {
    backgroundColor: "#e8f5e9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  detail: { fontSize: 15, marginBottom: 8, color: "#333" },
  label: { fontWeight: "bold", color: "#1b5e20" },
  instructions: {
    fontSize: 14,
    color: "#555",
    marginBottom: 15,
    textAlign: "center",
  },
  imageBox: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: "#aaa",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    alignSelf: "center",
    marginBottom: 20,
    backgroundColor: "#fafafa",
  },
  // ⬆️ made bigger plus sign
  plus: { fontSize: 60, color: "#999" },
  image: { width: "100%", height: "100%", borderRadius: 15},
  textInput: {
    minHeight: 90,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    textAlignVertical: "top",
    marginBottom: 20,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#333",
  },
  button: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  disabled: { backgroundColor: "#bbb" },
});
