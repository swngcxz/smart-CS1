import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar, Modal, ScrollView, Alert } from "react-native";

import { useRouter, useLocalSearchParams } from "expo-router";
import MapView, { Callout, Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { ProgressBar } from "react-native-paper";
import * as Location from 'expo-location';
import { useRealTimeData, getFillColor, getStatusColor } from "@/hooks/useRealTimeData";
import { LocationUtils, LocationPoint } from "@/utils/locationUtils";
import { voiceNavigation } from "@/utils/voiceNavigation";

type Bin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  percentage: number;
  location: string;
  lastCollectedBy: string;
  lastCollectedDate: string;
  gpsValid?: boolean;
  coordinatesSource?: string;
  locationSource?: string;
};

// Dynamic bin data - will be populated from API or real-time data
const bins: Bin[] = [];

export default function MapScreen() {
  const [region, setRegion] = useState({
    latitude: 10.2098,
    longitude: 123.758,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationPoint | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LocationPoint[]>([]);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [targetBin, setTargetBin] = useState<Bin | null>(null);
  const [travelMode, setTravelMode] = useState<'walking' | 'driving'>('driving');
  const [currentUserLocation, setCurrentUserLocation] = useState<LocationPoint | null>(null);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [arrivalDetected, setArrivalDetected] = useState(false);
  const [proximityThreshold] = useState(50); // 50 meters proximity threshold
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();

  // Real-time data hook
  const { 
    binData, 
    loading: realTimeLoading, 
    error: realTimeError, 
    lastUpdate: realTimeLastUpdate,
    isGPSValid,
    getCurrentGPSLocation
  } = useRealTimeData();

  // Update region when real-time data is available (GPS live or backup)
  useEffect(() => {
    if (binData) {
      const realTimeMarkers = getRealTimeMarkers();
      if (realTimeMarkers.length > 0) {
        const marker = realTimeMarkers[0];
        setRegion({
          latitude: marker.latitude,
          longitude: marker.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    }
  }, [binData]);

  // Update last update time
  useEffect(() => {
    if (realTimeLastUpdate) {
      setLastUpdate(new Date(realTimeLastUpdate).toLocaleTimeString());
    }
  }, [realTimeLastUpdate]);

  // Handle navigation from activity logs
  useEffect(() => {
    if (params.navigateToBin === 'true' && params.binId && params.latitude && params.longitude) {
      const bin: Bin = {
        id: params.binId as string,
        name: `Bin ${params.binId}`,
        latitude: parseFloat(params.latitude as string),
        longitude: parseFloat(params.longitude as string),
        percentage: 0, // Will be updated from real-time data
        location: params.binLocation as string || 'Unknown Location',
        lastCollectedBy: 'System',
        lastCollectedDate: new Date().toISOString().split('T')[0],
      };
      
      setTargetBin(bin);
      handleGetDirections(bin);
      
      // Clear the params to prevent re-triggering
      router.replace('/(tabs)/map');
    }
  }, [params]);

  // Clear route when activity status changes to completed
  useEffect(() => {
    if (params.activityStatus === 'done' && params.binId) {
      // Clear the current route if the activity is completed
      setTargetBin(null);
      setRouteCoordinates([]);
      setRouteDistance(null);
      setRouteDuration(null);
      setIsNavigating(false);
      
      // Clear the params
      router.replace('/(tabs)/map');
    }
  }, [params.activityStatus, params.binId]);

  // Function to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Function to start location tracking
  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required for arrival detection.');
        return;
      }

      setIsLocationTracking(true);
      
      // Start watching position
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const newLocation: LocationPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          // Store previous distance for comparison
          const previousDistance = currentUserLocation ? calculateDistance(
            currentUserLocation.latitude,
            currentUserLocation.longitude,
            targetBin.latitude,
            targetBin.longitude
          ) : 0;
          
          setCurrentUserLocation(newLocation);
          
          // Check proximity to target bin
          if (targetBin && !arrivalDetected) {
            const distance = calculateDistance(
              newLocation.latitude,
              newLocation.longitude,
              targetBin.latitude,
              targetBin.longitude
            );
            
            console.log(`Distance to bin: ${distance.toFixed(2)} meters`);
            
            // Announce distance updates with voice navigation
            if (previousDistance > 0) {
              const distanceDiff = Math.abs(previousDistance - distance);
              if (distanceDiff > 10) { // Only announce if significant distance change
                voiceNavigation.announceDistanceUpdate(distance, targetBin.location);
              }
            }
            
            if (distance <= proximityThreshold) {
              setArrivalDetected(true);
              voiceNavigation.announceArrival(targetBin.location);
              handleArrivalAtBin();
            }
          }
        }
      );

      return locationSubscription;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsLocationTracking(false);
    }
  };

  // Function to handle arrival at bin location
  const handleArrivalAtBin = () => {
    if (!targetBin) return;

    Alert.alert(
      'Arrived at Destination! 🎉',
      `You have arrived at ${targetBin.location} (Bin ${targetBin.id}). Would you like to open the activity details?`,
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => {
            setArrivalDetected(false);
          }
        },
        {
          text: 'Open Activity',
          onPress: () => {
            // Navigate back to activity logs with the specific activity
            router.push({
              pathname: '/(tabs)/activitylogs',
              params: {
                openActivityId: targetBin.id,
                binLocation: targetBin.location
              }
            });
            setArrivalDetected(false);
          }
        }
      ]
    );
  };

  // Initialize voice navigation settings
  useEffect(() => {
    const initializeVoiceNavigation = async () => {
      const settings = voiceNavigation.getSettings();
      setVoiceEnabled(settings.enabled);
      
      // Preload common phrases for better performance
      await voiceNavigation.preloadCommonPhrases();
    };
    
    initializeVoiceNavigation();
  }, []);

  // Start location tracking when target bin is set
  useEffect(() => {
    if (targetBin && !isLocationTracking) {
      startLocationTracking();
    } else if (!targetBin && isLocationTracking) {
      setIsLocationTracking(false);
      setArrivalDetected(false);
    }
  }, [targetBin]);

  // Voice control functions
  const toggleVoiceNavigation = async () => {
    const newVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(newVoiceEnabled);
    await voiceNavigation.saveSettings({ enabled: newVoiceEnabled });
    
    if (newVoiceEnabled) {
      await voiceNavigation.speak('Voice navigation enabled');
    } else {
      await voiceNavigation.stopSpeaking();
      await voiceNavigation.speak('Voice navigation disabled');
    }
  };

  const repeatLastInstruction = async () => {
    if (targetBin && currentUserLocation) {
      const distance = calculateDistance(
        currentUserLocation.latitude,
        currentUserLocation.longitude,
        targetBin.latitude,
        targetBin.longitude
      );
      await voiceNavigation.announceDistanceUpdate(distance, targetBin.location);
    }
  };

  // Convert real-time data to map markers with GPS fallback logic
  const getRealTimeMarkers = (): Bin[] => {
    if (!binData) return [];
    
    const level = binData.bin_level || binData.weight_percent || 0;
    const status = level >= 85 ? 'critical' : level >= 70 ? 'warning' : 'normal';
    
    // Determine coordinates source and validity
    const isGPSOnline = binData.gps_valid && binData.latitude !== 0 && binData.longitude !== 0;
    const coordinatesSource = (isGPSOnline ? 'gps_live' : 'gps_backup');
    
    // Use backup coordinates if GPS is offline/invalid
    let latitude, longitude, locationSource;
    if (isGPSOnline) {
      latitude = binData.latitude;
      longitude = binData.longitude;
      locationSource = 'GPS Live';
    } else {
      // Use Firebase backup coordinates when GPS is invalid
      latitude = binData.backup_latitude || 10.243723; // Firebase backup coordinates
      longitude = binData.backup_longitude || 123.787124;
      locationSource = 'GPS Backup';
    }
    
    return [{
      id: binData.bin_id || 'bin1',
      name: binData.name || 'Smart Bin',
      latitude: latitude,
      longitude: longitude,
      percentage: level,
      location: binData.mainLocation || 'Central Plaza',
      lastCollectedBy: 'System',
      lastCollectedDate: new Date(binData.timestamp).toISOString().split('T')[0],
      // Add metadata for display
      gpsValid: isGPSOnline,
      coordinatesSource: coordinatesSource,
      locationSource: locationSource,
    }];
  };

  const handleMarkerPress = (bin: Bin) => {
    setSelectedBin(bin);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedBin(null);
  };

  const handleViewDetails = (binId: string) => {
    router.push({
      pathname: "/home/bin-details",
      params: { binId },
    });
  };

  // Get directions to bin
  const handleGetDirections = async (bin: Bin) => {
    try {
      setIsCalculatingRoute(true);
      setIsNavigating(true);
      
      // Get user's current location
      const locationResult = await LocationUtils.getCurrentLocation();
      
      if (locationResult.success && locationResult.location) {
        setUserLocation(locationResult.location);
        
        // Calculate route
        const distance = LocationUtils.calculateDistance(
          locationResult.location,
          { latitude: bin.latitude, longitude: bin.longitude }
        );
        
        setRouteDistance(distance);
        setRouteDuration(LocationUtils.estimateDuration(distance, travelMode));
        
        // Create route coordinates (straight line for now)
        setRouteCoordinates([locationResult.location, { latitude: bin.latitude, longitude: bin.longitude }]);
        
        // Update map region to show both locations
        const midLat = (locationResult.location.latitude + bin.latitude) / 2;
        const midLng = (locationResult.location.longitude + bin.longitude) / 2;
        
        setRegion({
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: Math.abs(locationResult.location.latitude - bin.latitude) * 1.5,
          longitudeDelta: Math.abs(locationResult.location.longitude - bin.longitude) * 1.5,
        });
        
        // Close modal
        setModalVisible(false);
        setSelectedBin(null);

        // Announce route start with voice navigation
        await voiceNavigation.announceRouteStart(bin.location, distance);
        
        if (locationResult.isUsingFallback) {
          await voiceNavigation.announceOfflineMode();
          Alert.alert(
            'Using Approximate Location',
            'Unable to get your exact location. Using approximate location for route calculation.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Location Unavailable',
          'Unable to get your current location. Please enable location services.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      Alert.alert(
        'Error',
        'Failed to get directions. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Stop navigation
  const handleStopNavigation = () => {
    setIsNavigating(false);
    setRouteCoordinates([]);
    setRouteDistance(null);
    setRouteDuration(null);
    setUserLocation(null);
    setTargetBin(null);
  };

  // Handle travel mode change
  const handleTravelModeChange = (mode: 'walking' | 'driving') => {
    setTravelMode(mode);
    // Recalculate route with new mode if currently navigating
    if (isNavigating && targetBin && userLocation) {
      const distance = LocationUtils.calculateDistance(userLocation, targetBin);
      setRouteDistance(distance);
      setRouteDuration(LocationUtils.estimateDuration(distance, mode));
    }
  };

  // const handleOpenStreetView = async (latitude: number, longitude: number) => {
  //   const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;
  //   const supported = await Linking.canOpenURL(url);
  //   if (supported) {
  //     await Linking.openURL(url);
  //   } else {
  //     alert("Cannot open Google Maps. Please check your device settings.");
  //   }
  // };
  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  // Get real-time markers
  const realTimeMarkers = getRealTimeMarkers();
  const allBins = [...bins, ...realTimeMarkers];

  const filteredBins = allBins.filter((bin) => {
    const matchesSearch =
      bin.name.toLowerCase().includes(search.toLowerCase()) ||
      bin.location.toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (filter === "<50") matchesFilter = bin.percentage < 50;
    else if (filter === "50-75") matchesFilter = bin.percentage >= 50 && bin.percentage <= 75;
    else if (filter === ">75") matchesFilter = bin.percentage > 75;

    return matchesSearch && matchesFilter;
  });

  // Calculate status counts from real-time data
  const normalCount = allBins.filter(bin => bin.percentage < 50).length;
  const warningCount = allBins.filter(bin => bin.percentage >= 50 && bin.percentage <= 75).length;
  const criticalCount = allBins.filter(bin => bin.percentage > 75).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Google-style Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
      <TextInput
            style={styles.searchInput}
        placeholder="Search bins or locations..."
        value={search}
        onChangeText={setSearch}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      {/* Route Information Display */}
      {isNavigating && (
        <View style={styles.routeInfoContainer}>
          <View style={styles.routeInfoHeader}>
            <Text style={styles.routeInfoTitle}>Route to Bin</Text>
            <TouchableOpacity onPress={handleStopNavigation} style={styles.stopNavigationButton}>
              <Text style={styles.stopNavigationText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.routeInfoContent}>
            <View style={styles.routeInfoItem}>
              <Text style={styles.routeInfoLabel}>Distance:</Text>
              <Text style={styles.routeInfoValue}>
                {routeDistance ? LocationUtils.formatDistance(routeDistance) : 'Calculating...'}
              </Text>
            </View>
            <View style={styles.routeInfoItem}>
              <Text style={styles.routeInfoLabel}>Duration:</Text>
              <Text style={styles.routeInfoValue}>
                {routeDuration || 'Calculating...'}
              </Text>
            </View>
          </View>
          {/* Travel Mode Selector */}
          <View style={styles.travelModeContainer}>
            <TouchableOpacity
              style={[
                styles.travelModeButton,
                travelMode === 'driving' && styles.travelModeButtonActive
              ]}
              onPress={() => handleTravelModeChange('driving')}
            >
              <Text style={[
                styles.travelModeText,
                travelMode === 'driving' && styles.travelModeTextActive
              ]}>
                🚗 Driving
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.travelModeButton,
                travelMode === 'walking' && styles.travelModeButtonActive
              ]}
              onPress={() => handleTravelModeChange('walking')}
            >
              <Text style={[
                styles.travelModeText,
                travelMode === 'walking' && styles.travelModeTextActive
              ]}>
                🚶 Walking
              </Text>
            </TouchableOpacity>
          </View>

          {/* Voice Controls */}
          <View style={styles.voiceControlsContainer}>
            <TouchableOpacity
              style={[styles.voiceControlButton, voiceEnabled && styles.voiceControlButtonActive]}
              onPress={toggleVoiceNavigation}
            >
              <Text style={[styles.voiceControlText, voiceEnabled && styles.voiceControlTextActive]}>
                {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.voiceControlButton}
              onPress={repeatLastInstruction}
            >
              <Text style={styles.voiceControlText}>
                🔁 Repeat
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Arrival Notification - Small overlay */}
      {arrivalDetected && (
        <View style={styles.arrivalNotification}>
          <Text style={styles.arrivalNotificationText}>
            🎉 Arrived at destination!
          </Text>
        </View>
      )}

      {/* Category Buttons */}
      {!isNavigating && (
        <View style={styles.categoryContainer}>
          <TouchableOpacity style={styles.categoryButton}>
            <View style={[styles.statusBullet, { backgroundColor: '#4caf50' }]} />
            <Text style={styles.categoryText}>Normal ({normalCount})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryButton}>
            <View style={[styles.statusBullet, { backgroundColor: '#ff9800' }]} />
            <Text style={styles.categoryText}>Warning ({warningCount})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryButton}>
            <View style={[styles.statusBullet, { backgroundColor: '#f44336' }]} />
            <Text style={styles.categoryText}>Critical ({criticalCount})</Text>
            </TouchableOpacity>
        </View>
      )}
      

      {/* Map */}
      <MapView 
        style={StyleSheet.absoluteFillObject} 
        region={region}
        mapType="satellite"
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={false}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={false}
        provider={PROVIDER_GOOGLE}
      >
        {/* Route Polyline */}
        {isNavigating && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2e7d32"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        )}

        {/* Distance Marker on Route */}
        {isNavigating && targetBin && currentUserLocation && (
          <Marker
            coordinate={{
              latitude: (currentUserLocation.latitude + targetBin.latitude) / 2,
              longitude: (currentUserLocation.longitude + targetBin.longitude) / 2,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.distanceMarker}>
              <Text style={styles.distanceMarkerText}>
                {calculateDistance(
                  currentUserLocation.latitude,
                  currentUserLocation.longitude,
                  targetBin.latitude,
                  targetBin.longitude
                ).toFixed(0)}m
              </Text>
            </View>
          </Marker>
        )}

        {/* User Location Marker */}
        {isNavigating && userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="Current position"
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationCircle}>
                <Text style={styles.userLocationText}>📍</Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Bin Markers */}
        {filteredBins.map((bin) => (
          <Marker 
            key={bin.id} 
            coordinate={{ latitude: bin.latitude, longitude: bin.longitude }}
            onPress={() => handleMarkerPress(bin)}
          >
            <View style={[
              styles.locationMarker, 
              { 
                backgroundColor: getFillColor(bin.percentage),
                borderColor: isNavigating ? '#2e7d32' : 'white'
              }
            ]}>
              <Text style={styles.markerText}>{bin.percentage}%</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Location Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedBin && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedBin.name}</Text>
                  <View style={styles.modalHeaderButtons}>
                    <TouchableOpacity 
                      style={styles.directionsButton}
                      onPress={() => handleGetDirections(selectedBin)}
                      disabled={isCalculatingRoute}
                    >
                      <Text style={styles.directionsButtonText}>
                        {isCalculatingRoute ? 'Calculating...' : '🧭 Get Directions'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editButton}>
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Fill Level Section */}
                <View style={styles.fillLevelSection}>
                  <Text style={styles.fillLevelLabel}>Fill Level</Text>
                  <View style={styles.fillLevelContainer}>
                    <Text style={styles.fillLevelPercentage}>{selectedBin.percentage}%</Text>
                <ProgressBar
                      progress={selectedBin.percentage / 100}
                      style={styles.modalProgressBar}
                      color={getFillColor(selectedBin.percentage)}
                    />
                  </View>
                </View>

                {/* Status Section */}
                <View style={styles.statusSection}>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Last Collection:</Text>
                    <Text style={styles.statusValue}>Active 55y ago</Text>
                  </View>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>GPS:</Text>
                    <View style={styles.gpsStatusContainer}>
                      <View style={[styles.gpsStatusDot, { backgroundColor: selectedBin.gpsValid ? '#4caf50' : '#f44336' }]} />
                      <Text style={[styles.gpsStatusText, { color: selectedBin.gpsValid ? '#4caf50' : '#f44336' }]}>
                        {selectedBin.gpsValid ? 'Valid' : 'Invalid'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Time Logs Section */}
                <View style={styles.timeLogsSection}>
                  <Text style={styles.timeLogsTitle}>Time Logs</Text>
                  <ScrollView style={styles.timeLogsContainer}>
                    <View style={styles.timeLogRow}>
                      <Text style={styles.timeLogLabel}>Last Update:</Text>
                      <Text style={styles.timeLogValue}>Active 55y ago</Text>
                    </View>
                    <View style={styles.timeLogRow}>
                      <Text style={styles.timeLogLabel}>GPS Status:</Text>
                      <Text style={[styles.timeLogValue, { color: selectedBin.gpsValid ? '#4caf50' : '#f44336' }]}>
                        {selectedBin.gpsValid ? 'GPS Live' : 'No GPS'}
                      </Text>
                    </View>
                    <View style={styles.timeLogRow}>
                      <Text style={styles.timeLogLabel}>Bin Active:</Text>
                      <Text style={styles.timeLogValue}>2025-10-08 01:00:00</Text>
                    </View>
                    {realTimeMarkers.some(rtBin => rtBin.id === selectedBin.id) && (
                      <>
                        <View style={styles.timeLogRow}>
                          <Text style={styles.timeLogLabel}>Coordinates Source:</Text>
                          <Text style={styles.timeLogValue}>{selectedBin.coordinatesSource}</Text>
                        </View>
                        <View style={styles.timeLogRow}>
                          <Text style={styles.timeLogLabel}>Location Source:</Text>
                          <Text style={styles.timeLogValue}>{selectedBin.locationSource}</Text>
                        </View>
                      </>
                    )}
                  </ScrollView>
                </View>
              </>
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
  },
  
  // Google-style Search Bar
  searchBarContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 3,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },

  // Category Buttons
  categoryContainer: {
    position: "absolute",
    top: 120,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 2,
  },
  categoryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statusBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 11,
    color: "#333",
    fontWeight: "500",
  },


  // Callout Styles
  customCallout: {
    borderRadius: 12,
    overflow: "hidden",
  },
  callout: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
    color: "#333",
  },
  percentage: {
    fontWeight: "bold",
    fontSize: 24,
    color: "#4caf50",
    marginBottom: 12,
  },
  fillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  fillLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 10,
  },
  critical: {
    backgroundColor: "#f44336",
  },
  warning: {
    backgroundColor: "#ff9800",
  },
  normal: {
    backgroundColor: "#4caf50",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
    backgroundColor: "#e0e0e0",
  },
  infoGroup: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    lineHeight: 18,
  },
  infoLabel: {
    fontWeight: "600",
    color: "#666",
  },
  mapButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  mapButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  
  // Location Marker Styles
  locationMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    padding: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#4caf50",
    marginRight: 10,
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },

  // Fill Level Section
  fillLevelSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  fillLevelLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  fillLevelContainer: {
    alignItems: "center",
  },
  fillLevelPercentage: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  modalProgressBar: {
    height: 12,
    borderRadius: 6,
    width: "100%",
    backgroundColor: "#e0e0e0",
  },

  // Status Section
  statusSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  statusValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  gpsStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  gpsStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  gpsStatusText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Time Logs Section
  timeLogsSection: {
    padding: 20,
  },
  timeLogsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  timeLogsContainer: {
    maxHeight: 200,
  },
  timeLogRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  timeLogLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  timeLogValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },

  // Navigation Styles
  routeInfoContainer: {
    position: "absolute",
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 3,
  },
  routeInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  routeInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  stopNavigationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f44336",
    justifyContent: "center",
    alignItems: "center",
  },
  stopNavigationText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  routeInfoContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routeInfoItem: {
    alignItems: "center",
    flex: 1,
  },
  routeInfoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  routeInfoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2e7d32",
  },
  // Travel Mode Selector
  travelModeContainer: {
    flexDirection: "row",
    marginTop: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 4,
  },
  travelModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  travelModeButtonActive: {
    backgroundColor: "#2e7d32",
  },
  travelModeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  travelModeTextActive: {
    color: "white",
  },

  // Directions Button in Modal
  directionsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#2196f3",
    marginRight: 10,
  },
  directionsButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // User Location Marker
  userLocationMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  userLocationCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2196f3",
    borderWidth: 3,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  userLocationText: {
    fontSize: 20,
  },

  // Location Tracking Styles
  locationTrackingContainer: {
    position: "absolute",
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 3,
  },
  locationTrackingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  locationTrackingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  trackingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationTrackingContent: {
    alignItems: "center",
  },
  locationTrackingText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  distanceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 4,
  },
  arrivalText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4caf50",
    textAlign: "center",
  },

  // Distance Marker on Route
  distanceMarker: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  distanceMarkerText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Arrival Notification
  arrivalNotification: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "#4caf50",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 4,
  },
  arrivalNotificationText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // Voice Controls
  voiceControlsContainer: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  voiceControlButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  voiceControlButtonActive: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  voiceControlText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  voiceControlTextActive: {
    color: "#ffffff",
  },
});
