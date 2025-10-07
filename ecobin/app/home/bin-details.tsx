
import React from "react";
import BackButton from "@/components/BackButton";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, Platform } from "react-native";
import { ProgressBar } from "react-native-paper";
import { useRealTimeData } from "../../contexts/RealTimeDataContext";
import { getActiveTimeAgo } from "../../utils/timeUtils";

// Platform-specific imports
let MapView: any, Marker: any, PROVIDER_GOOGLE: any;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} else {
  // Web fallback components
  MapView = ({ children, style, region, ...props }: any) => (
    <View style={[style, { backgroundColor: '#e5e7eb' }]}>
      <Text style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
        Map not available on web platform
      </Text>
      {children}
    </View>
  );
  Marker = ({ children, coordinate, title, description }: any) => (
    <View style={{ position: 'absolute', left: coordinate.longitude * 100, top: coordinate.latitude * 100 }}>
      {children}
    </View>
  );
  PROVIDER_GOOGLE = 'google';
}

export default function BinDetailScreen() {
  const params = useLocalSearchParams<{ 
    binId: string; 
    binName?: string; 
    binLevel?: string; 
    binStatus?: string; 
    binRoute?: string; 
  }>();
  const { binLocations, bin1Data, loading, getTimeSinceLastGPS } = useRealTimeData();

  // SIMPLIFIED: Focus only on bin1
  const bin = (binLocations || []).find((b) => b && b.id === 'bin1');
  
  // Create safe bin data with defaults
  const safeBinData = {
    id: bin?.id || params.binId || 'bin1',
    name: bin?.name || params.binName || 'Central Plaza Bin 1',
    position: bin?.position || [10.2098, 123.758] as [number, number],
    level: typeof bin?.level === 'number' && !isNaN(bin.level) ? bin.level : parseFloat(params.binLevel || '0'),
    status: bin?.status || (params.binStatus as 'normal' | 'warning' | 'critical') || 'normal',
    route: bin?.route || params.binRoute || 'Central Plaza Route',
    lastCollection: bin?.lastCollection || new Date().toISOString(),
    gps_valid: Boolean(bin?.gps_valid),
    satellites: typeof bin?.satellites === 'number' ? bin.satellites : 0
  };

  const getStatusColor = (val: number) => {
    const safeVal = typeof val === 'number' && !isNaN(val) ? val : 0;
    if (safeVal >= 90) return "#f44336"; // red
    if (safeVal >= 60) return "#ff9800"; // orange
    return "#4caf50"; // green
  };

  // Derived metrics from real-time data
  const weightKg = (typeof bin1Data?.weight_kg === 'number' ? bin1Data?.weight_kg : 0) || 0;
  const heightPercent = (typeof bin1Data?.height_percent === 'number' ? bin1Data?.height_percent : 0) || 0;
  const gpsValid = (bin1Data?.gps_valid ?? safeBinData.gps_valid) ? true : false;
  const gpsValidDisplay = gpsValid ? 'Valid' : 'Invalid';
  const satellitesDisplay = bin1Data?.satellites ?? safeBinData.satellites ?? 0;
  const lastSeenText = gpsValid && bin1Data?.timestamp
    ? 'Online'
    : (bin1Data?.timestamp ? `Offline · ${getTimeSinceLastGPS(bin1Data.timestamp)}` : 'Offline · Unknown');

  // MiniBar: always-visible track with colored fill
  const MiniBar = ({ percent }: { percent: number }) => {
    const safe = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
    return (
      <View style={styles.miniTrack}>
        <View style={[styles.miniFill, { width: `${safe}%`, backgroundColor: getStatusColor(safe) }]} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text>Loading bin data...</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton />
      <Text style={styles.sectionTitle}>{safeBinData.name} Location</Text>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: safeBinData.position[0],
          longitude: safeBinData.position[1],
          latitudeDelta: 0.0008,
          longitudeDelta: 0.0008,
        }}
        mapType="hybrid"
        showsBuildings={true}
        showsCompass={true}
        showsScale={true}
      >
        <Marker coordinate={{ 
          latitude: safeBinData.position[0], 
          longitude: safeBinData.position[1] 
        }}>
          <View style={[styles.marker, { backgroundColor: getStatusColor(safeBinData.level) }]}>
            <Text style={styles.markerText}>{safeBinData.level}%</Text>
          </View>
        </Marker>
      </MapView>

      <View style={styles.detailsHeader}>
        <Text style={styles.title}>Details for {safeBinData.name}</Text>
      </View>

      <Text style={styles.text}>Route: {safeBinData.route}</Text>
      <Text style={styles.text}>Current Level: {safeBinData.level}%</Text>
      <ProgressBar
        progress={safeBinData.level / 100}
        color={getStatusColor(safeBinData.level)}
        style={{ height: 10, borderRadius: 5, marginBottom: 15 }}
      />
      <Text style={styles.text}>Last Update: {getActiveTimeAgo(safeBinData)}</Text>
      <Text style={[styles.text, styles.status]}>Status: {safeBinData.status.toUpperCase()}</Text>

      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Weight</Text>
          <Text style={styles.metricValue}>{weightKg.toFixed(3)} kg</Text>
          <MiniBar percent={(bin1Data?.weight_percent ?? 0)} />
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Height</Text>
          <Text style={styles.metricValue}>{heightPercent}%</Text>
          <MiniBar percent={heightPercent} />
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>GPS Status</Text>
          <Text style={[styles.metricValue, gpsValid ? styles.ok : styles.warn]}>
            {gpsValidDisplay} ({satellitesDisplay} satellites)
          </Text>
          <Text style={styles.subtle}>{lastSeenText}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 50, backgroundColor: "#fff", paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 15, color: "#2e7d32" },
  sectionTitle: { marginTop: 5, fontSize: 18, fontWeight: "500", color: "#000", marginBottom: 10 },
  text: { fontSize: 16, marginBottom: 10, color: "#444" },
  status: { fontWeight: "bold", color: "#2e7d32" },
  map: { width: "100%", height: 300, borderRadius: 10, marginBottom: 20 },

  // Marker with percentage
  marker: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  markerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  metricsContainer: {
    marginTop: 10,
    marginBottom: 24,
    backgroundColor: "#f7faf7",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  metricItem: { marginBottom: 12 },
  metricLabel: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  metricValue: { fontSize: 16, color: "#111827", fontWeight: "600" },
  subtle: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  smallBar: { height: 8, borderRadius: 4, marginTop: 6 },
  miniTrack: { height: 8, borderRadius: 4, marginTop: 6, backgroundColor: "#e5e7eb", overflow: "hidden" },
  miniFill: { height: 8, borderRadius: 4 },
  ok: { color: "#065f46" },
  warn: { color: "#92400e" },
  detailsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  smallHistoryText: { fontSize: 14, color: "gray", fontWeight: "500" },
});
