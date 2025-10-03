const GpsBackupModel = require('../models/gpsBackupModel');

class GpsBackupController {
  // Get all GPS backup records
  static async getAllGpsBackups(req, res) {
    try {
      const backups = await GpsBackupModel.getAllGpsBackups();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get GPS backup for specific bin
  static async getBinGpsBackup(req, res) {
    try {
      const { binId } = req.params;
      const backup = await GpsBackupModel.getLastKnownCoordinates(binId);
      
      if (backup) {
        res.json(backup);
      } else {
        res.status(404).json({ error: 'GPS backup not found for this bin' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Save last known coordinates (called when GPS malfunctions)
  static async saveLastKnownCoordinates(req, res) {
    try {
      const { binId, coordinates, timestamp } = req.body;
      
      if (!binId || !coordinates) {
        return res.status(400).json({ error: 'binId and coordinates are required' });
      }

      const backup = await GpsBackupModel.saveLastKnownCoordinates(binId, coordinates, timestamp);
      res.json(backup);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Update GPS status (online/offline)
  static async updateGpsStatus(req, res) {
    try {
      const { binId } = req.params;
      const { isOnline, currentCoordinates } = req.body;
      
      if (typeof isOnline !== 'boolean') {
        return res.status(400).json({ error: 'isOnline must be a boolean' });
      }

      const updateData = await GpsBackupModel.updateGpsStatus(binId, isOnline, currentCoordinates);
      res.json(updateData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete GPS backup
  static async deleteGpsBackup(req, res) {
    try {
      const { binId } = req.params;
      await GpsBackupModel.deleteGpsBackup(binId);
      res.json({ message: 'GPS backup deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Check GPS status for multiple bins
  static async checkMultipleBinsGpsStatus(req, res) {
    try {
      const { bins } = req.body; // Array of bin objects with current coordinates
      
      if (!Array.isArray(bins)) {
        return res.status(400).json({ error: 'bins must be an array' });
      }

      const results = [];
      
      for (const bin of bins) {
        const isMalfunctioning = GpsBackupModel.isGpsMalfunctioning(
          bin.latitude || bin.position?.[0], 
          bin.longitude || bin.position?.[1]
        );
        
        let backupData = null;
        if (isMalfunctioning) {
          // Get last known coordinates
          backupData = await GpsBackupModel.getLastKnownCoordinates(bin.id);
          
          // If no backup exists, we can't help
          if (!backupData) {
            results.push({
              binId: bin.id,
              status: 'no_backup',
              message: 'No backup coordinates available'
            });
            continue;
          }
        }

        results.push({
          binId: bin.id,
          isGpsMalfunctioning: isMalfunctioning,
          backupData: backupData,
          currentCoordinates: {
            latitude: bin.latitude || bin.position?.[0],
            longitude: bin.longitude || bin.position?.[1]
          }
        });
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = GpsBackupController;

