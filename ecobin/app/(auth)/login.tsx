// app/(auth)/login.tsx
import { AntDesign, FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

import {
  KeyboardAvoidingView,
  Platform,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";

import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";

import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

const poppins = {
  light: "Poppins_300Light",
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
} as const;

export default function LoginScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { login, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const showErrorModalWithMessage = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const hideErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
    clearError();
  };

  const handleLogin = async () => {
    // Clear any previous errors
    clearError();

    // Basic validation
    if (!email.trim()) {
      showErrorModalWithMessage("Please enter your email address");
      return;
    }

    if (!password.trim()) {
      showErrorModalWithMessage("Please enter your password");
      return;
    }

    if (!email.includes("@")) {
      showErrorModalWithMessage("Please enter a valid email address");
      return;
    }

    // Attempt login
    const result = await login({ email: email.trim(), password });
    
    if (!result.success) {
      // Show specific error message based on the error type
      let displayMessage = result.message;
      
      if (result.message.includes("Invalid credentials") || 
          result.message.includes("Invalid email or password")) {
        displayMessage = "Username and password is incorrect. Please try again.";
      } else if (result.message.includes("Too many login attempts")) {
        displayMessage = "Too many failed attempts. Please try again later.";
      } else if (result.message.includes("Please verify your email")) {
        displayMessage = "Please verify your email before logging in.";
      }
      
      showErrorModalWithMessage(displayMessage);
    }
    // If successful, the hook will handle navigation automatically
  };

  if (!fontsLoaded) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/landing")}>
            <Ionicons name="arrow-back" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Branding */}
        <View style={styles.upperContainer}>
          <RNImage source={require("@/assets/icon/logo-final2.png")} style={styles.logo} />
          <Text style={styles.logoText}>ECOBIN</Text>
          <Text style={styles.description}>Your cleaner choices start here</Text>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Inputs */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Enter your email"
            style={styles.input}
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#aaa"
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => router.push("/forgot-password")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>{loading ? "Signing In..." : "Sign In"}</Text>
        </TouchableOpacity>

        {/* Social Login */}
        <View style={styles.IconsContainer}>
          <Text style={styles.signWith}>or sign in with</Text>
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

        {/* Register Redirect */}
        <Text style={styles.signInPrompt}>
          Don't have an account?{" "}
          <Text style={styles.signInLink} onPress={() => router.push("/register")}>
            Register
          </Text>
        </Text>
      </ScrollView>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={hideErrorModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Login Failed</Text>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="alert-circle" size={48} color="#f44336" />
              </View>
              <Text style={styles.modalMessage}>{errorMessage}</Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={hideErrorModal}
              >
                <Text style={styles.modalButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create<{
  scrollContainer: ViewStyle;
  header: ViewStyle;
  logo: ImageStyle;
  logoText: TextStyle;
  upperContainer: ViewStyle;
  description: TextStyle;
  inputContainer: ViewStyle;
  label: TextStyle;
  input: TextStyle;
  passwordWrapper: ViewStyle;
  passwordInput: TextStyle;
  eyeIcon: ViewStyle;
  forgotPasswordContainer: ViewStyle;
  forgotPasswordText: TextStyle;
  loginButton: ViewStyle;
  loginButtonText: TextStyle;
  disabledButton: ViewStyle;
  IconsContainer: ViewStyle;
  signWith: TextStyle;
  socialContainer: ViewStyle;
  signInPrompt: TextStyle;
  signInLink: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  modalOverlay: ViewStyle;
  modalContainer: ViewStyle;
  modalHeader: ViewStyle;
  modalTitle: TextStyle;
  modalBody: ViewStyle;
  errorIconContainer: ViewStyle;
  modalMessage: TextStyle;
  modalFooter: ViewStyle;
  modalButton: ViewStyle;
  modalButtonText: TextStyle;
}>({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#fff",
  },
  header: {
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
    resizeMode: "contain",
  },

  logoText: {
    fontSize: 26,
    fontFamily: poppins.bold, 
    color: "#2e7d32",
    letterSpacing: 2,
  },

  upperContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  description: {
    fontSize: 12,
    fontFamily: poppins.regular,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontFamily: poppins.regular,
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 8,
    fontSize: 13,
    color: "#000",
    fontFamily: poppins.regular, 
  },

  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 40,
    fontSize: 13,
    fontFamily: poppins.regular,
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
    top: 12,
  },
  forgotPasswordContainer: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  forgotPasswordText: {
    fontSize: 13,
    fontFamily: poppins.regular,
    color: "#2e7d32",
  },
  loginButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 0,
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: poppins.regular,
  },
  disabledButton: {
    backgroundColor: "#2e7d32",
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
  errorContainer: {
    backgroundColor: "#ffebee",
    borderColor: "#f44336",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 13,
    fontFamily: poppins.regular,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: poppins.semibold,
    color: "#333",
    textAlign: "center",
  },
  modalBody: {
    padding: 20,
    alignItems: "center",
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: poppins.regular,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 10,
  },
  modalButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: poppins.medium,
  },
});
