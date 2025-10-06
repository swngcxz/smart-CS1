import { useTheme } from "@/hooks/useTheme";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import { useState } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { useAccount } from "@/hooks/useAccount";
import { useAuth } from "@/hooks/useAuth";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [faceIDEnabled, setFaceIDEnabled] = useState(false);
  const router = useRouter();
  const { account, loading: accountLoading, error: accountError } = useAccount();
  const { userInfo, fetchUserInfo } = useUserInfo();

  // Refresh userInfo when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('👤 Settings screen focused, refreshing user info...');
      fetchUserInfo();
    }, []) // Empty dependency array to prevent infinite loops
  );

  const { logout } = useAuth();
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          const ok = await logout();
          if (ok) {
            await AsyncStorage.clear();
            router.replace("/landing");
          } else {
            Alert.alert("Logout Failed", "Could not log out. Please try again.");
          }
        },
      },
    ]);
  };

  const textColor = isDarkMode ? "#fff" : "#111";
  const secondaryTextColor = isDarkMode ? "#aaa" : "#666";
  const bgColor = isDarkMode ? "#000" : "#f2f2f7";
  const cardColor = isDarkMode ? "#1c1c1e" : "#fff";
  const borderColor = isDarkMode ? "#333" : "#eee";

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]} contentInsetAdjustmentBehavior="automatic">
      {/* Profile Header */}
      <View style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <Image 
          source={
            userInfo?.profileImagePath 
              ? { uri: `http://192.168.254.114:8000/api/userinfo/profile-image/${userInfo.profileImagePath.split('/').pop()}` }
              : { uri: "https://i.pravatar.cc/100?u=" + (account?.email || 'user') }
          } 
          style={styles.avatar} 
        />
        <View>
          {accountLoading ? (
            <Text style={[styles.name, { color: textColor }]}>Loading...</Text>
          ) : accountError ? (
            <Text style={[styles.name, { color: 'red' }]}>{accountError}</Text>
          ) : account ? (
            <>
              <Text style={[styles.name, { color: textColor }]}>{account.fullName}</Text>
              <Text style={[styles.username, { color: secondaryTextColor }]}>{account.email}</Text>
            </>
          ) : null}
        </View>
      </View>
        <View style={[styles.divider, { backgroundColor: borderColor }]} />
      </View>

      {/* Account */}
      <Text style={[styles.sectionHeader, { color: secondaryTextColor }]}>ACCOUNT</Text>
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <SettingRow
          label="Edit Profile"
          icon="user"
          onPress={() => router.push("/Settings/edit-profile")}
          isDarkMode={isDarkMode}
        />
        <SettingRow
          label="Change Password"
          icon="lock"
          onPress={() => router.push("/Settings/change-password")}
          isDarkMode={isDarkMode}
        />
      </View>

      {/* Preferences */}
      <Text style={[styles.sectionHeader, { color: secondaryTextColor }]}>PREFERENCES</Text>
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <SettingSwitch
          label="Dark Mode"
          icon="moon"
          value={isDarkMode}
          onValueChange={toggleDarkMode}
          isDarkMode={isDarkMode}
        />
        <SettingSwitch
          label="Notifications"
          icon="bell"
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          isDarkMode={isDarkMode}
        />
        <SettingSwitch
          label="Face ID"
          icon="smile"
          value={faceIDEnabled}
          onValueChange={setFaceIDEnabled}
          isDarkMode={isDarkMode}
        />
      </View>

      {/* Support */}
      <Text style={[styles.sectionHeader, { color: secondaryTextColor }]}>SUPPORT</Text>
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <SettingRow
          label="Help Center"
          icon="help-circle"
          onPress={() => router.push("/ProfileSettings/help-center")}
          isDarkMode={isDarkMode}
        />
        <SettingRow
          label="Terms of Service"
          icon="file-text"
          onPress={() => router.push("/ProfileSettings/terms-of-service")}
          isDarkMode={isDarkMode}
        />
        <SettingRow
          label="Privacy Policy"
          icon="shield"
          onPress={() => router.push("/ProfileSettings/privacy-policy")}
          isDarkMode={isDarkMode}
        />
        <SettingRow label="Logout" icon="log-out" onPress={handleLogout} isDestructive isDarkMode={isDarkMode} />
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={[styles.versionText, { color: secondaryTextColor }]}>App Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

function SettingRow({ label, icon, onPress, isDestructive = false, isDarkMode }: any) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Feather name={icon} size={20} color={isDestructive ? "#ff3b30" : isDarkMode ? "#ccc" : "#555"} />
        <Text style={[styles.label, { color: isDestructive ? "#ff3b30" : isDarkMode ? "#fff" : "#222" }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={isDarkMode ? "#666" : "#aaa"} />
    </TouchableOpacity>
  );
}

function SettingSwitch({ label, icon, value, onValueChange, isDarkMode }: any) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Feather name={icon} size={20} color={isDarkMode ? "#ccc" : "#555"} />
        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#222" }]}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 10,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    fontSize: 16,
  },
  profileContainer: {
    marginBottom: 0,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: "#ccc",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  username: {
    fontSize: 12,

  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
    marginTop: 16,
  },
  footer: {
    marginTop: 50,
    alignItems: "center",
    marginBottom: 40,
  },
  versionText: {
    fontSize: 13,
  },
});
