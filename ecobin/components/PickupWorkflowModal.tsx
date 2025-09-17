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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { ProgressBar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRealTimeData } from '../hooks/useRealTimeData';
import axiosInstance from '../utils/axiosInstance';

interface PickupWorkflowModalProps {
  visible: boolean;
  onClose: () => void;
  binData: any;
  onPickupComplete: () => void;
  onAcknowledge: () => void;
}

const { width, height } = Dimensions.get('window');

export default function PickupWorkflowModal({ 
  visible, 
  onClose, 
  binData, 
  onPickupComplete, 
  onAcknowledge 
}: PickupWorkflowModalProps) {
  const { getSafeCoordinates, getTimeSinceLastGPS } = useRealTimeData();
  const [loading, setLoading] = useState(false);
  const [workflowStep, setWorkflowStep] = useState<'alert' | 'pickup' | 'route' | 'photo' | 'complete'>('alert');
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Get user location when modal opens
  useEffect(() => {
    if (visible && workflowStep === 'route') {
      getCurrentLocation();
    }
  }, [visible, workflowStep]);

  const getCurrentLocation = async () => {
    try {
      // In a real app, you'd use Location.getCurrentPositionAsync()
      // For now, we'll use a mock location
      setUserLocation({
        latitude: 10.3157,
        longitude: 123.8854
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const getStatusColor = (level: number) => {
    if (level >= 90) return "#f44336";
    if (level >= 80) return "#ff9800";
    if (level >= 60) return "#ffc107";
    return "#4caf50";
  };

  const getStatusText = (level: number) => {
    if (level >= 90) return "CRITICAL";
    if (level >= 80) return "HIGH";
    if (level >= 60) return "MEDIUM";
    return "LOW";
  };

  const handlePickupStart = () => {
    setWorkflowStep('route');
    getCurrentLocation();
  };

  const handleRouteComplete = () => {
    setWorkflowStep('photo');
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setPhotos(prev => [...prev, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled) {
        setPhotos(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handlePickupComplete = async () => {
    setLoading(true);
    try {
      // Create activity log for pickup completion
      const activityData = {
        user_id: 'current_user', // You'd get this from auth context
        bin_id: binData.id,
        bin_location: binData.location || 'Central Plaza',
        bin_status: 'completed',
        bin_level: binData.level,
        assigned_janitor_id: 'current_user',
        assigned_janitor_name: 'Current User',
        task_note: notes || 'Bin pickup completed',
        activity_type: 'pickup_completed',
        photos: photos,
        coordinates: binData.position,
        timestamp: new Date().toISOString()
      };

      const response = await axiosInstance.post('/api/activity-logs', activityData);

      if (response.data.success) {
        Alert.alert(
          "Pickup Completed",
          "Bin pickup has been completed successfully and logged in the system.",
          [{ text: "OK", onPress: onPickupComplete }]
        );
        setWorkflowStep('alert');
        setPhotos([]);
        setNotes('');
      } else {
        throw new Error(response.data.message || 'Failed to complete pickup');
      }
    } catch (error) {
      console.error('Error completing pickup:', error);
      Alert.alert(
        "Error",
        "Failed to complete pickup. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = () => {
    // Create pending activity log
    const pendingData = {
      user_id: 'current_user',
      bin_id: binData.id,
      bin_location: binData.location || 'Central Plaza',
      bin_status: 'pending',
      bin_level: binData.level,
      assigned_janitor_id: null,
      assigned_janitor_name: null,
      task_note: 'Bin pickup acknowledged - waiting for pickup',
      activity_type: 'pickup_acknowledged',
      timestamp: new Date().toISOString()
    };

    axiosInstance.post('/api/activity-logs', pendingData)
      .then(() => {
        Alert.alert(
          "Acknowledged",
          "Bin status has been acknowledged and added to pending tasks.",
          [{ text: "OK", onPress: onAcknowledge }]
        );
      })
      .catch(error => {
        console.error('Error acknowledging:', error);
        Alert.alert("Error", "Failed to acknowledge. Please try again.");
      });
  };

  if (!binData) return null;

  const safeCoords = getSafeCoordinates();
  const isOffline = safeCoords.isOffline;
  const timeSinceLastGPS = getTimeSinceLastGPS(binData.timestamp || Date.now());

  const renderAlertStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.binName}>{binData.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(binData.level) }]}>
            <Text style={styles.statusText}>{getStatusText(binData.level)}</Text>
          </View>
        </View>
        
        <Text style={styles.binLocation}>{binData.location || 'Central Plaza'}</Text>
        
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

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.pickupButton]}
          onPress={handlePickupStart}
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.buttonText}>Pick-Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.acknowledgeButton]}
          onPress={handleAcknowledge}
        >
          <Ionicons name="checkmark" size={20} color="#666" />
          <Text style={[styles.buttonText, { color: "#666" }]}>Okay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRouteStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Navigate to Bin</Text>
      <Text style={styles.stepDescription}>
        Follow the route to reach the bin location
      </Text>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: binData.position[0],
            longitude: binData.position[1],
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
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
            </View>
          </Marker>
        </MapView>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.pickupButton]}
        onPress={handleRouteComplete}
      >
        <Ionicons name="checkmark-circle" size={20} color="white" />
        <Text style={styles.buttonText}>Arrived at Bin</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPhotoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Document Pickup</Text>
      <Text style={styles.stepDescription}>
        Take photos as proof of pickup completion
      </Text>

      <View style={styles.photoContainer}>
        {photos.map((photo, index) => (
          <Image key={index} source={{ uri: photo }} style={styles.photo} />
        ))}
      </View>

      <View style={styles.photoButtons}>
        <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
          <Ionicons name="camera" size={20} color="#4caf50" />
          <Text style={styles.photoButtonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          <Ionicons name="images" size={20} color="#4caf50" />
          <Text style={styles.photoButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.pickupButton]}
          onPress={handlePickupComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.buttonText}>Done</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons 
                name="warning" 
                size={24} 
                color={getStatusColor(binData.level)} 
              />
              <Text style={styles.headerTitle}>
                {workflowStep === 'alert' ? 'Bin Pickup Alert' : 
                 workflowStep === 'route' ? 'Navigate to Bin' :
                 workflowStep === 'photo' ? 'Document Pickup' : 'Bin Pickup'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {workflowStep === 'alert' && renderAlertStep()}
            {workflowStep === 'route' && renderRouteStep()}
            {workflowStep === 'photo' && renderPhotoStep()}
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
    height: height * 0.9,
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
    minHeight: height * 0.7,
  },
  stepContainer: {
    flex: 1,
    minHeight: height * 0.6,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
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
  map: {
    height: 300,
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
  photoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 4,
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  photoButtonText: {
    marginLeft: 8,
    color: '#4caf50',
    fontWeight: 'bold',
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
