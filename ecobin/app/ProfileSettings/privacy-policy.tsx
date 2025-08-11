import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.paragraph}>
          This Privacy Policy explains how we collect, use, and protect the personal data of users within the Smart
          Waste Monitoring System. By using this system, you agree to the terms described below.
        </Text>

        <Text style={styles.sectionTitle}>1. Data Collection</Text>
        <Text style={styles.paragraph}>We may collect the following types of information:</Text>
        <Text style={styles.bullet}>• User profile details (name, email, phone number)</Text>
        <Text style={styles.bullet}>• Location data when accessing bin or route information</Text>
        <Text style={styles.bullet}>
          • Activity logs such as completed tasks, pickup confirmations, and uploaded images
        </Text>

        <Text style={styles.sectionTitle}>2. Purpose of Data Use</Text>
        <Text style={styles.paragraph}>The data we collect is used to:</Text>
        <Text style={styles.bullet}>• Facilitate communication between janitorial staff and management</Text>
        <Text style={styles.bullet}>• Assign, track, and verify waste collection activities</Text>
        <Text style={styles.bullet}>• Improve the efficiency of waste monitoring and reduce manual reporting</Text>

        <Text style={styles.sectionTitle}>3. Data Storage</Text>
        <Text style={styles.paragraph}>
          All data is stored securely on our servers. Access to sensitive information is restricted to authorized
          personnel only.
        </Text>

        <Text style={styles.sectionTitle}>4. User Rights</Text>
        <Text style={styles.paragraph}>As a user, you have the right to:</Text>
        <Text style={styles.bullet}>• Access your profile information</Text>
        <Text style={styles.bullet}>• Request changes to incorrect data</Text>
        <Text style={styles.bullet}>• Request deletion of your account (upon approval from management)</Text>

        <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          We may integrate with third-party services such as Google Maps or cloud storage. These services have their own
          privacy policies, which we encourage you to review.
        </Text>

        <Text style={styles.sectionTitle}>6. Changes to this Policy</Text>
        <Text style={styles.paragraph}>
          We reserve the right to update this policy at any time. Users will be notified of major changes via system
          announcements or email.
        </Text>

        <Text style={styles.sectionTitle}>7. Contact Information</Text>
        <Text style={styles.paragraph}>
          For questions or concerns regarding your privacy, please contact the system administrator or visit the Help
          Center.
        </Text>

        <Text style={styles.footerNote}>Last updated: August 6, 2025</Text>
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
    marginBottom: 10,
  },
  bullet: {
    fontSize: 15,
    color: "#444",
    marginLeft: 10,
    marginBottom: 6,
  },
  footerNote: {
    fontSize: 13,
    color: "#777",
    marginTop: 30,
    fontStyle: "italic",
  },
});
