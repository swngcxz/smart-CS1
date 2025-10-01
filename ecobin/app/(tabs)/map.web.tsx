import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ProgressBar } from "react-native-paper";
import * as Location from 'expo-location';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import { DynamicBinMarker } from '../../components/DynamicBinMarker';
import { GPSMarker } from '../../components/GPSMarker';
import { BinLocation } from '../../utils/apiService';

// Web fallback components
const MapView = ({ children, style, region, ...props }: any) => (
  <View style={[style, { backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }]}>
    <Text style={{ textAlign: 'center', padding: 20, color: '#6b7280', fontSize: 16 }}>
      🗺️ Map not available on web platform
    </Text>
    <Text style={{ textAlign: 'center', padding: 10, color: '#9ca3af', fontSize: 14 }}>
      Please use the mobile app for full map functionality
    </Text>
    {children}
  </View>
);

const Marker = ({ children, coordinate, title, description }: any) => (
  <View style={{ position: 'absolute', left: coordinate.longitude * 100, top: coordinate.latitude * 100 }}>
    {children}
  </View>
);

const Callout = ({ children, style }: any) => (
  <View style={[style]}>
    {children}
  </View>
);

const PROVIDER_GOOGLE = 'google';

export default function MapScreen() {
  const { binLocations, bin1Data, loading, error, lastUpdate, refetch, isGPSValid } = useRealTimeData(5000);
  const [region, setRegion] = useState({
    latitude: 10.2098,
    longitude: 123.758,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedBin, setSelectedBin] = useState<BinLocation | null>(null);
  const mapRef = useRef<any>(null);

  const router = useRouter();

  // Update map center when bin locations change
  useEffect(() => {
    if (binLocations.length > 0) {
      const firstBin = binLocations[0];
      setRegion({
        latitude: firstBin.position[0],
        longitude: firstBin.position[1],
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [binLocations]);

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

  const handleBinPress = (bin: BinLocation) => {
    setSelectedBin(bin);
    // Center map on selected bin
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: bin.position[0],
        longitude: bin.position[1],
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  const handleViewDetails = (bin: BinLocation) => {
    router.push({
      pathname: "/home/bin-details",
      params: { 
        binId: bin.id,
        binName: bin.name,
        binLevel: bin.level.toString(),
        binStatus: bin.status,
        binRoute: bin.route
      },
    });
  };

  // Calculate bin statistics with null checks
  const criticalBins = (binLocations || []).filter(bin => bin.status === 'critical').length;
  const warningBins = (binLocations || []).filter(bin => bin.status === 'warning').length;
  const normalBins = (binLocations || []).filter(bin => bin.status === 'normal').length;

  return (
    <View style={styles.container}>
      {/* Header with statistics */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Bin Map (Web)</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.statText}>Normal ({normalBins})</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.statText}>Warning ({warningBins})</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.statText}>Critical ({criticalBins})</Text>
          </View>
        </View>
        {lastUpdate && (
          <Text style={styles.lastUpdateText}>
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </Text>
        )}
        {!isGPSValid() && (
          <Text style={styles.gpsStatusText}>
            🛰️ GPS Status: Waiting for satellite connection
          </Text>
        )}
      </View>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading bin data...</Text>
        </View>
      )}

      {/* GPS Status Message */}
      {!isGPSValid() && (
        <View style={styles.gpsWarningContainer}>
          <Text style={styles.gpsWarningText}>
            🛰️ GPS Not Connected
          </Text>
          <Text style={styles.gpsSubText}>
            Waiting for satellite connection... Bins will appear when GPS is available.
          </Text>
        </View>
      )}

      {/* Error Message */}
      {error && isGPSValid() && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Error: {error}
          </Text>
          <TouchableOpacity onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        region={region}
        mapType="hybrid"
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={true}
        showsPointsOfInterest={false}
      >
        {/* Dynamic Bin Markers */}
        {(binLocations || []).map((bin) => (
          <DynamicBinMarker
            key={bin.id}
            bin={bin}
            onPress={handleBinPress}
          />
        ))}

        {/* GPS Marker for real-time location */}
        {bin1Data && bin1Data.latitude && bin1Data.longitude && (
          <GPSMarker
            gpsData={{
              latitude: bin1Data.latitude,
              longitude: bin1Data.longitude,
              gps_valid: bin1Data.gps_valid,
              satellites: bin1Data.satellites,
              timestamp: new Date(bin1Data.timestamp).toISOString(),
              coordinates_source: bin1Data.coordinates_source,
              last_active: bin1Data.last_active,
              gps_timestamp: bin1Data.gps_timestamp
            }}
          />
        )}

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

      {/* Selected Bin Details */}
      {selectedBin && (
        <View style={styles.selectedBinContainer}>
          <View style={styles.selectedBinContent}>
            <Text style={styles.selectedBinTitle}>{selectedBin.name}</Text>
            <Text style={styles.selectedBinInfo}>
              Fill Level: {selectedBin.level}% | Status: {selectedBin.status.toUpperCase()}
            </Text>
            <Text style={styles.selectedBinInfo}>Route: {selectedBin.route}</Text>
            <View style={styles.selectedBinButtons}>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => handleViewDetails(selectedBin)}
              >
                <Text style={styles.detailsButtonText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedBin(null)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header styles
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  lastUpdateText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  gpsStatusText: {
    fontSize: 10,
    color: '#d97706',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Loading styles
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  // Error styles
  errorContainer: {
    position: 'absolute',
    top: 150,
    left: 20,
    right: 20,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    zIndex: 1000,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 8,
  },
  // GPS Warning styles
  gpsWarningContainer: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  gpsWarningText: {
    color: '#d97706',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gpsSubText: {
    color: '#92400e',
    fontSize: 12,
    lineHeight: 16,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  // User location marker styles
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
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
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  locationButtonLoading: {
    backgroundColor: '#9ca3af',
  },
  locationButtonText: {
    fontSize: 24,
  },
  // Selected bin styles
  selectedBinContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedBinContent: {
    alignItems: 'center',
  },
  selectedBinTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  selectedBinInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  selectedBinButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  detailsButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});
