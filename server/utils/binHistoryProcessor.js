const binHistoryController = require('../controllers/binHistoryController');

/**
 * Utility class for processing real-time bin monitoring data
 * and integrating with the existing monitoring system
 */
class BinHistoryProcessor {
  /**
   * Process real-time monitoring data from the existing system
   * @param {Object} monitoringData - Data from the monitoring system
   * @returns {Promise<Object>} Processing result
   */
  static async processMonitoringData(monitoringData) {
    try {
      // Extract data from the monitoring system format
      const {
        binId,
        weight,
        distance,
        binLevel,
        gps,
        gpsValid,
        satellites,
        errorMessage
      } = monitoringData;

      // Process through the bin history controller
      const result = await binHistoryController.processRealTimeData({
        binId,
        weight,
        distance,
        binLevel,
        gps,
        gpsValid,
        satellites,
        errorMessage
      });

      return result;
    } catch (error) {
      console.error('[BIN HISTORY PROCESSOR] Error processing monitoring data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process data from the existing Firebase Realtime Database monitoring
   * @param {Object} firebaseData - Data from Firebase Realtime Database
   * @returns {Promise<Object>} Processing result
   */
  static async processFirebaseMonitoringData(firebaseData) {
    try {
      // Extract data from Firebase format
      const {
        weight,
        distance,
        binLevel,
        gps,
        gpsValid,
        satellites,
        errorMessage,
        timestamp
      } = firebaseData;

      // Determine bin ID from the data path or use default
      const binId = firebaseData.binId || 'bin1'; // Default to bin1 if not specified

      // Process through the bin history controller
      const result = await binHistoryController.processRealTimeData({
        binId,
        weight,
        distance,
        binLevel,
        gps,
        gpsValid,
        satellites,
        errorMessage,
        timestamp
      });

      return result;
    } catch (error) {
      console.error('[BIN HISTORY PROCESSOR] Error processing Firebase data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process error messages and create appropriate history records
   * @param {string} binId - Bin identifier
   * @param {string} errorMessage - Error message to process
   * @param {Object} additionalData - Additional monitoring data
   * @returns {Promise<Object>} Processing result
   */
  static async processError(binId, errorMessage, additionalData = {}) {
    try {
      const {
        weight = 0,
        distance = 0,
        binLevel = 0,
        gps = { lat: 0, lng: 0 },
        gpsValid = false,
        satellites = 0
      } = additionalData;

      // Process through the bin history controller
      const result = await binHistoryController.processRealTimeData({
        binId,
        weight,
        distance,
        binLevel,
        gps,
        gpsValid,
        satellites,
        errorMessage
      });

      return result;
    } catch (error) {
      console.error('[BIN HISTORY PROCESSOR] Error processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process data from the existing monitoring system in index.js
   * This integrates with the current real-time monitoring setup
   * @param {Object} data - Monitoring data from the existing system
   * @returns {Promise<Object>} Processing result
   */
  static async processExistingMonitoringData(data) {
    try {
      // Extract data from the existing monitoring format
      const {
        weight,
        distance,
        binLevel,
        gps,
        gpsValid,
        satellites,
        errorMessage
      } = data;

      // Use the existing bin ID from the monitoring system
      const binId = 'bin1'; // This matches the existing bin1Ref in index.js

      // Process through the bin history controller
      const result = await binHistoryController.processRealTimeData({
        binId,
        weight,
        distance,
        binLevel,
        gps,
        gpsValid,
        satellites,
        errorMessage
      });

      return result;
    } catch (error) {
      console.error('[BIN HISTORY PROCESSOR] Error processing existing monitoring data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = BinHistoryProcessor;
