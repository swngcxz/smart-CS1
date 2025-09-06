import React from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useAccount } from "@/hooks/useAccount";
import axiosInstance from "@/utils/axiosInstance";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function EditProfileScreen() {
  const router = useRouter();

  const { account, loading: accountLoading, error: accountError } = useAccount();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (account) {
      setName(account.fullName || "");
      setEmail(account.email || "");
      setAddress(account.address || "");
      setPhone(account.phone || "");
    }
  }, [account]);

  const handleSave = async () => {
    try {
      // PATCH user info (assumes /auth/me supports PATCH)
      await axiosInstance.patch('/auth/me', {
        fullName: name,
        email,
        address,
        phone,
      });
      Alert.alert("Success", "Profile updated successfully.");
      router.replace("/(tabs)/settings");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || 'Failed to update profile');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/settings")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit Profile</Text>
      </View>

      {/* Profile Picture */}
      <View style={styles.profileWrapper}>
        <Image
          source={profileImage ? { uri: profileImage } : require("@/assets/images/profile-placeholder.jpg")}
          style={styles.profileImage}
        />
        <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
          <Ionicons name="camera" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          editable={false} // Email is not editable for now
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Enter your address" />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const PROFILE_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingTop: 60,
  },
  headerContainer: {
    position: "relative",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 13,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  profileWrapper: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileImage: {
    width: PROFILE_SIZE,
    height: PROFILE_SIZE,
    borderRadius: PROFILE_SIZE / 2,
    borderWidth: 2,
    borderColor: "#2e7d32",
    backgroundColor: "#ccc",
  },
  editIcon: {
    position: "absolute",
    right: PROFILE_SIZE / 4 - 10,
    bottom: 0,
    backgroundColor: "#2e7d32",
    borderRadius: 16,
    padding: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  form: {
    paddingHorizontal: 30,
    alignItems: "center",
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
