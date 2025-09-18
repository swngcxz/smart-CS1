import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Web fallback components
const Marker = ({ children, coordinate }: any) => (
  <View style={{ position: 'absolute', left: coordinate.longitude * 100, top: coordinate.latitude * 100 }}>
    {children}
  </View>
);

const Callout = ({ children, style }: any) => (
  <View style={[styles.gpsCallout, style]}>
    {children}
  </View>
);

interface GPSMarkerProps {
  gpsData: {
    latitude: number;
    longitude: number;
    gps_valid: boolean;
    satellites: number;
    timestamp: string;
  } | undefined;
}

export const GPSMarker: React.FC<GPSMarkerProps> = ({ gpsData }) => {
  if (!gpsData || !gpsData.gps_valid) {
    return null;
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Marker
      coordinate={{
        latitude: gpsData.latitude,
        longitude: gpsData.longitude
      }}
    >
      <View style={styles.gpsMarker}>
        <View style={styles.gpsMarkerInner} />
        <View style={styles.gpsMarkerPulse} />
      </View>

      <Callout style={styles.gpsCallout}>
        <View style={styles.gpsCalloutContent}>
          <Text style={styles.gpsTitle}>📍 Live GPS Location</Text>
          <Text style={styles.gpsInfo}>
            🛰️ {gpsData.satellites} satellites
          </Text>
          <Text style={styles.gpsInfo}>
            🕒 {formatTimestamp(gpsData.timestamp)}
          </Text>
          <Text style={styles.gpsCoords}>
            {gpsData.latitude.toFixed(6)}, {gpsData.longitude.toFixed(6)}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  gpsMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6', // blue-500
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gpsMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  gpsMarkerPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    opacity: 0.3,
    // Note: Animation would need to be handled with react-native-reanimated
    // For now, we'll use a static pulse effect
  },
  gpsCallout: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 0,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  gpsCalloutContent: {
    padding: 10,
  },
  gpsTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 6,
  },
  gpsInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  gpsCoords: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
    marginTop: 4,
  },
});
