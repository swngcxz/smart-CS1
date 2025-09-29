const { db } = require("../models/firebase");

class GPSFallbackService {
  constructor() {
    this.coordinateCache = new Map(); // In-memory cache for last known coordinates
    this.isInitialized = false;
  }

  // Initialize the service and load existing coordinates
  async initialize() {
    try {
      console.log("[GPS FALLBACK] Initializing GPS fallback service...");
      
      // Load existing coordinates from database
      await this.loadExistingCoordinates();
      
      this.isInitialized = true;
      console.log("[GPS FALLBACK] Service initialized successfully");
    } catch (error) {
      console.error("[GPS FALLBACK] Failed to initialize:", error);
    }
  }

  // Load existing coordinates from the database
  async loadExistingCoordinates() {
    try {
      const snapshot = await db.collection("bin_coordinates_backup").get();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        this.coordinateCache.set(doc.id, {
          latitude: data.latitude,
          longitude: data.longitude,
          lastUpdated: data.lastUpdated,
          binId: data.binId
        });
        console.log(`[GPS FALLBACK] Loaded coordinates for ${doc.id}: ${data.latitude}, ${data.longitude}`);
      });
    } catch (error) {
      console.error("[GPS FALLBACK] Error loading existing coordinates:", error);
    }
  }

  // Check if coordinates are valid (not zero)
  isValidCoordinates(latitude, longitude) {
    return latitude !== 0 && longitude !== 0 && 
           latitude !== null && longitude !== null &&
           !isNaN(latitude) && !isNaN(longitude) &&
           latitude >= -90 && latitude <= 90 &&
           longitude >= -180 && longitude <= 180;
  }

  // Process incoming GPS data - ESP32 handles caching, backend just validates and logs
  async processGPSData(binId, gpsData) {
    if (!this.isInitialized) {
      console.warn("[GPS FALLBACK] Service not initialized, skipping GPS processing");
      return gpsData;
    }

    const { latitude, longitude, satellites, last_active, gps_timestamp } = gpsData;
    
    // Determine GPS status based on ESP32 data
    const hasCoordinates = this.isValidCoordinates(latitude, longitude);
    const gps_valid = hasCoordinates && satellites > 0;
    const coordinates_source = hasCoordinates ? 'gps_live' : 'no_data';
    
    console.log(`[GPS FALLBACK] Processing ${binId}:`);
    console.log(`  Coordinates: ${latitude || 'N/A'}, ${longitude || 'N/A'}`);
    console.log(`  Satellites: ${satellites || 0}`);
    console.log(`  Status: ${coordinates_source}`);
    console.log(`  Last Active: ${last_active || 'Unknown'}`);
    console.log(`  GPS Time: ${gps_timestamp || 'N/A'}`);
    
    // Save valid coordinates for backup purposes
    if (hasCoordinates) {
      await this.saveCoordinates(binId, latitude, longitude);
    }
    
    return {
      ...gpsData,
      latitude: latitude || 0,
      longitude: longitude || 0,
      gps_valid,
      coordinates_source,
      last_active: last_active || 'Unknown',
      gps_timestamp: gps_timestamp || 'N/A'
    };
  }

  // Save coordinates to backup storage
  async saveCoordinates(binId, latitude, longitude, timestamp = null) {
    try {
      const currentTime = new Date().toISOString();
      const coordinateData = {
        binId,
        latitude,
        longitude,
        lastUpdated: timestamp || currentTime,
        timestamp: timestamp ? new Date(timestamp).getTime() : Date.now()
      };

      // Update in-memory cache
      this.coordinateCache.set(binId, coordinateData);

      // Save to database
      await db.collection("bin_coordinates_backup").doc(binId).set(coordinateData);
      
      console.log(`[GPS FALLBACK] Saved coordinates for ${binId}: ${latitude}, ${longitude}`);
    } catch (error) {
      console.error(`[GPS FALLBACK] Error saving coordinates for ${binId}:`, error);
    }
  }

  // Get fallback coordinates for a bin
  getFallbackCoordinates(binId) {
    return this.coordinateCache.get(binId) || null;
  }

  // Get all fallback coordinates
  getAllFallbackCoordinates() {
    const coordinates = {};
    this.coordinateCache.forEach((data, binId) => {
      coordinates[binId] = data;
    });
    return coordinates;
  }

  // Clear old coordinates (optional cleanup)
  async clearOldCoordinates(maxAgeHours = 24) {
    try {
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      const binsToRemove = [];

      this.coordinateCache.forEach((data, binId) => {
        if (data.timestamp < cutoffTime) {
          binsToRemove.push(binId);
        }
      });

      for (const binId of binsToRemove) {
        await db.collection("bin_coordinates_backup").doc(binId).delete();
        this.coordinateCache.delete(binId);
        console.log(`[GPS FALLBACK] Cleared old coordinates for ${binId}`);
      }
    } catch (error) {
      console.error("[GPS FALLBACK] Error clearing old coordinates:", error);
    }
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      cachedCoordinatesCount: this.coordinateCache.size,
      cachedBins: Array.from(this.coordinateCache.keys())
    };
  }
}

// Create singleton instance
const gpsFallbackService = new GPSFallbackService();

module.exports = gpsFallbackService;
