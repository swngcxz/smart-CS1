const { admin } = require('../models/firebase');
const dynamicBinStatusService = require('./dynamicBinStatusService');

class GPSBackupService {
  constructor() {
    this.isInitialized = false;
    this.backupInterval = null;
    this.lastBackupTime = new Date();
    this.validCoordinatesCache = new Map(); // In-memory cache for valid coordinates
  }

  // Initialize the GPS backup service
  async initialize() {
    try {
      console.log('[GPS BACKUP] Initializing GPS backup service...');
      
      // Load existing backup coordinates from Firebase
      await this.loadExistingBackupCoordinates();
      
      // Start listening to live GPS coordinates
      this.startGPSListener();
      
      // Start hourly backup process
      this.startHourlyBackup();
      
      this.isInitialized = true;
      console.log('[GPS BACKUP] Service initialized successfully');
    } catch (error) {
      console.error('[GPS BACKUP] Failed to initialize:', error);
    }
  }

  // Load existing backup coordinates from separate backup storage
  async loadExistingBackupCoordinates() {
    try {
      const rtdb = admin.database();
      const snapshot = await rtdb.ref('monitoring/backup/bin1').once('value');
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.backup_latitude && data.backup_longitude) {
          this.validCoordinatesCache.set('bin1', {
            latitude: data.backup_latitude,
            longitude: data.backup_longitude,
            lastBackup: data.backup_timestamp || new Date().toISOString()
          });
          console.log(`[GPS BACKUP] Loaded existing backup coordinates for bin1: ${data.backup_latitude}, ${data.backup_longitude}`);
        }
      }
    } catch (error) {
      console.error('[GPS BACKUP] Error loading existing backup coordinates:', error);
    }
  }

  // Start listening to live GPS coordinates from Firebase Realtime Database
  startGPSListener() {
    console.log('[GPS BACKUP] Starting GPS coordinates listener...');
    
    // Listen to bin1 GPS data changes in Realtime Database
    const rtdb = admin.database();
    const bin1Ref = rtdb.ref('monitoring/bin1');
    bin1Ref.on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        this.processLiveGPSData('bin1', data);
      }
    }, (error) => {
      console.error('[GPS BACKUP] Error listening to GPS data:', error);
    });
  }

  // Process live GPS data and validate coordinates
  processLiveGPSData(binId, gpsData) {
    const { latitude, longitude, gps_valid, satellites, timestamp, gps_timeout, coordinates_source } = gpsData;
    
    // Check if GPS data is fresh and valid
    const isGPSFresh = gps_valid && !gps_timeout && coordinates_source === 'gps_live';
    
    // Check if coordinates are valid (not zero, null, or false)
    if (this.isValidCoordinates(latitude, longitude)) {
      if (isGPSFresh) {
        console.log(`[GPS BACKUP] Fresh GPS coordinates received for ${binId}: ${latitude}, ${longitude}`);
        
        // Update in-memory cache with valid coordinates
        this.validCoordinatesCache.set(binId, {
          latitude: latitude,
          longitude: longitude,
          timestamp: timestamp || Date.now(),
          satellites: satellites || 0,
          gps_valid: gps_valid || true
        });
        
        // Immediately backup valid coordinates (not just hourly)
        this.backupValidCoordinates(binId, latitude, longitude);
      } else {
        console.log(`[GPS BACKUP] Stale GPS data for ${binId} - using backup coordinates`);
      }
    } else {
      console.log(`[GPS BACKUP] Invalid GPS coordinates for ${binId}: ${latitude}, ${longitude} - Skipping backup`);
    }
  }

  // Process GPS data with fallback logic
  async processGPSData(binId, gpsData) {
    try {
      const { latitude, longitude, satellites, last_active, gps_timestamp, timestamp } = gpsData;
      
      // Check if current coordinates are valid
      if (this.isValidCoordinates(latitude, longitude)) {
        console.log(`[GPS PROCESSING] Valid coordinates for ${binId}: ${latitude}, ${longitude}`);
        
        // Update cache with valid coordinates
        this.validCoordinatesCache.set(binId, {
          latitude: latitude,
          longitude: longitude,
          timestamp: timestamp || Date.now(),
          satellites: satellites || 0,
          gps_valid: true
        });
        
        // Backup valid coordinates
        await this.backupValidCoordinates(binId, latitude, longitude);
        
        return {
          latitude: latitude,
          longitude: longitude,
          coordinates_source: 'gps_live',
          satellites: satellites || 0,
          timestamp: timestamp || Date.now()
        };
      } else {
        console.log(`[GPS PROCESSING] Invalid coordinates for ${binId}, checking backup...`);
        
        // Try to get backup coordinates
        const backupCoords = await this.getBackupCoordinates(binId);
        if (backupCoords) {
          console.log(`[GPS PROCESSING] Using backup coordinates for ${binId}: ${backupCoords.latitude}, ${backupCoords.longitude}`);
          return {
            latitude: backupCoords.latitude,
            longitude: backupCoords.longitude,
            coordinates_source: 'gps_fallback',
            satellites: 0,
            timestamp: backupCoords.timestamp || Date.now()
          };
        } else {
          console.log(`[GPS PROCESSING] No backup coordinates available for ${binId}`);
          return {
            latitude: latitude,
            longitude: longitude,
            coordinates_source: 'gps_invalid',
            satellites: satellites || 0,
            timestamp: timestamp || Date.now()
          };
        }
      }
    } catch (error) {
      console.error(`[GPS PROCESSING] Error processing GPS data for ${binId}:`, error);
      return {
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        coordinates_source: 'gps_error',
        satellites: gpsData.satellites || 0,
        timestamp: gpsData.timestamp || Date.now()
      };
    }
  }

  // Check if coordinates are valid
  isValidCoordinates(latitude, longitude) {
    return (
      latitude !== null && 
      latitude !== undefined && 
      latitude !== 0 &&
      longitude !== null && 
      longitude !== undefined && 
      longitude !== 0 &&
      !isNaN(latitude) && 
      !isNaN(longitude) &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  // Backup valid coordinates to separate backup storage
  async backupValidCoordinates(binId, latitude, longitude) {
    try {
      const currentTime = new Date().toISOString();
      
      // Store backup coordinates in separate location: monitoring/backup/bin1
      const rtdb = admin.database();
      const backupRef = rtdb.ref(`monitoring/backup/${binId}`);
      await backupRef.set({
        backup_latitude: latitude,
        backup_longitude: longitude,
        backup_timestamp: currentTime,
        backup_source: 'gps_backup_service',
        original_bin_id: binId,
        created_at: currentTime
      });
      
      console.log(`[GPS BACKUP] Successfully backed up coordinates for ${binId} to separate storage: ${latitude}, ${longitude}`);
      
      // Update last backup time
      this.lastBackupTime = new Date();
      
    } catch (error) {
      console.error(`[GPS BACKUP] Error backing up coordinates for ${binId}:`, error);
    }
  }

  // Start hourly backup process
  startHourlyBackup() {
    console.log('[GPS BACKUP] Starting hourly backup process...');
    
    // Run backup every hour (3600000 ms)
    this.backupInterval = setInterval(() => {
      this.performHourlyBackup();
    }, 3600000);
  }

  // Perform hourly backup of all valid coordinates
  async performHourlyBackup() {
    try {
      console.log('[GPS BACKUP] Performing hourly backup...');
      
      for (const [binId, coordinates] of this.validCoordinatesCache) {
        if (this.isValidCoordinates(coordinates.latitude, coordinates.longitude)) {
          await this.backupValidCoordinates(binId, coordinates.latitude, coordinates.longitude);
        }
      }
      
      console.log('[GPS BACKUP] Hourly backup completed');
    } catch (error) {
      console.error('[GPS BACKUP] Error during hourly backup:', error);
    }
  }

  // Get backup coordinates for a specific bin
  async getBackupCoordinates(binId) {
    try {
      const rtdb = admin.database();
      const snapshot = await rtdb.ref(`monitoring/backup/${binId}`).once('value');
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.backup_latitude && data.backup_longitude) {
          return {
            latitude: data.backup_latitude,
            longitude: data.backup_longitude,
            timestamp: data.backup_timestamp,
            source: 'backup'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error(`[GPS BACKUP] Error getting backup coordinates for ${binId}:`, error);
      return null;
    }
  }

  // Get coordinates for display with dynamic status
  async getDisplayCoordinates(binId) {
    try {
      const result = await dynamicBinStatusService.getDisplayCoordinatesWithStatus(binId);
      return result ? result.coordinates : null;
    } catch (error) {
      console.error(`[GPS BACKUP] Error getting display coordinates for ${binId}:`, error);
      return null;
    }
  }

  // Get dynamic bin status
  async getDynamicBinStatus(binId) {
    try {
      const rtdb = admin.database();
      const snapshot = await rtdb.ref(`monitoring/${binId}`).once('value');
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return dynamicBinStatusService.getDynamicBinStatus(binId, data);
      }
      
      return null;
    } catch (error) {
      console.error(`[GPS BACKUP] Error getting dynamic status for ${binId}:`, error);
      return null;
    }
  }

  // Get all bins with dynamic status
  async getAllBinsDynamicStatus() {
    try {
      return await dynamicBinStatusService.getAllBinsDynamicStatus();
    } catch (error) {
      console.error('[GPS BACKUP] Error getting all bins dynamic status:', error);
      return [];
    }
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      lastBackupTime: this.lastBackupTime,
      cachedCoordinatesCount: this.validCoordinatesCache.size,
      cachedBins: Array.from(this.validCoordinatesCache.keys())
    };
  }

  // Stop the service
  stop() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
    console.log('[GPS BACKUP] Service stopped');
  }
}

// Create singleton instance
const gpsBackupService = new GPSBackupService();

module.exports = gpsBackupService;
