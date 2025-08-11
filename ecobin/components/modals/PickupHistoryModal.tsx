import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  binId: string;
  logs: string[];
};

export default function PickupHistoryModal({ visible, onClose, binId, logs }: Props) {
  // Show only the last 5 entries related to this bin
  const filteredLogs = logs.filter((log) => log.includes(binId)).slice(-5);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Pickup History</Text>

          <ScrollView style={styles.logContainer}>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((entry, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyEntry}>{entry}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noHistory}>No history available.</Text>
            )}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxHeight: "60%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  logContainer: {
    marginBottom: 15,
  },
  historyItem: {
    backgroundColor: "#f6f6f6",
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  historyEntry: {
    fontSize: 13,
    color: "#444",
  },
  noHistory: {
    fontSize: 13,
    textAlign: "center",
    color: "#888",
  },
  closeBtn: {
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
