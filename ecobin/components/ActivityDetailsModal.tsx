import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { CLOUDINARY_CONFIG } from '@/config/cloudinary';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import MapRoute from './MapRoute';

interface ActivityLog {
  id: string;
  bin_id: string;
  bin_location: string;
  bin_level: number;
  activity_type: string;
  task_note?: string;
  assigned_janitor_id?: string;
  assigned_janitor_name?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  completion_notes?: string;
  photos?: string[];
  bin_condition?: string;
  collected_weight?: number;
  collection_time?: string;
  user_name?: string;
}

interface ActivityDetailsModalProps {
  visible: boolean;
  activity: ActivityLog | null;
  onClose: () => void;
  onUpdate: () => void;
  onNavigateToMap?: (binId: string, binLocation: string, coordinates: { latitude: number; longitude: number }, activityStatus?: string) => void;
  user: any;
}

export default function ActivityDetailsModal({
  visible,
  activity,
  onClose,
  onUpdate,
  onNavigateToMap,
  user
}: ActivityDetailsModalProps) {
  const { completeActivity, loading } = useNotifications();
  const { binData, isGPSValid } = useRealTimeData();
  const [completionNotes, setCompletionNotes] = useState('');
  const [binCondition, setBinCondition] = useState<'good' | 'damaged' | 'needs_repair'>('good');
  const [collectedWeight, setCollectedWeight] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showMapRoute, setShowMapRoute] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible && activity) {
      setCompletionNotes(activity.completion_notes || '');
      setBinCondition((activity.bin_condition as 'good' | 'damaged' | 'needs_repair') || 'good');
      setCollectedWeight(activity.collected_weight?.toString() || '');
      setPhotos(activity.photos || []);
      setPhotoUrls(activity.photos || []);
    }
  }, [visible, activity]);

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (imageUri: string): Promise<string | null> => {
    try {
      setUploading(true);
      
      const data = new FormData();
      data.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `activity_${Date.now()}.jpg`,
      } as any);
      data.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      data.append('cloud_name', CLOUDINARY_CONFIG.cloudName);

      const response = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      
      if (result.secure_url) {
        console.log('Uploaded URL:', result.secure_url);
        return result.secure_url;
      } else {
        console.error('Upload failed:', result);
        return null;
      }
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false, // We don't need base64 since we're uploading to Cloudinary
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Add to photos array for preview
        setPhotos(prev => [...prev, imageUri]);
        
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadImageToCloudinary(imageUri);
        if (cloudinaryUrl) {
          setPhotoUrls(prev => [...prev, cloudinaryUrl]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCameraCapture = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false, // We don't need base64 since we're uploading to Cloudinary
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Add to photos array for preview
        setPhotos(prev => [...prev, imageUri]);
        
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadImageToCloudinary(imageUri);
        if (cloudinaryUrl) {
          setPhotoUrls(prev => [...prev, cloudinaryUrl]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Get bin coordinates using real-time data with fallback
  const getBinCoordinates = (binLocation: string, binId: string) => {
    try {
      console.log('[ActivityDetailsModal] Getting coordinates for:', { binLocation, binId });
      console.log('[ActivityDetailsModal] Real-time bin data:', binData);
      console.log('[ActivityDetailsModal] GPS valid:', isGPSValid());

      // First priority: Use real-time GPS coordinates if available and valid
      if (binData && isGPSValid() && binData.latitude && binData.longitude) {
        console.log('[ActivityDetailsModal] Using real-time GPS coordinates:', {
          latitude: binData.latitude,
          longitude: binData.longitude,
          gps_valid: binData.gps_valid,
          satellites: binData.satellites
        });
        return {
          latitude: binData.latitude,
          longitude: binData.longitude,
        };
      }

      // Second priority: Use backup GPS coordinates if available
      if (binData && binData.backup_latitude && binData.backup_longitude) {
        console.log('[ActivityDetailsModal] Using backup GPS coordinates:', {
          latitude: binData.backup_latitude,
          longitude: binData.backup_longitude,
          backup_source: binData.backup_source,
          backup_timestamp: binData.backup_timestamp
        });
        return {
          latitude: binData.backup_latitude,
          longitude: binData.backup_longitude,
        };
      }

      // Fallback: Use mock coordinates based on location name
      console.log('[ActivityDetailsModal] No real-time data available, using mock coordinates');
      const mockCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
        'Central Plaza': { latitude: 10.243723, longitude: 123.787124 }, // Updated to match Firebase backup coordinates
        'Office Complex': { latitude: 10.244723, longitude: 123.786124 },
        'Residential Area': { latitude: 10.242723, longitude: 123.788124 },
        'Shopping Mall': { latitude: 10.245723, longitude: 123.785124 },
        'Park Entrance': { latitude: 10.241723, longitude: 123.789124 },
      };

      // Try to find coordinates by location name
      const locationKey = Object.keys(mockCoordinates).find(key => 
        binLocation.toLowerCase().includes(key.toLowerCase())
      );

      if (locationKey) {
        console.log('[ActivityDetailsModal] Found mock coordinates for:', locationKey);
        return mockCoordinates[locationKey];
      }

      // Final fallback: generate coordinates based on bin ID
      const baseLat = 10.243723; // Updated to match Firebase backup coordinates
      const baseLng = 123.787124;
      const binNumber = parseInt(binId.replace(/\D/g, '')) || 1;
      
      const fallbackCoords = {
        latitude: baseLat + (binNumber * 0.001),
        longitude: baseLng + (binNumber * 0.001),
      };
      
      console.log('[ActivityDetailsModal] Using fallback coordinates:', fallbackCoords);
      return fallbackCoords;
    } catch (error) {
      console.error('[ActivityDetailsModal] Error getting bin coordinates:', error);
      // Default coordinates (Cebu)
      return {
        latitude: 10.243723,
        longitude: 123.787124,
      };
    }
  };

  const handleShowRoute = () => {
    if (activity) {
      // Check if activity is completed - don't show route for completed activities
      if (activity.status === 'done') {
        Alert.alert(
          'Task Completed', 
          'This task has already been completed. No route navigation available.',
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        console.log('[ActivityDetailsModal] Showing route for activity:', activity.id);
        console.log('[ActivityDetailsModal] Bin location:', activity.bin_location);
        console.log('[ActivityDetailsModal] Bin ID:', activity.bin_id);
        
        const coordinates = getBinCoordinates(activity.bin_location, activity.bin_id);
        console.log('[ActivityDetailsModal] Bin coordinates:', coordinates);
        
        // Close the modal first
        onClose();
        
        // Navigate to map tab with route parameters
        if (onNavigateToMap) {
          onNavigateToMap(activity.bin_id, activity.bin_location, coordinates, activity.status);
        }
      } catch (error) {
        console.error('[ActivityDetailsModal] Error showing route:', error);
        Alert.alert('Error', 'Failed to show route. Please try again.');
      }
    }
  };

  const handleUpdateActivity = async () => {
    if (!activity || !user) return;

    try {
      // Parse weight as number, default to 0 if empty or invalid
      const weight = collectedWeight ? parseFloat(collectedWeight) : 0;
      
      const result = await completeActivity(
        activity.id,
        completionNotes,
        binCondition,
        photoUrls,
        user.id,
        user.fullName || user.name || 'Janitor',
        weight || undefined // Only pass weight if it's a valid number
      );

      if (result.success) {
        Alert.alert('Success', result.message || 'Activity completed successfully!');
        
        // Notify map to clear route since activity is now completed
        if (onNavigateToMap) {
          onNavigateToMap(activity.bin_id, activity.bin_location, getBinCoordinates(activity.bin_location, activity.bin_id), 'done');
        }
        
        onUpdate();
        onClose();
      } else {
        Alert.alert('Error', result.message || 'Failed to complete activity');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete activity');
    }
  };

  const formatActivityMessage = (log: ActivityLog) => {
    const messages: { [key: string]: string } = {
      task_assignment: `Assigned task for bin ${log.bin_id}`,
      collection: `Collected from bin ${log.bin_id}`,
      maintenance: `Maintenance on bin ${log.bin_id}`,
      bin_collection: `Bin collection at ${log.bin_location}`,
      bin_emptied: `Bin ${log.bin_id} emptied`
    };
    return messages[log.activity_type] || `Activity for bin ${log.bin_id}`;
  };

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'done':
        return { backgroundColor: '#4caf50', color: '#fff' };
      case 'in_progress':
        return { backgroundColor: '#ff9800', color: '#fff' };
      case 'pending':
        return { backgroundColor: '#2196f3', color: '#fff' };
      default:
        return { backgroundColor: '#666', color: '#fff' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#f44336';
      case 'high':
        return '#ff9800';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#4caf50';
      default:
        return '#666';
    }
  };

  if (!activity) return null;

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Activity Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Activity:</Text>
                <Text style={styles.infoValue}>{formatActivityMessage(activity)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bin ID:</Text>
                <Text style={styles.infoValue}>{activity.bin_id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{activity.bin_location}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fill Level:</Text>
                <Text style={styles.infoValue}>{activity.bin_level}%</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Priority:</Text>
                <View style={styles.priorityContainer}>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(activity.priority) }]} />
                  <Text style={[styles.priorityText, { color: getPriorityColor(activity.priority) }]}>
                    {activity.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getBadgeStyle(activity.status).backgroundColor }]}>
                  <Text style={[styles.statusText, { color: getBadgeStyle(activity.status).color }]}>
                    {activity.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created:</Text>
                <Text style={styles.infoValue}>{formatActivityTime(activity.created_at)}</Text>
              </View>
              {activity.task_note && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Notes:</Text>
                  <Text style={styles.infoValue}>{activity.task_note}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Map Display Section */}
          <View style={styles.section}>
            <View style={styles.mapSectionHeader}>
              <Text style={styles.sectionTitle}>📍 Bin Location</Text>
              <View style={[
                styles.mapStatusBadge, 
                { backgroundColor: binData && isGPSValid() ? '#4caf50' : binData && binData.backup_latitude ? '#ff9800' : '#666' }
              ]}>
                <Text style={styles.mapStatusText}>
                  {binData && isGPSValid() ? 'GPS LIVE' : binData && binData.backup_latitude ? 'GPS BACKUP' : 'OFFLINE'}
                </Text>
              </View>
            </View>
            
            <View style={styles.mapCard}>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  mapType="satellite"
                  initialRegion={{
                    latitude: getBinCoordinates(activity.bin_location, activity.bin_id).latitude,
                    longitude: getBinCoordinates(activity.bin_location, activity.bin_id).longitude,
                    latitudeDelta: 0.003,
                    longitudeDelta: 0.003,
                  }}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                  showsCompass={false}
                  showsScale={false}
                  showsBuildings={true}
                  showsTraffic={false}
                  showsIndoors={false}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  loadingEnabled={true}
                  loadingIndicatorColor="#2e7d32"
                  loadingBackgroundColor="#f8f8f8"
                >
                  <Marker
                    coordinate={getBinCoordinates(activity.bin_location, activity.bin_id)}
                    title={`Bin ${activity.bin_id}`}
                    description={activity.bin_location}
                  >
                    <View style={styles.cleanMarker}>
                      <View style={[styles.cleanMarkerCircle, { 
                        backgroundColor: activity.bin_level > 80 ? '#f44336' : 
                                        activity.bin_level > 50 ? '#ff9800' : '#4caf50' 
                      }]}>
                        <Text style={styles.cleanMarkerText}>{activity.bin_level}%</Text>
                      </View>
                    </View>
                  </Marker>
                </MapView>
                
                {/* Map Overlay with Location Info */}
                <View style={styles.mapOverlay}>
                  <View style={styles.mapLocationInfo}>
                    <View style={styles.mapLocationRow}>
                      <View style={styles.mapLocationIcon}>
                        <Text style={styles.mapLocationIconText}>🗑️</Text>
                      </View>
                      <View style={styles.mapLocationDetails}>
                        <Text style={styles.mapLocationTitle}>Bin {activity.bin_id}</Text>
                        <Text style={styles.mapLocationAddress}>{activity.bin_location}</Text>
                        {/* GPS Status Info */}
                        {binData && (
                          <Text style={styles.mapGPSStatus}>
                            📡 {binData && isGPSValid() ? 
                              `GPS Live (${binData.satellites} satellites)` : 
                              binData && binData.backup_latitude ? 
                              'GPS Backup' : 
                              'GPS Offline'
                            }
                          </Text>
                        )}
                      </View>
                      <View style={styles.mapLocationStatus}>
                        <View style={[styles.mapFillIndicator, { 
                          backgroundColor: activity.bin_level > 80 ? '#f44336' : 
                                          activity.bin_level > 50 ? '#ff9800' : '#4caf50' 
                        }]} />
                        <Text style={styles.mapFillText}>{activity.bin_level}%</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Map Actions */}
              <View style={styles.mapActions}>
                <TouchableOpacity 
                  style={[
                    styles.mapActionButton, 
                    activity.status === 'done' && styles.mapActionButtonDisabled
                  ]} 
                  onPress={handleShowRoute}
                  disabled={activity.status === 'done'}
                >
                  <Text style={styles.mapActionIcon}>🧭</Text>
                  <Text style={[
                    styles.mapActionText,
                    activity.status === 'done' && styles.mapActionTextDisabled
                  ]}>
                    {activity.status === 'done' ? 'Task Completed' : 'Get Directions'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.mapActionDivider} />
                <TouchableOpacity style={styles.mapActionButton}>
                  <Text style={styles.mapActionIcon}>📍</Text>
                  <Text style={styles.mapActionText}>Share Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

            {/* Show different content based on task status */}
            {activity.status === 'pending' ? (
              /* Pending Task - Show Route and Accept Options */
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Task Assignment</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <View style={styles.readOnlyContainer}>
                    <Text style={styles.readOnlyText}>
                      📍 {activity.bin_location}
                    </Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bin Details</Text>
                  <View style={styles.readOnlyContainer}>
                    <Text style={styles.readOnlyText}>
                      Bin ID: {activity.bin_id} • Fill Level: {activity.bin_level}%
                    </Text>
                  </View>
                </View>

                {activity.task_note && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Task Notes</Text>
                    <View style={styles.readOnlyContainer}>
                      <Text style={styles.readOnlyText}>{activity.task_note}</Text>
                    </View>
                  </View>
                )}

                {/* Route Button */}
                <TouchableOpacity style={styles.routeButton} onPress={handleShowRoute}>
                  <Text style={styles.routeButtonText}>🗺️ Show Route to Bin</Text>
                </TouchableOpacity>

                {/* Accept Task Button */}
                <TouchableOpacity 
                  style={styles.acceptTaskButton} 
                  onPress={() => {
                    Alert.alert(
                      'Accept Task',
                      'Do you want to accept this task? You can start working on it immediately.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Accept', 
                          onPress: () => {
                            // Here you would call an accept task function
                            Alert.alert('Task Accepted', 'You can now start working on this task.');
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.acceptTaskButtonText}>✅ Accept Task</Text>
                </TouchableOpacity>
              </View>
            ) : activity.status === 'done' ? (
              /* Completed Task Details - Read Only */
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Task Details</Text>
                
                {/* Completion Notes - Read Only */}
                {activity.completion_notes && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Completion Notes</Text>
                    <View style={styles.readOnlyContainer}>
                      <Text style={styles.readOnlyText}>{activity.completion_notes}</Text>
                    </View>
                  </View>
                )}

                {/* Collected Weight - Read Only */}
                {activity.collected_weight && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Collected Weight</Text>
                    <View style={styles.readOnlyContainer}>
                      <Text style={styles.readOnlyText}>{activity.collected_weight} kg</Text>
                    </View>
                  </View>
                )}

                {/* Bin Condition - Read Only */}
                {activity.bin_condition && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Bin Condition</Text>
                    <View style={styles.readOnlyContainer}>
                      <Text style={styles.readOnlyText}>
                        {activity.bin_condition.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Evidence Photos - Read Only */}
                {activity.photos && activity.photos.length > 0 && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Evidence Photos</Text>
                    <View style={styles.photosContainer}>
                      {activity.photos.map((photo, index) => (
                        <View key={index} style={styles.photoItem}>
                          <Image source={{ uri: photo }} style={styles.photoPreview} />
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Completion Info */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Completed By</Text>
                  <View style={styles.readOnlyContainer}>
                    <Text style={styles.readOnlyText}>
                      {activity.user_name || activity.assigned_janitor_name || 'Unknown'}
                    </Text>
                  </View>
                </View>

                {activity.collection_time && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Completed At</Text>
                    <View style={styles.readOnlyContainer}>
                      <Text style={styles.readOnlyText}>
                        {formatActivityTime(activity.collection_time)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              /* Incomplete Task - Editable Form */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Complete Activity</Text>
            
            {/* Completion Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Completion Notes *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Describe what was done..."
                value={completionNotes}
                onChangeText={setCompletionNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

                {/* Collected Weight */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Collected Weight (kg)</Text>
                  <TextInput
                    style={styles.weightInput}
                    placeholder="Enter weight of collected waste..."
                    value={collectedWeight}
                    onChangeText={setCollectedWeight}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                </View>

            {/* Bin Condition */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bin Condition</Text>
              <View style={styles.conditionButtons}>
                {(['good', 'damaged', 'needs_repair'] as const).map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.conditionButton,
                      binCondition === condition && styles.conditionButtonActive
                    ]}
                    onPress={() => setBinCondition(condition)}
                  >
                    <Text style={[
                      styles.conditionButtonText,
                      binCondition === condition && styles.conditionButtonTextActive
                    ]}>
                      {condition.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Photo Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Evidence Photos</Text>
              
              {/* Photo Upload Buttons */}
              <View style={styles.photoButtons}>
                <TouchableOpacity
                  style={[styles.photoButton, uploading && styles.photoButtonDisabled]}
                  onPress={handleCameraCapture}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#666" />
                  ) : (
                    <Text style={styles.photoButtonText}>📷 Take Photo</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoButton, uploading && styles.photoButtonDisabled]}
                  onPress={handleImagePicker}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#666" />
                  ) : (
                    <Text style={styles.photoButtonText}>🖼️ Choose Photo</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Photo Preview */}
              {photos.length > 0 && (
                <View style={styles.photosContainer}>
                  {photos.map((photo, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image source={{ uri: photo }} style={styles.photoPreview} />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <Text style={styles.removePhotoText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
            )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
            {activity.status === 'pending' ? (
              /* Pending Task - Close Button Only */
              <TouchableOpacity
                style={[styles.actionButton, styles.closeButtonFull]}
                onPress={onClose}
              >
                <Text style={styles.closeButtonFullText}>Close</Text>
              </TouchableOpacity>
            ) : activity.status === 'done' ? (
              /* Completed Task - Only Close Button */
              <TouchableOpacity
                style={[styles.actionButton, styles.closeButtonFull]}
                onPress={onClose}
              >
                <Text style={styles.closeButtonFullText}>Close</Text>
              </TouchableOpacity>
            ) : (
              /* Incomplete Task - Cancel and Complete Buttons */
              <>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.submitButton]}
            onPress={handleUpdateActivity}
            disabled={loading || !completionNotes.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Complete Task</Text>
            )}
          </TouchableOpacity>
              </>
            )}
        </View>
      </View>
    </Modal>

      {/* Map Route Modal - Separate from main modal */}
      {showMapRoute && activity && (
        <Modal
          visible={showMapRoute}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowMapRoute(false)}
        >
          <MapRoute
            destination={{
              latitude: getBinCoordinates(activity.bin_location, activity.bin_id).latitude,
              longitude: getBinCoordinates(activity.bin_location, activity.bin_id).longitude,
              title: `Bin ${activity.bin_id}`,
              address: activity.bin_location,
            }}
            onClose={() => setShowMapRoute(false)}
          />
        </Modal>
      )}
    </>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 30,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 80,
  },
  weightInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 48,
  },
  conditionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  conditionButtonActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  conditionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  conditionButtonTextActive: {
    color: '#fff',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  photoButtonDisabled: {
    opacity: 0.5,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoItem: {
    position: 'relative',
  },
  photoPreview: {
    width: (width - 60) / 3,
    height: (width - 60) / 3,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#f44336',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#2e7d32',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  readOnlyContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 44,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  closeButtonFull: {
    flex: 1,
    backgroundColor: '#666',
    marginHorizontal: 0,
  },
  closeButtonFullText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  routeButton: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  routeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptTaskButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  acceptTaskButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapStatusBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mapStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  mapContainer: {
    height: 220,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  mapLocationInfo: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapLocationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mapLocationIconText: {
    fontSize: 16,
  },
  mapLocationDetails: {
    flex: 1,
  },
  mapLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  mapLocationAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  mapGPSStatus: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },
  mapLocationStatus: {
    alignItems: 'center',
    marginLeft: 8,
  },
  mapFillIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  mapFillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  mapActions: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mapActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  mapActionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  mapActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2e7d32',
  },
  mapActionButtonDisabled: {
    opacity: 0.5,
  },
  mapActionTextDisabled: {
    color: '#999',
  },
  mapActionDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  cleanMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleanMarkerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cleanMarkerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
