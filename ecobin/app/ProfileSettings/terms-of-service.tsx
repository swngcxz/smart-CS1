import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          By using the Smart Waste Management System (SWMS) in Naga City, you agree to the following terms and
          responsibilities designed to maintain efficiency, cleanliness, and transparency across the city.
        </Text>

        {/* User Responsibilities */}
        <Text style={styles.sectionTitle}>User Responsibilities</Text>
        <Text style={styles.paragraph}>• Users must log in using their assigned credentials.</Text>
        <Text style={styles.paragraph}>
          • All actions performed in the app (such as marking bins or uploading photos) must reflect actual work done.
        </Text>
        <Text style={styles.paragraph}>
          • Users should report any issues or inconsistencies within the system immediately to their supervisor or
          admin.
        </Text>

        {/* Data Usage */}
        <Text style={styles.sectionTitle}>Data Usage and Privacy</Text>
        <Text style={styles.paragraph}>
          • Data collected (bin status, user activity, photo uploads) is used solely for operational monitoring and
          reporting.
        </Text>
        <Text style={styles.paragraph}>• No personal user information will be shared with third parties.</Text>
        <Text style={styles.paragraph}>
          • The system may log all actions for audit and performance evaluation purposes.
        </Text>

        {/* System Usage */}
        <Text style={styles.sectionTitle}>System Guidelines</Text>
        <Text style={styles.paragraph}>
          • The platform is intended for official use by registered staff and students involved in the waste management
          initiative.
        </Text>
        <Text style={styles.paragraph}>
          • Misuse or manipulation of the system, including submitting false data or neglecting assigned duties, may
          lead to disciplinary action.
        </Text>
        <Text style={styles.paragraph}>
          • The system is maintained by the designated IT and administrative team of the institution or local
          government.
        </Text>

        {/* Footer */}
        <Text style={styles.footerNote}>
          These terms help ensure that the Smart Waste Management System contributes to a cleaner, smarter Naga City.
          For questions, contact your system administrator.
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
