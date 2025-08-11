import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HelpCenterScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Welcome to the Smart Waste Monitoring System Help Center. Select your role below to find the right guidance.
        </Text>

        {/* Garbage Collector Section */}
        <Text style={styles.sectionTitle}>For Garbage Collectors</Text>
        <Text style={styles.paragraph}>• View all assigned bins and their locations on the map.</Text>
        <Text style={styles.paragraph}>• Check the fill level of each bin in real time.</Text>
        <Text style={styles.paragraph}>• Tap on a bin to open Street View and assist with locating it.</Text>
        <Text style={styles.paragraph}>• Mark bins as “collected” after finishing tasks.</Text>

        {/* Janitor Section */}
        <Text style={styles.sectionTitle}>For Janitorial Staff</Text>
        <Text style={styles.paragraph}>• Log in using your assigned credentials.</Text>
        <Text style={styles.paragraph}>• Receive tasks from head staff through the notification system.</Text>
        <Text style={styles.paragraph}>• Update bin status and add remarks if necessary.</Text>
        <Text style={styles.paragraph}>• View your activity and history logs to track past tasks.</Text>

        {/* Footer */}
        <Text style={styles.footerNote}>
          If you're experiencing issues or need additional help, please contact your system administrator or supervisor.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    paddingTop: 60,
  },
  header: {
    position: "relative",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 13,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  content: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2e7d32",
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    color: "#444",
    marginBottom: 8,
    paddingLeft: 8,
  },
  footerNote: {
    fontSize: 14,
    color: "#777",
    marginTop: 30,
    fontStyle: "italic",
  },
});
