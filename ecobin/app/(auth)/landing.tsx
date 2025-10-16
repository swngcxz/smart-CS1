import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Image, Platform, Pressable, SafeAreaView, Text, View, useWindowDimensions } from "react-native";

// ✅ Load Poppins here
import { Poppins_400Regular, Poppins_600SemiBold, useFonts } from "@expo-google-fonts/poppins";

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { height, width } = useWindowDimensions();

  // Load fonts (required so Poppins actually applies on this screen)
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
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

  // Don’t render until fonts are loaded
  if (!fontsLoaded) return null;

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

          {/* Sign In Button (Regular) */}
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={({ hovered, pressed }) => ({
              paddingVertical: clamp(height * 0.03, 10, 16),
              paddingHorizontal: sm ? 35 : md ? 36 : 44,
              borderRadius: 50,
              alignItems: "center",
              backgroundColor: hovered && Platform.OS === "web" ? "#2d652c" : pressed ? "#2f6b2e" : "#347433",
              transform: pressed ? [{ scale: 0.98 }] : undefined,
            })}
          >
            <Text
              style={{
                fontSize: buttonTextSize * sizeFactor,
                fontFamily: "Poppins_400Regular", // Poppins Regular
                color: "#ffffff",
              }}
            >
              Sign In
            </Text>
          </Pressable>
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
              fontFamily: "Poppins_600SemiBold", // use SemiBold here (was invalid "Poppins_600Bold")
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
              fontFamily: "Poppins_400Regular", // Poppins Regular
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
