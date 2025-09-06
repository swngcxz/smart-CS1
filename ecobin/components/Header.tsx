import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
interface HeaderProps {
  showIcons?: boolean;
  style?: ViewStyle;
}

const Header = ({ showIcons = true, style }: HeaderProps) => {
  const router = useRouter();

  return (
    <View style={[styles.headerContainer, style]}>
      <Image source={require("@/assets/icon/logo-final2.png")} style={styles.logo} resizeMode="contain" />

      {/* Centered Text */}
      <Text style={styles.centerText}>ECOBIN</Text>

      {/* Icons (right-aligned) */}
      {showIcons && (
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => router.push("/screens/notification")}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(tabs)/settings")}>
            <Ionicons name="person-circle-outline" size={26} color="#000" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    paddingTop: 0,
    backgroundColor: "#fff",
  },
  logo: {
    width: 120,
    marginLeft: -45,
    height: 40,
  },
  iconContainer: {
    flexDirection: "row",
    gap: 12,
  },
  centerText: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 10,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});

export default Header;
