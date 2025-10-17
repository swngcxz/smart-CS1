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
  const [validationError, setValidationError] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);


  const handleLogin = async () => {
    // Clear any previous errors
    clearError();
    setValidationError("");
    setEmailError(false);
    setPasswordError(false);

    // Basic validation
    if (!email.trim()) {
      setValidationError("Please enter your email address");
      setEmailError(true);
      return;
    }

    if (!email.includes("@")) {
      setValidationError("Please enter a valid email address");
      setEmailError(true);
      return;
    }

    if (!password.trim()) {
      setValidationError("Please enter your password");
      setPasswordError(true);
      return;
    }

    // Attempt login
    const result = await login({ email: email.trim(), password });
    
    // If login fails, highlight both fields
    if (!result.success) {
      setEmailError(true);
      setPasswordError(true);
    }
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

        {/* Inputs */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Enter your email"
            style={[styles.input, emailError && styles.inputError]}
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (validationError) setValidationError("");
              if (emailError) setEmailError(false);
            }}
            keyboardType="email-address"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#aaa"
              style={[styles.input, styles.passwordInput, passwordError && styles.inputError]}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (validationError) setValidationError("");
                if (passwordError) setPasswordError(false);
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.forgotPasswordContainer}>
            {(validationError || error) && (
              <Text style={styles.errorText}>{validationError || error}</Text>
            )}
          <TouchableOpacity
              style={styles.forgotPasswordLink}
            onPress={() => router.push("/forgot-password")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          </View>
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
  inputError: TextStyle;
  passwordWrapper: ViewStyle;
  passwordInput: TextStyle;
  eyeIcon: ViewStyle;
  errorText: TextStyle;
  forgotPasswordContainer: ViewStyle;
  forgotPasswordLink: ViewStyle;
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
  inputError: {
    borderColor: "#f44336",
    borderWidth: 1,
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
  errorText: {
    fontSize: 12,
    fontFamily: poppins.regular,
    color: "#f44336",
    marginBottom: 8,
  },
  forgotPasswordContainer: {
    position: "relative",
    marginTop: 8,
    minHeight: 18,
  },
  forgotPasswordLink: {
    position: "absolute",
    right: 0,
    top: 0,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontFamily: poppins.regular,
    color: "#2e7d32",
    textDecorationLine: "underline",
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
  },
});
