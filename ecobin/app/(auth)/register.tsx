import Input from "@/components/fields/Input";
import Label from "@/components/fields/Label";
import { Poppins_400Regular, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import { AntDesign, FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";


const poppins = {
  regular: "Poppins_400Regular",
  bold: "Poppins_700Bold",
} as const;

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const handleRegister = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace("/(auth)/login");
    }, 1500);
  };

  if (!fontsLoaded) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sign Up</Text>
        </View>

        {/* Logo + Brand */}
        <View style={styles.upperContainer}>
          <Image source={require("@/assets/icon/logo-final2.png")} style={styles.logo} />
          {/* Only ECOBIN is bold */}
          <Text style={styles.logoText}>ECOBIN</Text>
          <Text style={styles.description}>Your cleaner choices start here</Text>
        </View>

        {/* Inputs */}
       <View style={styles.InputContainer}>
          <Label style={styles.label}>Full Name</Label>
          <Input placeholder="Enter your full name" value={fullName} onChangeText={setFullName} />

          <Label style={[styles.label, { marginTop: 16 }]}>Email</Label>
          <Input placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" />

          <Label style={[styles.label, { marginTop: 16 }]}>Password</Label>
          <View style={styles.passwordWrapper}>
            <Input
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#999" style={{ marginTop: 5 }} />
            </TouchableOpacity>
          </View>

          <Label style={[styles.label, { marginTop: 16 }]}>Confirm Password</Label>
          <View style={styles.passwordWrapper}>
            <Input
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)} style={styles.eyeIcon}>
              <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={18} color="#999" style={{ marginTop: 5 }} />
            </TouchableOpacity>
          </View>
        </View>


        {/* Register Button */}
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
          <Text style={styles.registerButtonText}>
            {loading ? "Creating Account..." : "Create Account"}
          </Text>
        </TouchableOpacity>

        {/* Social Sign-In */}
        <View style={styles.IconsContainer}>
          <Text style={styles.signWith}>or sign up with</Text>
          <View style={styles.socialContainer}>
            <TouchableOpacity>
              <AntDesign name="google" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome name="facebook" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome5 name="apple" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Already have an account? */}
        <Text style={styles.signInPrompt}>
          Already have an account?{" "}
          <Text style={styles.signInLink} onPress={() => router.push("/(auth)/login")}>
            Login
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  headerTitle: {
    fontSize: 14,
    color: "#333",
    fontFamily: poppins.regular,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 26,
    color: "#2e7d32",
    letterSpacing: 2,
    fontFamily: poppins.bold,
  },
  label: {
  fontSize: 13,
  fontFamily: poppins.regular,
  color: "#333",
},
  upperContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    fontFamily: poppins.regular,
  },
  InputContainer: {
    width: "100%",
    marginTop: 20,
    gap: 5,
  },
  passwordWrapper: {
    width: "100%",
    position: "relative",
    justifyContent: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
    top: "12%",
  },
  registerButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 25,
    marginBottom: 20,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: poppins.regular,
  },
  IconsContainer: {
    marginTop: 10,
  },
  signWith: {
    textAlign: "center",
    color: "#555",
    fontSize: 13,
    fontFamily: poppins.regular,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
    marginBottom: 10,
  },
  signInPrompt: {
    fontSize: 12,
    color: "#444",
    textAlign: "center",
    marginTop: 20,
    fontFamily: poppins.regular,
  },
  signInLink: {
    fontSize: 13,
    color: "#2e7d32",
    fontFamily: poppins.regular, 
    textDecorationLine: "underline", 
  },
});
