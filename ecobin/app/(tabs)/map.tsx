import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import MapView, { Callout, Marker } from "react-native-maps";
import { ProgressBar } from "react-native-paper";
import * as Location from 'expo-location';

type Bin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  percentage: number;
  location: string;
  lastCollectedBy: string;
  lastCollectedDate: string;
};

const bins: Bin[] = [
  {
    id: "1",
    name: "Bin A",
    latitude: 10.2098,
    longitude: 123.758,
    percentage: 75,
    location: "Near Gate A",
    lastCollectedBy: "Janitor John",
    lastCollectedDate: "2025-08-06",
  },
  {
    id: "2",
    name: "Bin B",
    latitude: 10.2102,
    longitude: 123.759,
    percentage: 40,
    location: "Beside Cafeteria",
    lastCollectedBy: "Janitor Anna",
    lastCollectedDate: "2025-08-04",
  },
  {
    id: "3",
    name: "Bin C",
    latitude: 10.2085,
    longitude: 123.757,
    percentage: 90,
    location: "Main Lobby",
    lastCollectedBy: "Janitor Mike",
    lastCollectedDate: "2025-08-07",
  },
];

export default function MapScreen() {
  const [region, setRegion] = useState({
    latitude: 10.2098,
    longitude: 123.758,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const router = useRouter();

  // Function to get user's current location
  const findMyLocation = async () => {
    try {
      setIsLocating(true);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find your location.');
        setIsLocating(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(newLocation);
      
      // Update map region to center on user location
      setRegion({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      setIsLocating(false);
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your current location. Please try again.');
      setIsLocating(false);
    }
  };

  const handleViewDetails = (binId: string) => {
    router.push({
      pathname: "/home/bin-details",
      params: { binId },
    });
  };

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  const getMarkerColor = (percentage: number) => {
    if (percentage > 75) return "red";
    if (percentage >= 50) return "orange";
    return "green";
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={region}
        mapType="satellite"
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {bins.map((bin) => (
          <Marker
            key={bin.id}
            coordinate={{ latitude: bin.latitude, longitude: bin.longitude }}
          >
            <View
              style={[
                styles.markerContainer,
                { backgroundColor: getMarkerColor(bin.percentage) },
              ]}
            >
              <Text style={styles.markerText}>{bin.percentage}%</Text>
            </View>

            <Callout>
              <View style={styles.callout}>
                <Text style={styles.title}>{bin.name}</Text>

                <View style={styles.fillRow}>
                  <Text>Fill Level: {bin.percentage}%</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      bin.percentage > 75
                        ? styles.critical
                        : bin.percentage >= 50
                        ? styles.warning
                        : styles.normal,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {bin.percentage > 75
                        ? "CRITICAL"
                        : bin.percentage >= 50
                        ? "WARNING"
                        : "NORMAL"}
                    </Text>
                  </View>
                </View>

                <ProgressBar
                  progress={bin.percentage / 100}
                  style={styles.progressBar}
                  color={
                    bin.percentage > 75
                      ? "red"
                      : bin.percentage >= 50
                      ? "orange"
                      : "green"
                  }
                />
                <View style={styles.infoGroup}>
                  <Text>Location: {bin.location}</Text>
                  <Text>Last Collected By: {bin.lastCollectedBy}</Text>
                  <Text>Last Collected Date: {formatDate(bin.lastCollectedDate)}</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="You are here"
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationInner} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Location Finder Button */}
      <TouchableOpacity
        style={[styles.locationButton, isLocating && styles.locationButtonLoading]}
        onPress={findMyLocation}
        disabled={isLocating}
      >
        <Text style={styles.locationButtonText}>
          {isLocating ? "📍" : "🎯"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  markerContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },
  infoGroup: {
    marginVertical: 8,
    gap: 4,
  },
  fillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  critical: {
    backgroundColor: "red",
  },
  warning: {
    backgroundColor: "orange",
  },
  normal: {
    backgroundColor: "green",
  },
  callout: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 8,
    width: 220,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 8,
  },
  // User location marker styles
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  // Location button styles
  locationButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  locationButtonLoading: {
    backgroundColor: '#999',
  },
  locationButtonText: {
    fontSize: 24,
  },
});
