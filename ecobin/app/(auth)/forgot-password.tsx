import Input from "@/components/fields/Input";
import Label from "@/components/fields/Label";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@react-navigation/elements";
import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    console.log("Password reset link sent to:", email);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 30,
          backgroundColor: "#fff",
        }}
      >
        {/* Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Title & Description */}
        <View style={styles.upperContainer}>
          <Text style={styles.logo}>Forgot Password</Text>
          <Text style={styles.description}>
            Enter your email and we'll send you {"\n"} instructions to reset your password.
          </Text>
        </View>

        {/* Input */}
        <View style={styles.InputContainer}>
          <Label>Email</Label>
          <Input placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        </View>

        {/* Submit Button */}
        <Button color="#2e7d32" variant="filled" style={{ paddingVertical: 15, marginTop: 20 }} onPress={handleSubmit}>
          Send Reset Link
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontSize: 25,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0,
    color: "#000",
  },
  upperContainer: {
    width: "100%",
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  description: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    alignSelf: "center",
    marginTop: 10,
    color: "#666",
  },
  InputContainer: {
    width: "100%",
    marginTop: 5,
    gap: 5,
  },
});
