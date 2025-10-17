import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { useNotifications } from "@/hooks/useNotifications";
import { useProfile } from "@/hooks/useProfile";
interface HeaderProps {
  showIcons?: boolean;
  style?: ViewStyle;
}

const Header: React.FC<HeaderProps> = ({ showIcons = true, style }) => {
  const router = useRouter();
  const { getUnreadCount, notifications, loading } = useNotifications();
  const { getProfileImageUrl, getUserInitials } = useProfile();
  const unreadCount = getUnreadCount();
  
  const profileImageUrl = getProfileImageUrl();
  const userInitials = getUserInitials();

  return (
    <View style={[styles.headerContainer, style]}>
      <Image source={require("@/assets/icon/logo-final2.png")} style={styles.logo} resizeMode="contain" />


      {/* Icons (right-aligned) */}
      {showIcons && (
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => router.push("/notifications")} style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
            {loading ? (
              <View style={styles.loadingBadge}>
                <Text style={styles.loadingBadgeText}>...</Text>
              </View>
            ) : unreadCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(tabs)/settings")}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileInitials}>{userInitials}</Text>
              </View>
            )}
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
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  notificationButton: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#f44336",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  loadingBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ff9800",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  loadingBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ccc",
  },
  profilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default Header;
