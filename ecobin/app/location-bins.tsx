import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRealTimeData, getFillColor, getStatusColor } from "@/hooks/useRealTimeData";

export default function LocationBins() {
  const router = useRouter();
  const { locationName, locationData } = useLocalSearchParams();
  const [selectedBin, setSelectedBin] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [useRealTime, setUseRealTime] = useState(false);

  // Parse location data
  const location = locationData ? JSON.parse(locationData as string) : null;

  // Real-time data hook
  const {
    realTimeLocationData,
    loading: realTimeLoading,
    error: realTimeError,
    lastUpdate,
    refresh,
  } = useRealTimeData();

  // Merge real-time data with existing location data
  const getMergedLocationData = () => {
    if (!location) return null;

    // If this is Central Plaza and we have real-time data, merge it
    if (locationName === "Central Plaza" && realTimeLocationData.bins.length > 0) {
      const realTimeBin = realTimeLocationData.bins[0]; // Get the real-time bin

      // Update the existing bins with real-time data where bin IDs match
      const updatedBins = location.bins.map((bin: any) => {
        if (bin.id === realTimeBin.id || bin.id === "Bin 1") {
          // Update with real-time data
          return {
            ...bin,
            level: realTimeBin.level,
            status: realTimeBin.status,
            lastCollected: realTimeBin.lastCollected,
            nextCollection: realTimeBin.nextCollection,
            wasteType: realTimeBin.wasteType,
            binData: realTimeBin.binData,
          };
        }
        return bin; // Keep other bins unchanged
      });

      // Calculate overall location stats
      const totalLevel = updatedBins.reduce((sum: number, bin: any) => sum + bin.level, 0);
      const overallLevel = Math.round(totalLevel / updatedBins.length);
      const nearlyFullCount = updatedBins.filter((bin: any) => bin.level >= 70).length;

      return {
        ...location,
        overallLevel,
        nearlyFullCount,
        bins: updatedBins,
      };
    }

    // For other locations, return original data
    return location;
  };

  const currentLocation = getMergedLocationData();
  const isLoading = realTimeLoading;
  const hasRealTimeData = locationName === "Central Plaza" && realTimeLocationData.bins.length > 0;

  const handleBinPress = (bin: any) => {
    setSelectedBin(bin);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedBin(null);
  };

  const handleBack = () => {
    router.back();
  };

  if (!currentLocation && !isLoading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Location data not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show UI immediately with loading indicator

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{locationName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingHeader}>
          <ActivityIndicator size="small" color="#2e7d32" />
          <Text style={styles.loadingHeaderText}>Loading real-time data...</Text>
        </View>
      )}

      {/* Bins List */}
      <ScrollView style={styles.binsContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        {currentLocation?.bins?.map((bin: any, index: number) => (
          <TouchableOpacity key={index} onPress={() => handleBinPress(bin)} style={styles.binCard}>
            <View style={styles.binHeader}>
              <View style={styles.binIdContainer}>
                <Text style={styles.binId}>{bin.id}</Text>
                {hasRealTimeData && bin.id === "Bin 1" && (
                  <View style={styles.binLiveIndicator}>
                    <View style={styles.binLiveDot} />
                    <Text style={styles.binLiveText}>LIVE</Text>
                  </View>
                )}
              </View>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusLabel, { color: getStatusColor(bin.status) }]}>{bin.status}</Text>
              </View>
            </View>

            <Text style={styles.binLevel}>{bin.level}%</Text>

            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${bin.level}%`,
                    backgroundColor: getFillColor(bin.level),
                  },
                ]}
              />
            </View>

            <View style={styles.locationFooter}>
              <Text style={styles.lastCollectedText}>Last collected {bin.lastCollected}</Text>
              <Text style={styles.nearlyFullText}>Capacity: {bin.capacity}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bin Details Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bin Details</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            {selectedBin && (
              <ScrollView style={styles.modalContent}>
                {/* Bin ID and Status */}
                <View style={styles.modalSection}>
                  <View style={styles.binInfoHeader}>
                    <Text style={styles.binInfoTitle}>{selectedBin.id}</Text>
                    <View
                      style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedBin.status) + "20" }]}
                    >
                      <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedBin.status) }]}>
                        {selectedBin.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Fill Level */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Fill Level</Text>
                  <Text style={styles.fillLevelText}>{selectedBin.level}%</Text>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${selectedBin.level}%`,
                          backgroundColor: getFillColor(selectedBin.level),
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Bin Information */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Bin Information</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Capacity</Text>
                      <Text style={styles.infoValue}>{selectedBin.capacity}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Type</Text>
                      <Text style={styles.infoValue}>{selectedBin.type}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Location</Text>
                      <Text style={styles.infoValue}>{locationName}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Status</Text>
                      <Text style={[styles.infoValue, { color: getStatusColor(selectedBin.status) }]}>
                        {selectedBin.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Collection Information */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Collection Information</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Last Collected</Text>
                      <Text style={styles.infoValue}>{selectedBin.lastCollected}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Next Collection</Text>
                      <Text style={styles.infoValue}>{selectedBin.nextCollection}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 44,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 60, // Same width as back button for centering
  },
  // Bins Container
  binsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // Bin Card Styles - Same as overview design
  binCard: {
    backgroundColor: "#f0f4f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  binHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  binIdContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  binId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  binLiveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  binLiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4caf50",
    marginRight: 3,
  },
  binLiveText: {
    fontSize: 8,
    color: "#4caf50",
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  binLevel: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  // Progress Bar
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  // Footer styles
  locationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  lastCollectedText: {
    fontSize: 11,
    color: "#666",
  },
  nearlyFullText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  // Loading and Real-time Styles
  loadingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#f8f9fa",
    marginBottom: 10,
    borderRadius: 8,
  },
  loadingHeaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshText: {
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get("window").height * 0.85,
    minHeight: Dimensions.get("window").height * 0.5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  binInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  binInfoTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusTextLarge: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  fillLevelText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoItem: {
    width: "48%",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
});
