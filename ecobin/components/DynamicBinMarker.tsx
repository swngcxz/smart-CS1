import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { BinLocation } from '../utils/apiService';

// Platform-specific imports
let Marker: any, Callout: any;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  Marker = Maps.Marker;
  Callout = Maps.Callout;
} else {
  // Web fallback components
  Marker = ({ children, coordinate, onPress }: any) => (
    <View style={{ position: 'absolute', left: coordinate.longitude * 100, top: coordinate.latitude * 100 }}>
      {children}
    </View>
  );
  Callout = ({ children, style }: any) => (
    <View style={[styles.callout, style]}>
      {children}
    </View>
  );
}

interface DynamicBinMarkerProps {
  bin: BinLocation & {
    coordinates_source?: string;
    last_active?: string;
    gps_timestamp?: string;
  };
  onPress?: (bin: BinLocation) => void;
}

export const DynamicBinMarker: React.FC<DynamicBinMarkerProps> = ({ bin, onPress }) => {
  const getMarkerColor = (status: string, coordinatesSource?: string) => {
    // If using cached GPS, show grey regardless of status
    if (coordinatesSource === 'gps_cached') {
      return '#6b7280'; // grey-500
    }
    
    // If no GPS data, show dark grey
    if (coordinatesSource === 'no_data') {
      return '#374151'; // grey-700
    }
    
    // Live GPS - use status-based colors
    switch (status) {
      case 'critical':
        return '#ef4444'; // red-500
      case 'warning':
        return '#f59e0b'; // amber-500
      case 'normal':
      default:
        return '#10b981'; // emerald-500
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical':
        return 'CRITICAL';
      case 'warning':
        return 'WARNING';
      case 'normal':
      default:
        return 'NORMAL';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Marker
      coordinate={{
        latitude: bin.position[0],
        longitude: bin.position[1]
      }}
      onPress={() => onPress?.(bin)}
    >
      <View style={[
        styles.markerContainer,
        { 
          backgroundColor: getMarkerColor(bin.status, bin.coordinates_source),
          opacity: bin.coordinates_source === 'gps_cached' ? 0.7 : 1.0
        }
      ]}>
        <Text style={styles.markerText}>{bin.level || 0}%</Text>
      </View>

      <Callout style={styles.callout}>
        <View style={styles.calloutContent}>
          <Text style={styles.binName}>{bin.name}</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.fillLevel}>Fill Level: {bin.level || 0}%</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getMarkerColor(bin.status) }
            ]}>
              <Text style={styles.statusText}>{getStatusText(bin.status)}</Text>
            </View>
          </View>

          <ProgressBar
            progress={(bin.level || 0) / 100}
            style={styles.progressBar}
            color={getMarkerColor(bin.status, bin.coordinates_source)}
          />

          <View style={styles.infoSection}>
            <Text style={styles.infoText}>📍 {bin.route}</Text>
            <Text style={styles.infoText}>
              🛰️ GPS: {bin.coordinates_source === 'gps_live' ? 'Live GPS' : 
                      bin.coordinates_source === 'gps_cached' ? 'Cached GPS' : 
                      'No GPS'} ({bin.satellites || 0} sats)
            </Text>
            <Text style={styles.infoText}>
              🕒 Last Active: {bin.last_active || formatDate(bin.lastCollection)}
            </Text>
            {bin.gps_timestamp && bin.gps_timestamp !== 'N/A' && (
              <Text style={styles.infoText}>
                📅 GPS Time: {bin.gps_timestamp}
              </Text>
            )}
            {bin.weight_kg && (
              <Text style={styles.infoText}>⚖️ Weight: {bin.weight_kg}kg</Text>
            )}
            {bin.distance_cm && (
              <Text style={styles.infoText}>📏 Distance: {bin.distance_cm}cm</Text>
            )}
          </View>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  callout: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 0,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  calloutContent: {
    padding: 12,
  },
  binName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#1f2937',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fillLevel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  infoSection: {
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
});

