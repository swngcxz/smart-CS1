

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface LocationResult {
  success: boolean;
  location?: LocationPoint;
  error?: string;
  isUsingFallback?: boolean;
}

export class LocationUtils {
  private static readonly LAST_KNOWN_LOCATION_KEY = 'lastKnownLocation';
  private static readonly DEFAULT_LOCATION: LocationPoint = {
    latitude: 14.5995,
    longitude: 120.9842, // Manila coordinates
  };

  /**
   * Get current location with multiple fallback strategies
   */
  static async getCurrentLocation(): Promise<LocationResult> {
    try {
      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        console.log('[LocationUtils] Location services are disabled');
        return await this.handleLocationServicesDisabled();
      }

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('[LocationUtils] Location permission denied');
        return await this.handlePermissionDenied();
      }

      // Try to get current location with multiple accuracy levels
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeoutMs: 15000,
        });
      } catch (highAccuracyError) {
        console.log('[LocationUtils] High accuracy failed, trying balanced');
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeoutMs: 10000,
          });
        } catch (balancedError) {
          console.log('[LocationUtils] Balanced accuracy failed, trying low');
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
            timeoutMs: 8000,
          });
        }
      }

      const currentLocation: LocationPoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Store as backup
      await this.storeLastKnownLocation(currentLocation);

      return {
        success: true,
        location: currentLocation,
        isUsingFallback: false,
      };
    } catch (error) {
      console.error('[LocationUtils] Error getting location:', error);
      return await this.handleLocationError(error);
    }
  }

  /**
   * Get last known location from storage
   */
  static async getLastKnownLocation(): Promise<LocationPoint | null> {
    try {
      const stored = await AsyncStorage.getItem(this.LAST_KNOWN_LOCATION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('[LocationUtils] Error getting last known location:', error);
      return null;
    }
  }

  /**
   * Store location for future use
   */
  static async storeLastKnownLocation(location: LocationPoint): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.LAST_KNOWN_LOCATION_KEY,
        JSON.stringify(location)
      );
    } catch (error) {
      console.error('[LocationUtils] Error storing location:', error);
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
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
  }

  /**
   * Format distance for display
   */
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Estimate duration based on distance and mode
   */
  static estimateDuration(distanceInMeters: number, mode: 'walking' | 'cycling' | 'driving' = 'driving'): string {
    let speed; // meters per second
    
    switch (mode) {
      case 'walking':
        speed = 1.4; // ~5 km/h
        break;
      case 'cycling':
        speed = 4.2; // ~15 km/h
        break;
      case 'driving':
        speed = 13.9; // ~50 km/h (city driving)
        break;
      default:
        speed = 1.4;
    }

    const durationInSeconds = distanceInMeters / speed;
    const durationInMinutes = Math.round(durationInSeconds / 60);
    
    if (durationInMinutes < 60) {
      return `${durationInMinutes} min`;
    } else {
      const hours = Math.floor(durationInMinutes / 60);
      const minutes = durationInMinutes % 60;
      return `${hours}h ${minutes}min`;
    }
  }

  /**
   * Handle when location services are disabled
   */
  private static async handleLocationServicesDisabled(): Promise<LocationResult> {
    const lastKnown = await this.getLastKnownLocation();
    if (lastKnown) {
      return {
        success: true,
        location: lastKnown,
        isUsingFallback: true,
      };
    }

    return {
      success: true,
      location: this.DEFAULT_LOCATION,
      isUsingFallback: true,
    };
  }

  /**
   * Handle when permission is denied
   */
  private static async handlePermissionDenied(): Promise<LocationResult> {
    const lastKnown = await this.getLastKnownLocation();
    if (lastKnown) {
      return {
        success: true,
        location: lastKnown,
        isUsingFallback: true,
      };
    }

    return {
      success: false,
      error: 'Location permission denied. Please enable location access in settings.',
    };
  }

  /**
   * Handle location errors
   */
  private static async handleLocationError(error: any): Promise<LocationResult> {
    const lastKnown = await this.getLastKnownLocation();
    if (lastKnown) {
      return {
        success: true,
        location: lastKnown,
        isUsingFallback: true,
      };
    }

    return {
      success: true,
      location: this.DEFAULT_LOCATION,
      isUsingFallback: true,
    };
  }

  /**
   * Show location permission alert
   */
  static showLocationPermissionAlert(): void {
    Alert.alert(
      'Location Permission Required',
      'This app needs location access to show routes and navigation. Please enable location services in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => {
          // In a real app, you would use Linking.openSettings()
          console.log('Would open device settings');
        }}
      ]
    );
  }

  /**
   * Show location unavailable alert
   */
  static showLocationUnavailableAlert(): void {
    Alert.alert(
      'Location Unavailable',
      'Unable to get your current location. Using default location for route calculation.',
      [{ text: 'OK' }]
    );
  }
}
