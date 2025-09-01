const binHistoryModel = require('../models/binHistoryModel');

class BinHistoryController {
  /**
   * Process incoming real-time bin data and create history record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processBinData(req, res) {
    try {
      const {
        binId,
        weight,
        distance,
        binLevel,
        gps,
        gpsValid,
        satellites,
        errorMessage
      } = req.body;

      // Validate required fields
      if (!binId) {
        return res.status(400).json({
          success: false,
          message: 'binId is required'
        });
      }

      // Detect errors and determine status
      const { status, finalErrorMessage } = this.detectErrors({
        gpsValid,
        satellites,
        errorMessage,
        gps
      });

      // Prepare bin data for storage
      const binData = {
        binId,
        weight,
        distance,
        binLevel,
        gps,
        gpsValid,
        satellites,
        status,
        errorMessage: finalErrorMessage
      };

      // Create history record
      const record = await binHistoryModel.createBinHistoryRecord(binData);

      console.log(`[BIN HISTORY CONTROLLER] Processed data for bin ${binId}: Status=${status}`);

      res.status(201).json({
        success: true,
        message: 'Bin data processed successfully',
        data: record
      });

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error processing bin data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process bin data',
        error: error.message
      });
    }
  }

  /**
   * Detect errors in bin monitoring data
   * @param {Object} data - Monitoring data
   * @returns {Object} Status and error message
   */
  detectErrors(data) {
    const { gpsValid, satellites, errorMessage, gps } = data;
    let status = 'OK';
    let finalErrorMessage = null;

    // Check for existing error messages
    if (errorMessage) {
      status = 'ERROR';
      finalErrorMessage = errorMessage;
      
      // Check for specific error patterns
      if (errorMessage.includes('Error opening port')) {
        finalErrorMessage = `Port Error: ${errorMessage}`;
      } else if (errorMessage.includes('Modem not connected')) {
        finalErrorMessage = `Modem Connection Error: ${errorMessage}`;
      }
    }

    // Check GPS validity
    if (!gpsValid || satellites === 0) {
      status = 'ERROR';
      finalErrorMessage = finalErrorMessage || 'GPS signal invalid or no satellites detected';
    }

    // Check for invalid GPS coordinates (0,0 typically indicates no GPS fix)
    if (gps && (gps.lat === 0 && gps.lng === 0)) {
      status = 'ERROR';
      finalErrorMessage = finalErrorMessage || 'GPS coordinates invalid (0,0) - no GPS fix';
    }

    // Check for extreme values that might indicate malfunction
    if (data.weight !== undefined && (data.weight < 0 || data.weight > 1000)) {
      status = 'MALFUNCTION';
      finalErrorMessage = finalErrorMessage || `Weight reading abnormal: ${data.weight} kg`;
    }

    if (data.binLevel !== undefined && (data.binLevel < 0 || data.binLevel > 100)) {
      status = 'MALFUNCTION';
      finalErrorMessage = finalErrorMessage || `Bin level reading abnormal: ${data.binLevel}%`;
    }

    return { status, finalErrorMessage };
  }

  /**
   * Get bin history by bin ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getBinHistory(req, res) {
    try {
      const { binId } = req.params;
      const { limit = 100 } = req.query;

      const history = await binHistoryModel.getBinHistory(binId, parseInt(limit));

      res.status(200).json({
        success: true,
        message: 'Bin history retrieved successfully',
        data: history,
        count: history.length
      });

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error retrieving bin history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve bin history',
        error: error.message
      });
    }
  }

  /**
   * Get error records
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getErrorRecords(req, res) {
    try {
      const { binId, limit = 50 } = req.query;

      const errorRecords = await binHistoryModel.getErrorRecords(binId, parseInt(limit));

      res.status(200).json({
        success: true,
        message: 'Error records retrieved successfully',
        data: errorRecords,
        count: errorRecords.length
      });

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error retrieving error records:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve error records',
        error: error.message
      });
    }
  }

  /**
   * Get bin history statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getBinHistoryStats(req, res) {
    try {
      const { binId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate are required'
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
        });
      }

      const stats = await binHistoryModel.getBinHistoryStats(binId, start, end);

      res.status(200).json({
        success: true,
        message: 'Bin history statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error retrieving statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        error: error.message
      });
    }
  }

  /**
   * Cleanup old records
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async cleanupOldRecords(req, res) {
    try {
      const { daysOld = 90 } = req.query;

      const deletedCount = await binHistoryModel.cleanupOldRecords(parseInt(daysOld));

      res.status(200).json({
        success: true,
        message: 'Cleanup completed successfully',
        data: {
          deletedRecords: deletedCount,
          daysOld: parseInt(daysOld)
        }
      });

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error during cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup old records',
        error: error.message
      });
    }
  }

  /**
   * Process real-time data from monitoring system
   * This method can be called internally or via webhook
   * @param {Object} monitoringData - Real-time monitoring data
   * @returns {Object} Processed result
   */
  async processRealTimeData(monitoringData) {
    try {
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

      // Detect errors and determine status
      const { status, finalErrorMessage } = this.detectErrors({
        gpsValid,
        satellites,
        errorMessage,
        gps
      });

      // Prepare bin data for storage
      const binData = {
        binId,
        weight,
        distance,
        binLevel,
        gps,
        gpsValid,
        satellites,
        status,
        errorMessage: finalErrorMessage
      };

      // Create history record
      const record = await binHistoryModel.createBinHistoryRecord(binData);

      console.log(`[REAL-TIME] Processed monitoring data for bin ${binId}: Status=${status}`);

      return {
        success: true,
        status,
        record
      };

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error processing real-time data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new BinHistoryController();
