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
        {/* Warning Box */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ For Janitors and Waste Collectors Only</Text>
          <Text style={styles.warningText}>
            This mobile application is exclusively for authorized waste collection personnel. By using this app, you
            acknowledge your role as a janitor/waste collector in the EcoBin Smart Waste Management System.
          </Text>
        </View>

        <Text style={styles.intro}>
          By using the EcoBin mobile app, you agree to the following terms and responsibilities designed to maintain
          efficiency, cleanliness, and accountability in waste collection operations.
        </Text>

        {/* Account and Access */}
        <Text style={styles.sectionTitle}>1. Account Access and Security</Text>
        <Text style={styles.paragraph}>• You must use only your assigned personal login credentials.</Text>
        <Text style={styles.paragraph}>
          • Never share your account password with anyone, including fellow workers.
        </Text>
        <Text style={styles.paragraph}>
          • If you forget your password or suspect unauthorized access, contact your supervisor immediately.
        </Text>
        <Text style={styles.paragraph}>
          • You are responsible for all activities performed under your account.
        </Text>

        {/* Work Responsibilities */}
        <Text style={styles.sectionTitle}>2. Waste Collection Responsibilities</Text>
        <Text style={styles.paragraph}>
          • Check the app daily for assigned tasks and bin collection schedules.
        </Text>
        <Text style={styles.paragraph}>
          • Mark bins as "Collected" only after physically emptying them.
        </Text>
        <Text style={styles.paragraph}>
          • Upload proof photos (before/after) when required by the system.
        </Text>
        <Text style={styles.paragraph}>
          • Report damaged bins, overflowing bins, or hazardous waste immediately through the app.
        </Text>
        <Text style={styles.paragraph}>
          • Complete all assigned tasks within your designated shift hours.
        </Text>

        {/* GPS and Location */}
        <Text style={styles.sectionTitle}>3. GPS and Location Tracking</Text>
        <Text style={styles.paragraph}>
          • Location services must be enabled during your work hours for task verification.
        </Text>
        <Text style={styles.paragraph}>
          • GPS data is used to confirm you are at the bin location when marking it as collected.
        </Text>
        <Text style={styles.paragraph}>
          • Location data is recorded for safety, accountability, and route optimization.
        </Text>

        {/* Photo Requirements */}
        <Text style={styles.sectionTitle}>4. Photo Documentation</Text>
        <Text style={styles.paragraph}>
          • All uploaded photos must be clear, genuine, and taken at the actual collection site.
        </Text>
        <Text style={styles.paragraph}>
          • Photos must show the bin before and after collection when required.
        </Text>
        <Text style={styles.paragraph}>• Do not upload old, fake, or unrelated photos.</Text>
        <Text style={styles.paragraph}>
          • Photos are stored securely and may be reviewed by supervisors or administrators.
        </Text>

        {/* Prohibited Actions */}
        <Text style={styles.sectionTitle}>5. Prohibited Activities</Text>
        <Text style={styles.paragraph}>
          • Marking bins as collected without actually collecting them (false reporting).
        </Text>
        <Text style={styles.paragraph}>• Using another person's account or allowing others to use yours.</Text>
        <Text style={styles.paragraph}>
          • Submitting fake photos or manipulating timestamps and location data.
        </Text>
        <Text style={styles.paragraph}>• Using the app for personal or non-work-related purposes.</Text>
        <Text style={styles.paragraph}>
          • Deleting, modifying, or tampering with task history or system data.
        </Text>

        {/* Data and Privacy */}
        <Text style={styles.sectionTitle}>6. Data Usage and Privacy</Text>
        <Text style={styles.paragraph}>
          • Your work activities (tasks completed, photos, location, time) are tracked for performance monitoring.
        </Text>
        <Text style={styles.paragraph}>• Your personal information will not be shared with third parties.</Text>
        <Text style={styles.paragraph}>
          • The system records all actions for audit, evaluation, and improvement purposes.
        </Text>
        <Text style={styles.paragraph}>
          • You have the right to review your own activity logs through your profile.
        </Text>

        {/* Consequences */}
        <Text style={styles.sectionTitle}>7. Violations and Consequences</Text>
        <Text style={styles.paragraph}>
          • Violations of these terms may result in warnings, suspension, or termination of employment.
        </Text>
        <Text style={styles.paragraph}>
          • Repeated false reporting or negligence will be subject to disciplinary action.
        </Text>
        <Text style={styles.paragraph}>
          • Supervisors and administrators have the right to review your work performance through the system.
        </Text>

        {/* Support */}
        <Text style={styles.sectionTitle}>8. Technical Support and Issues</Text>
        <Text style={styles.paragraph}>• Report app bugs, errors, or technical issues to your supervisor.</Text>
        <Text style={styles.paragraph}>
          • If you cannot complete a task due to technical problems, document it and inform your supervisor.
        </Text>
        <Text style={styles.paragraph}>• System maintenance may occasionally require app downtime.</Text>

        {/* Acceptance Box */}
        <View style={styles.acceptanceBox}>
          <Text style={styles.acceptanceTitle}>Acceptance of Terms</Text>
          <Text style={styles.acceptanceText}>
            By logging in and using this mobile application, you confirm that you have read, understood, and agree to
            abide by these Terms of Service as an authorized janitor/waste collector. Your continued use of the app
            constitutes ongoing acceptance of these terms.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footerNote}>
          These terms ensure efficient waste collection, accountability, and a cleaner community. Thank you for your
          dedication and hard work. For questions or concerns, contact your supervisor or system administrator.
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
  warningBox: {
    backgroundColor: "#fff3cd",
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f57c00",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: "#5d4037",
    lineHeight: 20,
  },
  intro: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2e7d32",
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: "#444",
    marginBottom: 8,
    paddingLeft: 8,
    lineHeight: 22,
  },
  acceptanceBox: {
    backgroundColor: "#e8f5e9",
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50",
    padding: 15,
    borderRadius: 8,
    marginTop: 25,
    marginBottom: 10,
  },
  acceptanceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 8,
  },
  acceptanceText: {
    fontSize: 14,
    color: "#1b5e20",
    lineHeight: 20,
  },
  footerNote: {
    fontSize: 14,
    color: "#777",
    marginTop: 30,
    fontStyle: "italic",
    lineHeight: 22,
  },
});

