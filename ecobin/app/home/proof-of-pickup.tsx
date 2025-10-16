import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProofOfPickupScreen() {
  const { binId } = useLocalSearchParams();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);

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
    console.log(`Bin ${binId} marked as picked up with image:`, image);
   
    router.replace("/(tabs)/home"); 
  };

  return (
    <View style={styles.container}>
      <Header />
      <BackButton />

      <Text style={styles.title}>Upload Proof of Pickup</Text>

      <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={styles.plus}>+</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !image && styles.disabled]}
        onPress={handleSubmit}
        disabled={!image}
      >
        <Text style={styles.buttonText}>Submit & Mark as Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  imageBox: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: "#ccc",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },
  plus: { fontSize: 40, color: "#999" },
  image: { width: "100%", height: "100%", borderRadius: 10 },
  button: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: "center",
  },
  buttonText: { color: "#fff", fontSize: 16 },
  disabled: { backgroundColor: "#ccc" },
});
