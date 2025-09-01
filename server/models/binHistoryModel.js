const { db } = require('./firebase');

class BinHistoryModel {
  constructor() {
    this.collection = 'binHistory';
  }

  /**
   * Create a new bin history record
   * @param {Object} binData - Bin monitoring data
   * @returns {Promise<Object>} Created document reference
   */
  async createBinHistoryRecord(binData) {
    try {
      const {
        binId,
        weight,
        distance,
        binLevel,
        gps,
        gpsValid,
        satellites,
        status,
        errorMessage
      } = binData;

      const binHistoryData = {
        binId,
        timestamp: new Date(),
        weight: parseFloat(weight) || 0,
        distance: parseFloat(distance) || 0,
        binLevel: parseFloat(binLevel) || 0,
        gps: {
          lat: parseFloat(gps?.lat) || 0,
          lng: parseFloat(gps?.lng) || 0
        },
        gpsValid: Boolean(gpsValid),
        satellites: parseInt(satellites) || 0,
        status: status || 'OK',
        errorMessage: errorMessage || null,
        createdAt: new Date()
      };

      const docRef = await db.collection(this.collection).add(binHistoryData);
      
      console.log(`[BIN HISTORY] Created record for bin ${binId} with status: ${status}`);
      
      return {
        id: docRef.id,
        ...binHistoryData
      };
    } catch (error) {
      console.error('[BIN HISTORY MODEL] Error creating record:', error);
      throw new Error(`Failed to create bin history record: ${error.message}`);
    }
  }

  /**
   * Get bin history by bin ID
   * @param {string} binId - Bin identifier
   * @param {number} limit - Number of records to return (default: 100)
   * @returns {Promise<Array>} Array of bin history records
   */
  async getBinHistory(binId, limit = 100) {
    try {
      const snapshot = await db.collection(this.collection)
        .where('binId', '==', binId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const records = [];
      snapshot.forEach(doc => {
        records.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`[BIN HISTORY] Retrieved ${records.length} records for bin ${binId}`);
      return records;
    } catch (error) {
      console.error('[BIN HISTORY MODEL] Error retrieving bin history:', error);
      throw new Error(`Failed to retrieve bin history: ${error.message}`);
    }
  }

  /**
   * Get bin history with error status
   * @param {string} binId - Bin identifier (optional)
   * @param {number} limit - Number of records to return (default: 50)
   * @returns {Promise<Array>} Array of error records
   */
  async getErrorRecords(binId = null, limit = 50) {
    try {
      let query = db.collection(this.collection)
        .where('status', 'in', ['ERROR', 'MALFUNCTION'])
        .orderBy('timestamp', 'desc')
        .limit(limit);

      if (binId) {
        query = query.where('binId', '==', binId);
      }

      const snapshot = await query.get();

      const records = [];
      snapshot.forEach(doc => {
        records.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`[BIN HISTORY] Retrieved ${records.length} error records`);
      return records;
    } catch (error) {
      console.error('[BIN HISTORY MODEL] Error retrieving error records:', error);
      throw new Error(`Failed to retrieve error records: ${error.message}`);
    }
  }

  /**
   * Get bin history statistics
   * @param {string} binId - Bin identifier
   * @param {Date} startDate - Start date for statistics
   * @param {Date} endDate - End date for statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getBinHistoryStats(binId, startDate, endDate) {
    try {
      const snapshot = await db.collection(this.collection)
        .where('binId', '==', binId)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();

      let totalRecords = 0;
      let errorCount = 0;
      let malfunctionCount = 0;
      let avgWeight = 0;
      let avgBinLevel = 0;
      let totalWeight = 0;
      let totalBinLevel = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        totalRecords++;
        
        if (data.status === 'ERROR') errorCount++;
        if (data.status === 'MALFUNCTION') malfunctionCount++;
        
        totalWeight += data.weight || 0;
        totalBinLevel += data.binLevel || 0;
      });

      if (totalRecords > 0) {
        avgWeight = totalWeight / totalRecords;
        avgBinLevel = totalBinLevel / totalRecords;
      }

      return {
        totalRecords,
        errorCount,
        malfunctionCount,
        avgWeight: Math.round(avgWeight * 100) / 100,
        avgBinLevel: Math.round(avgBinLevel * 100) / 100,
        errorRate: totalRecords > 0 ? (errorCount / totalRecords * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('[BIN HISTORY MODEL] Error retrieving statistics:', error);
      throw new Error(`Failed to retrieve statistics: ${error.message}`);
    }
  }

  /**
   * Delete old bin history records (cleanup)
   * @param {number} daysOld - Delete records older than this many days
   * @returns {Promise<number>} Number of deleted records
   */
  async cleanupOldRecords(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const snapshot = await db.collection(this.collection)
        .where('timestamp', '<', cutoffDate)
        .get();

      const batch = db.batch();
      let deletedCount = 0;

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      if (deletedCount > 0) {
        await batch.commit();
        console.log(`[BIN HISTORY] Cleaned up ${deletedCount} old records`);
      }

      return deletedCount;
    } catch (error) {
      console.error('[BIN HISTORY MODEL] Error cleaning up old records:', error);
      throw new Error(`Failed to cleanup old records: ${error.message}`);
    }
  }
}

module.exports = new BinHistoryModel();
