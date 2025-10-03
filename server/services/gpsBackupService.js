const GpsBackupModel = require('../models/gpsBackupModel');

class GpsBackupService {
  // Monitor bin GPS coordinates and save backup when GPS malfunctions
  static async monitorBinGpsCoordinates(binId, currentCoordinates) {
    try {
      const { latitude, longitude } = currentCoordinates;
      
      // Check if GPS is malfunctioning
      const isGpsMalfunctioning = GpsBackupModel.isGpsMalfunctioning(latitude, longitude);
      
      if (isGpsMalfunctioning) {
        console.log(`GPS malfunction detected for bin ${binId}: coordinates (${latitude}, ${longitude})`);
        
        // Check if we already have backup coordinates for this bin
        const existingBackup = await GpsBackupModel.getLastKnownCoordinates(binId);
        
        if (!existingBackup) {
          console.log(`No backup coordinates found for bin ${binId}. Cannot provide fallback location.`);
          return {
            success: false,
            message: 'No backup coordinates available',
            binId,
            isGpsMalfunctioning: true
          };
        }
        
        // Update GPS status to offline
        await GpsBackupModel.updateGpsStatus(binId, false);
        
        return {
          success: true,
          message: 'Using backup coordinates',
          binId,
          isGpsMalfunctioning: true,
          backupCoordinates: {
            latitude: existingBackup.lastKnownLatitude,
            longitude: existingBackup.lastKnownLongitude
          },
          lastUpdateTime: existingBackup.lastUpdateTime
        };
      } else {
        // GPS is working, save current coordinates as backup
        await GpsBackupModel.saveLastKnownCoordinates(binId, currentCoordinates);
        
        // Update GPS status to online
        await GpsBackupModel.updateGpsStatus(binId, true, currentCoordinates);
        
        console.log(`GPS backup updated for bin ${binId}: coordinates (${latitude}, ${longitude})`);
        
        return {
          success: true,
          message: 'GPS working normally, backup updated',
          binId,
          isGpsMalfunctioning: false,
          currentCoordinates
        };
      }
    } catch (error) {
      console.error(`Error monitoring GPS for bin ${binId}:`, error);
      throw error;
    }
  }

  // Process multiple bins at once
  static async processMultipleBins(bins) {
    try {
      const results = [];
      
      for (const bin of bins) {
        const result = await this.monitorBinGpsCoordinates(bin.id, {
          latitude: bin.latitude || bin.position?.[0],
          longitude: bin.longitude || bin.position?.[1]
        });
        
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error processing multiple bins:', error);
      throw error;
    }
  }

  // Initialize GPS backup for a new bin (called when bin is first deployed)
  static async initializeBinGpsBackup(binId, initialCoordinates) {
    try {
      if (!initialCoordinates || !initialCoordinates.latitude || !initialCoordinates.longitude) {
        throw new Error('Initial coordinates are required');
      }

      await GpsBackupModel.saveLastKnownCoordinates(binId, initialCoordinates);
      await GpsBackupModel.updateGpsStatus(binId, true, initialCoordinates);
      
      console.log(`GPS backup initialized for new bin ${binId}`);
      return {
        success: true,
        message: 'GPS backup initialized',
        binId,
        coordinates: initialCoordinates
      };
    } catch (error) {
      console.error(`Error initializing GPS backup for bin ${binId}:`, error);
      throw error;
    }
  }

  // Get GPS status summary
  static async getGpsStatusSummary() {
    try {
      const allBackups = await GpsBackupModel.getAllGpsBackups();
      
      const summary = {
        totalBins: allBackups.length,
        onlineBins: allBackups.filter(backup => backup.status === 'online').length,
        offlineBins: allBackups.filter(backup => backup.status === 'offline').length,
        recentlyOffline: allBackups.filter(backup => {
          const lastUpdate = new Date(backup.lastUpdateTime);
          const now = new Date();
          const diffMinutes = (now.getTime() - lastUpdate.getTime()) / 60000;
          return backup.status === 'offline' && diffMinutes <= 10;
        }).length
      };
      
      return summary;
    } catch (error) {
      console.error('Error getting GPS status summary:', error);
      throw error;
    }
  }
}

module.exports = GpsBackupService;

