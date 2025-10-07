const { admin } = require('../models/firebase');

class DynamicBinStatusService {
  constructor() {
    this.STALE_THRESHOLD = 1 * 60 * 1000; // 1 minute in milliseconds
    this.OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  /**
   * GPS Status Thresholds:
   * - Fresh Data: < 1 minute (shows green "Live GPS")
   * - Stale Data: 1-5 minutes (shows orange "Stale GPS")
   * - Offline Data: > 5 minutes (shows grey "Offline GPS")
   */

  // Check if GPS data is fresh based on timestamps
  isGPSDataFresh(gpsData) {
    if (!gpsData) return false;
    
    // Check if we have valid timestamps
    const now = new Date();
    let lastUpdateTime = null;
    
    // Try to get the most recent timestamp
    if (gpsData.last_active && gpsData.last_active !== 'N/A') {
      // Prefer last_active as it's more reliable
      lastUpdateTime = new Date(gpsData.last_active);
    } else if (gpsData.gps_timestamp && gpsData.gps_timestamp !== 'N/A') {
      // Use gps_timestamp as second choice
      lastUpdateTime = new Date(gpsData.gps_timestamp);
    } else if (gpsData.timestamp) {
      // Handle ESP32 millis() timestamp (relative to boot time)
      if (typeof gpsData.timestamp === 'number') {
        // ESP32 millis() returns milliseconds since boot, not absolute time
        // We can't convert this to absolute time without knowing boot time
        // So we'll consider it invalid for freshness checking
        return false;
      } else {
        lastUpdateTime = new Date(gpsData.timestamp);
      }
    }
    
    if (!lastUpdateTime || isNaN(lastUpdateTime.getTime())) {
      return false;
    }
    
    const timeDiff = now.getTime() - lastUpdateTime.getTime();
    return timeDiff < this.STALE_THRESHOLD;
  }

  // Check if GPS data is completely offline
  isGPSDataOffline(gpsData) {
    if (!gpsData) return true;
    
    const now = new Date();
    let lastUpdateTime = null;
    
    if (gpsData.last_active && gpsData.last_active !== 'N/A') {
      // Prefer last_active as it's more reliable
      lastUpdateTime = new Date(gpsData.last_active);
    } else if (gpsData.gps_timestamp && gpsData.gps_timestamp !== 'N/A') {
      // Use gps_timestamp as second choice
      lastUpdateTime = new Date(gpsData.gps_timestamp);
    } else if (gpsData.timestamp) {
      // Handle ESP32 millis() timestamp (relative to boot time)
      if (typeof gpsData.timestamp === 'number') {
        // ESP32 millis() returns milliseconds since boot, not absolute time
        // We can't convert this to absolute time without knowing boot time
        // So we'll consider it invalid for freshness checking
        return true; // Consider it offline if we can't determine freshness
      } else {
        lastUpdateTime = new Date(gpsData.timestamp);
      }
    }
    
    if (!lastUpdateTime || isNaN(lastUpdateTime.getTime())) {
      return true;
    }
    
    const timeDiff = now.getTime() - lastUpdateTime.getTime();
    return timeDiff > this.OFFLINE_THRESHOLD;
  }

  // Get dynamic bin status
  getDynamicBinStatus(binId, gpsData) {
    if (!gpsData) {
      return {
        status: 'offline',
        reason: 'no_data',
        lastUpdate: null,
        coordinatesSource: 'no_data',
        gpsValid: false,
        satellites: 0
      };
    }

    const isFresh = this.isGPSDataFresh(gpsData);
    const isOffline = this.isGPSDataOffline(gpsData);
    const hasValidCoordinates = gpsData.latitude && gpsData.longitude && 
                               gpsData.latitude !== 0 && gpsData.longitude !== 0;

    // Determine status
    let status, reason, coordinatesSource, gpsValid;

    if (isOffline) {
      status = 'offline';
      reason = 'timeout';
      coordinatesSource = 'offline';
      gpsValid = false;
    } else if (!isFresh) {
      status = 'stale';
      reason = 'stale_data';
      coordinatesSource = 'gps_stale';
      gpsValid = false;
    } else if (hasValidCoordinates && gpsData.gps_valid && !gpsData.gps_timeout) {
      status = 'live';
      reason = 'live_gps';
      coordinatesSource = 'gps_live';
      gpsValid = true;
    } else {
      status = 'offline';
      reason = 'invalid_gps';
      coordinatesSource = 'gps_invalid';
      gpsValid = false;
    }

    return {
      status,
      reason,
      lastUpdate: gpsData.timestamp || gpsData.last_active || gpsData.gps_timestamp,
      coordinatesSource,
      gpsValid,
      satellites: gpsData.satellites || 0,
      latitude: gpsData.latitude,
      longitude: gpsData.longitude
    };
  }

  // Get all bins with dynamic status
  async getAllBinsDynamicStatus() {
    try {
      const rtdb = admin.database();
      const bins = [];
      
      // Get bin1 data
      const bin1Snapshot = await rtdb.ref('monitoring/bin1').once('value');
      if (bin1Snapshot.exists()) {
        const bin1Data = bin1Snapshot.val();
        const status = this.getDynamicBinStatus('bin1', bin1Data);
        
        bins.push({
          binId: 'bin1',
          name: 'Central Plaza',
          ...status,
          binLevel: bin1Data.bin_level || 0,
          weight: bin1Data.weight_kg || 0,
          distance: bin1Data.distance_cm || 0
        });
      }
      
      return bins;
    } catch (error) {
      console.error('[DYNAMIC STATUS] Error getting all bins status:', error);
      return [];
    }
  }

  // Get coordinates for display with dynamic status
  async getDisplayCoordinatesWithStatus(binId) {
    try {
      const rtdb = admin.database();
      
      // Get live data
      const liveSnapshot = await rtdb.ref(`monitoring/${binId}`).once('value');
      const liveData = liveSnapshot.exists() ? liveSnapshot.val() : null;
      
      // Get dynamic status
      const dynamicStatus = this.getDynamicBinStatus(binId, liveData);
      
      // Determine which coordinates to use
      let coordinates = null;
      
      if (dynamicStatus.status === 'live') {
        coordinates = {
          latitude: liveData.latitude,
          longitude: liveData.longitude,
          source: 'live',
          timestamp: liveData.timestamp || liveData.last_active,
          gps_valid: true
        };
      } else {
        // Try to get backup coordinates
        const backupSnapshot = await rtdb.ref(`monitoring/backup/${binId}`).once('value');
        if (backupSnapshot.exists()) {
          const backupData = backupSnapshot.val();
          if (backupData.backup_latitude && backupData.backup_longitude) {
            coordinates = {
              latitude: backupData.backup_latitude,
              longitude: backupData.backup_longitude,
              source: 'backup',
              timestamp: backupData.backup_timestamp,
              gps_valid: false
            };
          }
        }
        
        // Fallback to default coordinates
        if (!coordinates) {
          coordinates = {
            latitude: 10.24371,
            longitude: 123.786917,
            source: 'default',
            timestamp: new Date().toISOString(),
            gps_valid: false
          };
        }
      }
      
      return {
        coordinates,
        status: dynamicStatus,
        binId
      };
    } catch (error) {
      console.error('[DYNAMIC STATUS] Error getting display coordinates:', error);
      return null;
    }
  }
}

module.exports = new DynamicBinStatusService();
