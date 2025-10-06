import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { useNotificationBadge } from "@/hooks/useNotificationBadge";
import { useAccount } from "@/contexts/AccountContext";

interface HeaderProps {
  showIcons?: boolean;
  style?: ViewStyle;
}

const Header = ({ showIcons = true, style }: HeaderProps) => {
  const router = useRouter();
  const { account } = useAccount();
  const { badgeData } = useNotificationBadge(account?.id);

  return (
    <View style={[styles.headerContainer, style]}>
      <Image source={require("@/assets/icon/logo-final2.png")} style={styles.logo} resizeMode="contain" />

      {/* Centered Text */}
      <Text style={styles.centerText}>ECOBIN</Text>

      {/* Icons (right-aligned) */}
      {showIcons && (
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => router.push("/screens/notification")} style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
            {badgeData.hasNotifications && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {badgeData.unreadCount > 99 ? '99+' : badgeData.unreadCount}
                </Text>
              </View>
            )}
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
  notificationButton: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Header;
