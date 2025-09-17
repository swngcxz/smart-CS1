import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ProgressBar } from 'react-native-paper';
import { useRealTimeData } from '../hooks/useRealTimeData';
import axiosInstance from '../utils/axiosInstance';

interface PickupRequestModalProps {
  visible: boolean;
  onClose: () => void;
  binData: any;
  onPickupConfirm: () => void;
  onAcknowledge: () => void;
}

const { width, height } = Dimensions.get('window');

export default function PickupRequestModal({ 
  visible, 
  onClose, 
  binData, 
  onPickupConfirm, 
  onAcknowledge 
}: PickupRequestModalProps) {
  const { getSafeCoordinates, getTimeSinceLastGPS } = useRealTimeData();
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 10.3157,
    longitude: 123.8854,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Update map region when bin data changes
  useEffect(() => {
    if (binData && binData.position) {
      setMapRegion({
        latitude: binData.position[0],
        longitude: binData.position[1],
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [binData]);

  const getStatusColor = (level: number) => {
    if (level >= 90) return "#f44336"; // red
    if (level >= 80) return "#ff9800"; // orange
    if (level >= 60) return "#ffc107"; // yellow
    return "#4caf50"; // green
  };

  const getStatusText = (level: number) => {
    if (level >= 90) return "CRITICAL";
    if (level >= 80) return "HIGH";
    if (level >= 60) return "MEDIUM";
    return "LOW";
  };

  const handlePickupConfirm = async () => {
    setLoading(true);
    try {
      // Send pickup request to server
      const response = await axiosInstance.post('/api/pickup-requests', {
        binId: binData.id,
        binName: binData.name,
        binLevel: binData.level,
        binLocation: binData.location || 'Central Plaza',
        binStatus: binData.status,
        coordinates: binData.position,
        weight: binData.weight_kg || 0,
        height: binData.distance_cm || 0,
        gpsValid: binData.gps_valid || false,
        satellites: binData.satellites || 0,
        timestamp: new Date().toISOString(),
        status: 'pending',
        priority: binData.level >= 90 ? 'critical' : 'high'
      });

      if (response.data.success) {
        Alert.alert(
          "Pickup Request Sent",
          "Your pickup request has been sent to the staff. You will be notified when a janitor is assigned.",
          [{ text: "OK", onPress: onPickupConfirm }]
        );
      } else {
        throw new Error(response.data.message || 'Failed to send pickup request');
      }
    } catch (error) {
      console.error('Error sending pickup request:', error);
      Alert.alert(
        "Error",
        "Failed to send pickup request. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = () => {
    Alert.alert(
      "Acknowledged",
      "You have acknowledged the bin status. The system will continue monitoring.",
      [{ text: "OK", onPress: onAcknowledge }]
    );
  };

  if (!binData) return null;

  const safeCoords = getSafeCoordinates();
  const isOffline = safeCoords.isOffline;
  const timeSinceLastGPS = getTimeSinceLastGPS(binData.timestamp || Date.now());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons 
                name="warning" 
                size={24} 
                color={getStatusColor(binData.level)} 
              />
              <Text style={styles.headerTitle}>Bin Pickup Alert</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Bin Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Text style={styles.binName}>{binData.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(binData.level) }]}>
                  <Text style={styles.statusText}>{getStatusText(binData.level)}</Text>
                </View>
              </View>
              
              <Text style={styles.binLocation}>{binData.location || 'Central Plaza'}</Text>
              
              {/* Bin Level Progress */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Bin Level</Text>
                  <Text style={styles.progressValue}>{binData.level}%</Text>
                </View>
                <ProgressBar
                  progress={binData.level / 100}
                  color={getStatusColor(binData.level)}
                  style={styles.progressBar}
                />
              </View>
            </View>

            {/* Bin Data Grid */}
            <View style={styles.dataGrid}>
              <View style={styles.dataItem}>
                <Ionicons name="scale" size={20} color="#666" />
                <Text style={styles.dataLabel}>Weight</Text>
                <Text style={styles.dataValue}>{binData.weight_kg || 0} kg</Text>
              </View>
              
              <View style={styles.dataItem}>
                <Ionicons name="resize" size={20} color="#666" />
                <Text style={styles.dataLabel}>Height</Text>
                <Text style={styles.dataValue}>{binData.distance_cm || 0} cm</Text>
              </View>
              
              <View style={styles.dataItem}>
                <Ionicons name="time" size={20} color="#666" />
                <Text style={styles.dataLabel}>Last Update</Text>
                <Text style={styles.dataValue}>{binData.lastCollection || 'Unknown'}</Text>
              </View>
              
              <View style={styles.dataItem}>
                <Ionicons name="location" size={20} color="#666" />
                <Text style={styles.dataLabel}>Route</Text>
                <Text style={styles.dataValue}>{binData.route || 'Unknown'}</Text>
              </View>
            </View>

            {/* GPS Status */}
            <View style={styles.gpsStatus}>
              <View style={styles.gpsHeader}>
                <Ionicons 
                  name={isOffline ? "location-outline" : "location"} 
                  size={20} 
                  color={isOffline ? "#ff9800" : "#4caf50"} 
                />
                <Text style={styles.gpsTitle}>GPS Status</Text>
                <View style={[styles.gpsIndicator, { backgroundColor: isOffline ? "#ff9800" : "#4caf50" }]} />
              </View>
              <Text style={styles.gpsText}>
                {isOffline ? `Offline - Last seen ${timeSinceLastGPS}` : 'Live tracking active'}
              </Text>
              <Text style={styles.gpsCoords}>
                {binData.position ? 
                  `${binData.position[0].toFixed(6)}, ${binData.position[1].toFixed(6)}` : 
                  'Coordinates unavailable'
                }
              </Text>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
              <Text style={styles.mapTitle}>Bin Location</Text>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={mapRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                <Marker
                  coordinate={{
                    latitude: binData.position[0],
                    longitude: binData.position[1],
                  }}
                  title={binData.name}
                  description={`Level: ${binData.level}%`}
                >
                  <View style={[styles.markerContainer, { backgroundColor: getStatusColor(binData.level) }]}>
                    <Ionicons name="trash" size={20} color="white" />
                    {isOffline && <Text style={styles.offlineText}>OFF</Text>}
                  </View>
                </Marker>
              </MapView>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.pickupButton]}
                onPress={handlePickupConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.buttonText}>Request Pickup</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.acknowledgeButton]}
                onPress={handleAcknowledge}
                disabled={loading}
              >
                <Ionicons name="checkmark" size={20} color="#666" />
                <Text style={[styles.buttonText, { color: "#666" }]}>Acknowledge</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.95,
    maxHeight: height * 0.9,
    backgroundColor: 'white',
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  binName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  binLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dataItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 2,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  gpsStatus: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  gpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  gpsIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  gpsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  gpsCoords: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  mapContainer: {
    marginBottom: 20,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  map: {
    height: 200,
    borderRadius: 8,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  offlineText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: -2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  pickupButton: {
    backgroundColor: '#4caf50',
  },
  acknowledgeButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    color: 'white',
  },
});
