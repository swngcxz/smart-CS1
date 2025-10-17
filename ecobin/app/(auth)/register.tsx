import { Poppins_400Regular, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";
import { AntDesign, FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


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
  const [validationError, setValidationError] = useState("");
  const [fullNameError, setFullNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const handleRegister = () => {
    // Clear any previous errors
    setValidationError("");
    setFullNameError(false);
    setEmailError(false);
    setPasswordError(false);
    setConfirmPasswordError(false);

    // Basic validation
    if (!fullName.trim()) {
      setValidationError("Please enter your full name");
      setFullNameError(true);
      return;
    }

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

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters long");
      setPasswordError(true);
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      setPasswordError(true);
      setConfirmPasswordError(true);
      return;
    }

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
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            placeholder="Enter your full name" 
            style={[styles.input, fullNameError && styles.inputError]}
            placeholderTextColor="#999"
            value={fullName} 
            onChangeText={(text) => {
              setFullName(text);
              if (validationError) setValidationError("");
              if (fullNameError) setFullNameError(false);
            }} 
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
          <TextInput 
            placeholder="Enter your email" 
            style={[styles.input, emailError && styles.inputError]}
            placeholderTextColor="#999"
            value={email} 
            onChangeText={(text) => {
              setEmail(text);
              if (validationError) setValidationError("");
              if (emailError) setEmailError(false);
            }} 
            keyboardType="email-address" 
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              placeholder="Enter your password"
              style={[styles.input, styles.passwordInput, passwordError && styles.inputError]}
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (validationError) setValidationError("");
                if (passwordError) setPasswordError(false);
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#999" style={{ marginTop: 5 }} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>Confirm Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              placeholder="Re-enter your password"
              style={[styles.input, styles.passwordInput, confirmPasswordError && styles.inputError]}
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (validationError) setValidationError("");
                if (confirmPasswordError) setConfirmPasswordError(false);
              }}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)} style={styles.eyeIcon}>
              <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={18} color="#999" style={{ marginTop: 5 }} />
            </TouchableOpacity>
          </View>
          
          {/* Error Display under Confirm Password */}
          {validationError && (
            <Text style={styles.errorText}>{validationError}</Text>
          )}
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
  marginBottom: 5,
},
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    fontSize: 13,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    fontFamily: "Poppins_400Regular",
  },
  inputError: {
    borderColor: "#f44336",
    borderWidth: 1,
  },
  passwordInput: {
    paddingRight: 50,
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
    marginTop: 15,
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
  errorContainer: {
    backgroundColor: "#ffebee",
    borderWidth: 1,
    borderColor: "#f44336",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    fontFamily: poppins.regular,
    marginTop: 8,
  },
});
