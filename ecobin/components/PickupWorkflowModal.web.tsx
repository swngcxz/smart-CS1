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
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRealTimeData } from '../contexts/RealTimeDataContext';
import { useAccount } from '../contexts/AccountContext';
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
  const { getSafeCoordinates, getTimeSinceLastGPS, wasteBins, isGPSValid } = useRealTimeData();
  const { account } = useAccount();
  const [loading, setLoading] = useState(false);
  const [workflowStep, setWorkflowStep] = useState<'alert' | 'pickup'>('alert');
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapAnimation] = useState(new Animated.Value(0));
  const [realTimeBinData, setRealTimeBinData] = useState<any>(null);

  // Get real-time bin data when modal opens
  useEffect(() => {
    if (visible && binData?.id && wasteBins) {
      // Find the real-time bin data from wasteBins
      const realTimeBin = wasteBins.find((bin: any) => bin.id === binData.id);
      if (realTimeBin && (!realTimeBinData || realTimeBin.binData?.timestamp !== realTimeBinData.binData?.timestamp)) {
        setRealTimeBinData(realTimeBin);
        console.log('🔄 Real-time bin data updated:', {
          weight: realTimeBin.binData?.weight_kg,
          height: realTimeBin.binData?.distance_cm,
          level: realTimeBin.level,
          timestamp: realTimeBin.binData?.timestamp
        });
      }
    }
  }, [visible, binData?.id, wasteBins?.length]); // Only depend on length, not the entire wasteBins array

  // Get user location when modal opens
  useEffect(() => {
    if (visible && workflowStep === 'route') {
      getCurrentLocation();
    }
  }, [visible, workflowStep]);

  // Toggle map expansion
  const toggleMap = () => {
    const toValue = mapExpanded ? 0 : 1;
    setMapExpanded(!mapExpanded);
    
    Animated.timing(mapAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

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

  const handlePickupStart = async () => {
    setLoading(true);
    try {
      // Find existing pending task for this bin
      const response = await axiosInstance.get('/api/activitylogs');
      const allLogs = response.data.activities || [];
      
      // Find pending task for this bin
      const pendingTask = allLogs.find(log => 
        log.bin_id === binData.id && 
        log.status === 'pending' && 
        log.activity_type === 'task_assignment' &&
        log.source === 'automatic_monitoring'
      );

      if (pendingTask) {
        // Update existing task to assign it to current user
        const updateData = {
          assigned_janitor_id: account?.id || 'unknown_user',
          assigned_janitor_name: account?.fullName || 'Unknown User',
          status: 'in_progress',
          bin_status: 'in_progress',
          task_note: 'Bin pickup task claimed by user - in progress',
          updated_at: new Date().toISOString()
        };

        const updateResponse = await axiosInstance.put(`/api/activitylogs/${pendingTask.id}`, updateData);

        if (updateResponse.data.message && updateResponse.data.message.includes('successfully')) {
          console.log('✅ Existing task claimed by user');
          Alert.alert(
            "Pickup Claimed",
            "You have successfully claimed this pickup task. The task has been updated in your activity logs.",
            [{ text: "OK", onPress: onPickupComplete }]
          );
        } else if (updateResponse.data.warning) {
          // Handle redundant assignment (already assigned to this user)
          console.log('ℹ️ Task already assigned to this user');
          Alert.alert(
            "Task Already Assigned",
            "This task is already assigned to you. You can continue working on it.",
            [{ text: "OK", onPress: onPickupComplete }]
          );
        } else {
          throw new Error(updateResponse.data.message || 'Failed to update activity log');
        }
      } else {
        // No automatic task exists - inform user and close modal
        Alert.alert(
          "No Task Available",
          "No automatic task assignment exists for this bin. Please wait for the system to create one when the bin level exceeds 85%.",
          [{ text: "OK", onPress: onClose }]
        );
      }
    } catch (error: any) {
      console.error('Error claiming pickup task:', error);
      
      // Handle assignment conflict specifically
      if (error.response?.status === 409 && error.response?.data?.error === 'Task assignment conflict') {
        const conflictData = error.response.data;
        Alert.alert(
          "Task Already Assigned",
          `This task has already been assigned to ${conflictData.currentAssignee}. Please check for other available tasks.`,
          [{ text: "OK", onPress: onClose }]
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to claim pickup task. Please try again.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setLoading(false);
    }
  };


  const handleModalClose = async () => {
    setLoading(true);
    try {
      // Check if automatic task already exists
      const response = await axiosInstance.get('/api/activitylogs');
      const allLogs = response.data.activities || [];
      
      const existingTask = allLogs.find(log => 
        log.bin_id === binData.id && 
        log.status === 'pending' && 
        log.activity_type === 'task_assignment' &&
        log.source === 'automatic_monitoring'
      );

      if (existingTask) {
        console.log('✅ Automatic task already exists - No need to create new one');
        Alert.alert(
          "Task Acknowledged",
          "The pickup task has been acknowledged. A janitor will be assigned soon.",
          [{ text: "OK", onPress: onClose }]
        );
      } else {
        // No automatic task exists - inform user
        Alert.alert(
          "No Task Available",
          "No automatic task assignment exists for this bin. Please wait for the system to create one when the bin level exceeds 85%.",
          [{ text: "OK", onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Error handling modal close:', error);
      Alert.alert(
        "Task Acknowledged",
        "The pickup task has been acknowledged. A janitor will be assigned soon.",
        [{ text: "OK", onPress: onClose }]
      );
    } finally {
      setLoading(false);
    }
  };

  if (!binData) return null;

  const renderAlertStep = () => {
    // Use real-time data if available, fallback to binData
    const currentBinData = realTimeBinData || binData;
    const safeCoords = getSafeCoordinates();
    const isOffline = safeCoords.isOffline;
    const timeSinceLastGPS = getTimeSinceLastGPS(currentBinData?.timestamp || Date.now());

    return (
      <View style={styles.stepContainer}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.binName}>{currentBinData?.name || 'Smart Bin'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentBinData?.level || 0) }]}>
              <Text style={styles.statusText}>{getStatusText(currentBinData?.level || 0)}</Text>
            </View>
          </View>
          
          <Text style={styles.binLocation}>{currentBinData?.location || 'Central Plaza'}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Bin Level</Text>
              <Text style={styles.progressValue}>{currentBinData?.level || 0}%</Text>
            </View>
            <ProgressBar
              progress={(currentBinData?.level || 0) / 100}
              color={getStatusColor(currentBinData?.level || 0)}
              style={styles.progressBar}
            />
          </View>
        </View>

        <View style={styles.dataGrid}>
          <View style={styles.dataItem}>
            <Ionicons name="scale" size={20} color="#666" />
            <Text style={styles.dataLabel}>Weight</Text>
            <Text style={styles.dataValue}>
              {currentBinData?.binData?.weight_kg?.toFixed(2) || 
               currentBinData?.weight_kg?.toFixed(2) || 
               '0.00'} kg
            </Text>
          </View>
          
          <View style={styles.dataItem}>
            <Ionicons name="resize" size={20} color="#666" />
            <Text style={styles.dataLabel}>Height</Text>
            <Text style={styles.dataValue}>
              {currentBinData?.binData?.distance_cm || 
               currentBinData?.distance_cm || 
               '0'} cm
            </Text>
          </View>
          
          <View style={styles.dataItem}>
            <Ionicons name="time" size={20} color="#666" />
            <Text style={styles.dataLabel}>Last Update</Text>
            <Text style={styles.dataValue}>
              {currentBinData?.binData?.timestamp ? 
                new Date(currentBinData.binData.timestamp).toLocaleTimeString() : 
                currentBinData?.last_gps_timestamp ? 
                new Date(currentBinData.last_gps_timestamp).toLocaleTimeString() : 
                'Unknown'
              }
            </Text>
          </View>
          
          <View style={styles.dataItem}>
            <Ionicons name="location" size={20} color="#666" />
            <Text style={styles.dataLabel}>Route</Text>
            <Text style={styles.dataValue}>
              {currentBinData?.route || 'Available'}
            </Text>
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
            {safeCoords.latitude && safeCoords.longitude ? 
              `${safeCoords.latitude.toFixed(6)}, ${safeCoords.longitude.toFixed(6)}` : 
              'Coordinates unavailable'
            }
          </Text>
        </View>

        {/* Collapsible Map Section - Web Fallback */}
        <View style={styles.mapSection}>
          <TouchableOpacity style={styles.mapToggle} onPress={toggleMap}>
            <View style={styles.mapToggleContent}>
              <Ionicons name="map" size={20} color="#4caf50" />
              <Text style={styles.mapToggleText}>View Bin Location</Text>
              <Ionicons 
                name={mapExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </View>
          </TouchableOpacity>

          <Animated.View 
            style={[
              styles.collapsibleMapContainer,
              {
                height: mapAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200],
                }),
                opacity: mapAnimation,
              }
            ]}
          >
            <View style={styles.mapContainer}>
              <View style={[styles.map, { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ textAlign: 'center', color: '#6b7280', fontSize: 16 }}>
                  🗺️ Interactive Map
                </Text>
                <Text style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 8 }}>
                  Bin Location: {safeCoords.latitude?.toFixed(6)}, {safeCoords.longitude?.toFixed(6)}
                </Text>
                <Text style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                  Level: {currentBinData?.level || 0}% - {getStatusText(currentBinData?.level || 0)}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.pickupButton]}
            onPress={handlePickupStart}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.buttonText}>Pick-Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRouteStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Navigate to Bin</Text>
      <Text style={styles.stepDescription}>
        Follow the route to reach the bin location
      </Text>

      <View style={styles.mapContainer}>
        <View style={[styles.map, { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ textAlign: 'center', color: '#6b7280' }}>
            Navigation Map - Web Platform
          </Text>
        </View>
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
                Bin Pickup Alert
              </Text>
            </View>
            <TouchableOpacity onPress={handleModalClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
            bounces={true}
            alwaysBounceVertical={false}
          >
            {renderAlertStep()}
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  mapSection: {
    marginBottom: 16,
  },
  mapToggle: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  mapToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapToggleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4caf50',
    marginLeft: 8,
  },
  collapsibleMapContainer: {
    overflow: 'hidden',
  },
  mapContainer: {
    marginBottom: 20,
  },
  map: {
    height: 200,
    borderRadius: 8,
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
    justifyContent: 'center',
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 0,
    maxWidth: 200,
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