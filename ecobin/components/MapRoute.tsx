import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRealTimeData } from '@/hooks/useRealTimeData';

interface MapRouteProps {
  destination: {
    latitude: number;
    longitude: number;
    title: string;
    address: string;
  };
  onClose: () => void;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
}

const MapRoute: React.FC<MapRouteProps> = ({ destination, onClose }) => {
  const [userLocation, setUserLocation] = useState<RoutePoint | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RoutePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [isUsingBackupLocation, setIsUsingBackupLocation] = useState(false);

  // Get real-time data for bin coordinates
  const { binData, isGPSValid } = useRealTimeData();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsUsingBackupLocation(false);
      console.log('[MapRoute] Starting location request...');

      // First, try to use real-time bin data if available and GPS is valid
      if (binData && isGPSValid() && binData.latitude && binData.longitude) {
        console.log('[MapRoute] Using real-time bin data:', {
          latitude: binData.latitude,
          longitude: binData.longitude,
          gps_valid: binData.gps_valid,
          satellites: binData.satellites
        });
        
        const realTimeLocation = {
          latitude: binData.latitude,
          longitude: binData.longitude,
        };
        
        setUserLocation(realTimeLocation);
        await getRoute(realTimeLocation, destination);
        setLoading(false);
        return;
      }

      // If real-time data not available, try backup GPS coordinates
      if (binData && binData.backup_latitude && binData.backup_longitude) {
        console.log('[MapRoute] Using backup GPS coordinates:', {
          latitude: binData.backup_latitude,
          longitude: binData.backup_longitude,
          backup_source: binData.backup_source,
          backup_timestamp: binData.backup_timestamp
        });
        
        const backupLocation = {
          latitude: binData.backup_latitude,
          longitude: binData.backup_longitude,
        };
        
        setUserLocation(backupLocation);
        setIsUsingBackupLocation(true);
        await getRoute(backupLocation, destination);
        setLoading(false);
        return;
      }

      // If no real-time or backup data, try to get current device location
      console.log('[MapRoute] No real-time data available, getting device location...');
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[MapRoute] Permission status:', status);
      
      if (status !== 'granted') {
        // Try to get last known location from AsyncStorage
        const lastKnownLocation = await AsyncStorage.getItem('lastKnownLocation');
        if (lastKnownLocation) {
          const location = JSON.parse(lastKnownLocation);
          console.log('[MapRoute] Using last known location:', location);
          setUserLocation(location);
          setIsUsingBackupLocation(true);
          await getRoute(location, destination);
          setLoading(false);
          return;
        }
        
        setError('Location permission denied. Please enable location access to view routes.');
        setLoading(false);
        return;
      }

      // Get current location
      console.log('[MapRoute] Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeoutMs: 10000, // 10 second timeout
      });

      const currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      console.log('[MapRoute] Got device location:', currentLocation);
      
      // Store as backup location
      await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(currentLocation));
      
      setUserLocation(currentLocation);
      await getRoute(currentLocation, destination);
    } catch (err) {
      console.error('[MapRoute] Error getting location:', err);
      
      // Try to use last known location as final fallback
      try {
        const lastKnownLocation = await AsyncStorage.getItem('lastKnownLocation');
        if (lastKnownLocation) {
          const location = JSON.parse(lastKnownLocation);
          console.log('[MapRoute] Using last known location as fallback:', location);
          setUserLocation(location);
          setIsUsingBackupLocation(true);
          await getRoute(location, destination);
          setLoading(false);
          return;
        }
      } catch (fallbackErr) {
        console.error('[MapRoute] Fallback location also failed:', fallbackErr);
      }
      
      setError(`Failed to get your current location: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getRoute = async (start: RoutePoint, end: RoutePoint) => {
    try {
      console.log('[MapRoute] Calculating route from:', start, 'to:', end);
      
      // Calculate distance and estimated duration
      const distance = calculateDistance(start, end);
      setDistance(distance);
      setDuration(estimateDuration(distance));
      
      // For now, create a simple straight line route
      // In a production app, you would use a routing service like Google Directions API
      // or OpenRouteService that doesn't require an API key
      setRouteCoordinates([start, end]);
      
      console.log(`[MapRoute] Route calculated: ${distance.toFixed(0)}m, estimated ${estimateDuration(distance)}`);
    } catch (err) {
      console.error('[MapRoute] Error getting route:', err);
      // Fallback: create a simple straight line route
      setRouteCoordinates([start, end]);
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (point1: RoutePoint, point2: RoutePoint): number => {
    const R = 6371e3; // Earth's radius in meters
    const lat1 = point1.latitude * Math.PI / 180;
    const lat2 = point2.latitude * Math.PI / 180;
    const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const deltaLng = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Estimate walking duration based on distance
  const estimateDuration = (distanceInMeters: number): string => {
    const walkingSpeed = 1.4; // meters per second (average walking speed)
    const durationInSeconds = distanceInMeters / walkingSpeed;
    const durationInMinutes = Math.round(durationInSeconds / 60);
    
    if (durationInMinutes < 60) {
      return `${durationInMinutes} min`;
    } else {
      const hours = Math.floor(durationInMinutes / 60);
      const minutes = durationInMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  };

  // Simple polyline decoder (you might want to use a library for this)
  const decodePolyline = (encoded: string): RoutePoint[] => {
    const points: RoutePoint[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b: number;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  const openInMaps = () => {
    if (userLocation) {
      // Create a URL that opens in the device's default maps app
      const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${destination.latitude},${destination.longitude}`;
      
      Alert.alert(
        'Open in Maps',
        `Navigate to ${destination.title} at ${destination.address}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Maps', 
            onPress: () => {
              // In a real app, you would use Linking.openURL(url)
              // For now, we'll just show the URL in console
              console.log('Opening maps with URL:', url);
              Alert.alert('Navigation', 'This would open your default maps app with the route.');
            }
          }
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Route to Bin</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Route to Bin</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️</Text>
          <Text style={styles.errorTitle}>Location Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Route to Bin</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>📍</Text>
          <Text style={styles.errorTitle}>Location Not Available</Text>
          <Text style={styles.errorMessage}>Unable to get your current location.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Route to Bin</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Route Info */}
      <View style={styles.routeInfo}>
        <View style={styles.routeInfoItem}>
          <Text style={styles.routeInfoLabel}>Distance:</Text>
          <Text style={styles.routeInfoValue}>
            {distance ? formatDistance(distance) : 'Calculating...'}
          </Text>
        </View>
        <View style={styles.routeInfoItem}>
          <Text style={styles.routeInfoLabel}>Duration:</Text>
          <Text style={styles.routeInfoValue}>
            {duration || 'Calculating...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.openMapsButton} onPress={openInMaps}>
          <Text style={styles.openMapsButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Location Status Indicator */}
      {isUsingBackupLocation && (
        <View style={styles.backupLocationWarning}>
          <Text style={styles.backupLocationText}>
            ⚠️ Using backup location data
          </Text>
        </View>
      )}

      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {/* User Location Marker */}
        <Marker
          coordinate={userLocation}
          title="Your Location"
          description="Current position"
          pinColor="blue"
        />

        {/* Destination Marker */}
        <Marker
          coordinate={destination}
          title={destination.title}
          description={destination.address}
          pinColor="red"
        />

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2e7d32"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  routeInfoItem: {
    alignItems: 'center',
  },
  routeInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  routeInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  openMapsButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  openMapsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f8f8f8',
  },
  errorText: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  backupLocationWarning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 20,
    borderRadius: 6,
  },
  backupLocationText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default MapRoute;
