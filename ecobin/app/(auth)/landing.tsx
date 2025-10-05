import { router } from "expo-router";
import React from "react";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, Platform, Pressable, SafeAreaView, Text, View, useWindowDimensions, KeyboardAvoidingView, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ✅ Load Poppins here
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from "@expo-google-fonts/poppins";

// Import components and hooks
import Input from "@/components/fields/Input";
import Label from "@/components/fields/Label";
import { useAuth } from "@/hooks/useAuth";

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { height, width } = useWindowDimensions();

  // Registration state
  const [showRegister, setShowRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Auth hook
  const { signup, loading, error } = useAuth();

  // Load fonts (required so Poppins actually applies on this screen)
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Simple breakpoints
  const sm = width < 600;
  const md = width >= 600 && width < 1024;
  const lg = width >= 1024;

  // Helpers to clamp values
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  // Font sizes scale
  const titleSize = clamp(width * 0.075, 22, lg ? 40 : 34);
  const taglineSize = clamp(width * 0.04, 12, lg ? 20 : 18);
  const buttonTextSize = clamp(width * 0.04, 14, lg ? 20 : 18);
  const brandSize = clamp(width * 0.065, 20, lg ? 36 : 32);
  const locationSize = clamp(width * 0.03, 10, lg ? 16 : 14);

  // Slightly smaller
  const sizeFactor = 0.85;

  const containerPaddingH = lg ? width * 0.04 : width * 0.05;
  const logoSide = clamp(width * 0.6, sm ? 160 : 220, lg ? 420 : 360);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) return;
    if (password !== confirmPassword) return;
    const res = await signup(fullName, email, password);
    if (res && res.id) {
      router.replace("/(auth)/login");
    }
  };

  // Don't render until fonts are loaded
  if (!fontsLoaded) return null;

  // If showing registration form
  if (showRegister) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#fff" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowRegister(false)}>
              <Ionicons name="arrow-back" size={20} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign Up</Text>
          </View>

          {/* Logo + Brand */}
          <View style={styles.upperContainer}>
            <Image source={require("@/assets/icon/logo-final2.png")} style={styles.logo} />
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
          {error ? (
            <Text style={{ color: 'red', textAlign: 'center', marginBottom: 8 }}>{error}</Text>
          ) : null}
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
            <Text style={styles.registerButtonText}>
              {loading ? "Creating Account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

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

  // Original welcome screen
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: containerPaddingH,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: lg ? 900 : md ? 720 : 480,
            alignItems: "center",
          }}
        >
          {/* Logo */}
          <Image
            source={require("@/assets/icon/logo-final2.png")}
            accessibilityLabel="EcoBin logo"
            style={{
              width: logoSide,
              height: logoSide,
              resizeMode: "contain",
              marginBottom: clamp(height * 0.03, 12, 28),
            }}
          />

          {/* Welcome Text (ONLY bold) */}
          <Text
            style={{
              fontSize: titleSize * sizeFactor,
              fontFamily: "Poppins_700Bold",
              marginBottom: 10,
              textAlign: "center",
              letterSpacing: sm ? 6 : 4,
              color: "#000000",
            }}
          >
            WELCOME
          </Text>

          {/* Tagline (Regular) */}
          <Text
            style={{
              fontSize: taglineSize * sizeFactor,
              fontFamily: "Poppins_400Regular", // Poppins Regular
              lineHeight: clamp(taglineSize * 1.4, 18, 30),
              textAlign: "center",
              color: "#555555",
              marginBottom: clamp(height * 0.02, 10, 24),
            }}
          >
            Where technology meets {"\n"} cleanliness
          </Text>

          {/* Buttons Container */}
          <View style={{ gap: 12, width: "100%", alignItems: "center" }}>
            {/* Sign In Button */}
            <Pressable
              onPress={() => router.push("/(auth)/login")}
              style={({ hovered, pressed }) => ({
                paddingVertical: clamp(height * 0.03, 10, 16),
                paddingHorizontal: sm ? 35 : md ? 36 : 44,
                borderRadius: 50,
                alignItems: "center",
                backgroundColor: hovered && Platform.OS === "web" ? "#2d652c" : pressed ? "#2f6b2e" : "#347433",
                transform: pressed ? [{ scale: 0.98 }] : undefined,
                width: "80%",
              })}
            >
              <Text
                style={{
                  fontSize: buttonTextSize * sizeFactor,
                  fontFamily: "Poppins_400Regular",
                  color: "#ffffff",
                }}
              >
                Sign In
              </Text>
            </Pressable>

            {/* Sign Up Button */}
            <Pressable
              onPress={() => setShowRegister(true)}
              style={({ hovered, pressed }) => ({
                paddingVertical: clamp(height * 0.03, 10, 16),
                paddingHorizontal: sm ? 35 : md ? 36 : 44,
                borderRadius: 50,
                alignItems: "center",
                backgroundColor: "transparent",
                borderWidth: 2,
                borderColor: "#347433",
                transform: pressed ? [{ scale: 0.98 }] : undefined,
                width: "80%",
              })}
            >
              <Text
                style={{
                  fontSize: buttonTextSize * sizeFactor,
                  fontFamily: "Poppins_400Regular",
                  color: "#347433",
                }}
              >
                Sign Up
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View
          style={{
            position: "absolute",
            bottom: clamp(height * 0.06, 24, 56),
            alignItems: "center",
            width: "100%",
            paddingHorizontal: 16,
          }}
        >
          {/* ECOBIN (ONLY bold) */}
          <Text
            style={{
              fontSize: brandSize * sizeFactor,
              fontFamily: "Poppins_600SemiBold",
              textAlign: "center",
              letterSpacing: sm ? 2 : 4,
              color: "#000000",
            }}
          >
            ECOBIN
          </Text>

          {/* Location (Regular) */}
          <Text
            style={{
              fontSize: locationSize * sizeFactor,
              fontFamily: "Poppins_400Regular",
              marginTop: 2,
              color: "#888888",
              textAlign: "center",
            }}
          >
            City of Naga, Cebu
          </Text>
        </View>
      </Animated.View>

      {/* Indicator Bar */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: clamp(height * 0.03, 10, 28),
          gap: 6,
        }}
      >
        <View
          style={{
            width: clamp(width * 0.1, 40, 120),
            height: 4,
            borderRadius: 2,
            backgroundColor: "gray",
            opacity: 0.5,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const poppins = {
  regular: "Poppins_400Regular",
  bold: "Poppins_700Bold",
} as const;

const styles = {
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
};
