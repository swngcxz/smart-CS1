import { useTheme } from "@/hooks/useTheme";
import { useNavigation } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return Alert.alert("Please fill in all fields.");
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert("Passwords do not match.");
    }

    // TODO: Add API call here
    Alert.alert("Password changed successfully.");
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: isDarkMode ? "#000" : "#fff" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 24, color: isDarkMode ? "#fff" : "#000" }}>
        Change Password
      </Text>

      <TextInput
        placeholder="Current Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={oldPassword}
        onChangeText={setOldPassword}
        style={{
          borderBottomWidth: 1,
          borderColor: "#ccc",
          marginBottom: 20,
          color: isDarkMode ? "#fff" : "#000",
        }}
      />

      <TextInput
        placeholder="New Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        style={{
          borderBottomWidth: 1,
          borderColor: "#ccc",
          marginBottom: 20,
          color: isDarkMode ? "#fff" : "#000",
        }}
      />

      <TextInput
        placeholder="Confirm New Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={{
          borderBottomWidth: 1,
          borderColor: "#ccc",
          marginBottom: 40,
          color: isDarkMode ? "#fff" : "#000",
        }}
      />

      <TouchableOpacity
        style={{
          backgroundColor: "#2e7d32",
          paddingVertical: 14,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={handleChangePassword}
      >
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Update Password</Text>
      </TouchableOpacity>
    </View>
  );
}
