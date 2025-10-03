const { db } = require('./firebase');

class GpsBackupModel {
  // Save last known GPS coordinates when GPS malfunctions
  static async saveLastKnownCoordinates(binId, coordinates, timestamp) {
    try {
      const gpsBackupRef = db.collection('gpsBackup').doc(binId);
      
      const backupData = {
        binId,
        lastKnownLatitude: coordinates.latitude,
        lastKnownLongitude: coordinates.longitude,
        lastUpdateTime: timestamp || new Date().toISOString(),
        status: 'offline',
        reason: 'gps_malfunction'
      };
      
      await gpsBackupRef.set(backupData, { merge: true });
      console.log(`GPS backup saved for bin ${binId}:`, coordinates);
      return backupData;
    } catch (error) {
      console.error('Error saving GPS backup:', error);
      throw error;
    }
  }

  // Get last known coordinates for a bin
  static async getLastKnownCoordinates(binId) {
    try {
      const gpsBackupRef = db.collection('gpsBackup').doc(binId);
      const doc = await gpsBackupRef.get();
      
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting GPS backup:', error);
      throw error;
    }
  }

  // Get all GPS backup records
  static async getAllGpsBackups() {
    try {
      const gpsBackupRef = db.collection('gpsBackup');
      const snapshot = await gpsBackupRef.get();
      
      const backups = [];
      snapshot.forEach(doc => {
        backups.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return backups;
    } catch (error) {
      console.error('Error getting all GPS backups:', error);
      throw error;
    }
  }

  // Update GPS backup when GPS comes back online
  static async updateGpsStatus(binId, isOnline, currentCoordinates = null) {
    try {
      const gpsBackupRef = db.collection('gpsBackup').doc(binId);
      
      const updateData = {
        status: isOnline ? 'online' : 'offline',
        lastUpdateTime: new Date().toISOString(),
        reason: isOnline ? 'gps_restored' : 'gps_malfunction'
      };

      // If GPS is back online and we have current coordinates, update them
      if (isOnline && currentCoordinates) {
        updateData.currentLatitude = currentCoordinates.latitude;
        updateData.currentLongitude = currentCoordinates.longitude;
      }
      
      await gpsBackupRef.set(updateData, { merge: true });
      console.log(`GPS status updated for bin ${binId}: ${isOnline ? 'online' : 'offline'}`);
      return updateData;
    } catch (error) {
      console.error('Error updating GPS status:', error);
      throw error;
    }
  }

  // Delete GPS backup record (when bin is removed or GPS is permanently restored)
  static async deleteGpsBackup(binId) {
    try {
      const gpsBackupRef = db.collection('gpsBackup').doc(binId);
      await gpsBackupRef.delete();
      console.log(`GPS backup deleted for bin ${binId}`);
      return true;
    } catch (error) {
      console.error('Error deleting GPS backup:', error);
      throw error;
    }
  }

  // Check if coordinates indicate GPS malfunction (0,0 or invalid)
  static isGpsMalfunctioning(latitude, longitude) {
    // GPS malfunction indicators:
    // - Coordinates are exactly (0, 0)
    // - Coordinates are null or undefined
    // - Coordinates are outside valid GPS ranges
    return (
      (latitude === 0 && longitude === 0) ||
      latitude === null || longitude === null ||
      latitude === undefined || longitude === undefined ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    );
  }
}

module.exports = GpsBackupModel;
