const binHistoryModel = require('../models/binHistoryModel');
const hybridDataService = require('../services/hybridDataService');

class BinHistoryController {
  /**
   * Process incoming real-time bin data using hybrid storage approach
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

      // Prepare data for hybrid processing
      const binData = {
        binId,
        weight,
        distance,
        binLevel,
        gps,
        gpsValid,
        satellites,
        errorMessage
      };

      // Process through hybrid service
      const result = await hybridDataService.processIncomingData(binData);

      console.log(`[BIN HISTORY CONTROLLER] Processed data for bin ${binId}: Action=${result.action}`);

      res.status(201).json({
        success: result.success,
        message: result.success ? 'Bin data processed successfully' : 'Bin data filtered',
        action: result.action,
        data: result.recordId ? { id: result.recordId } : null,
        stats: hybridDataService.getStats()
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
   * Get all bin history data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllBinHistory(req, res) {
    try {
      const { limit = 1000, binId, status, startDate, endDate } = req.query;
      
      console.log(`[BIN HISTORY CONTROLLER] Fetching all bin history - limit: ${limit}, binId: ${binId}, status: ${status}`);
      
      // Get all records using the model's getAllBinHistory method
      const records = await binHistoryModel.getAllBinHistory(parseInt(limit));
      
      // Apply filters
      let filteredRecords = records;
      
      if (binId) {
        filteredRecords = filteredRecords.filter(record => record.binId === binId);
      }
      
      if (status) {
        filteredRecords = filteredRecords.filter(record => record.status.toLowerCase() === status.toLowerCase());
      }
      
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        
        filteredRecords = filteredRecords.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= start && recordDate <= end;
        });
      }
      
      // Calculate statistics
      const stats = {
        totalRecords: filteredRecords.length,
        criticalCount: filteredRecords.filter(r => r.status === 'CRITICAL').length,
        warningCount: filteredRecords.filter(r => r.status === 'WARNING').length,
        normalCount: filteredRecords.filter(r => r.status === 'OK').length,
        errorCount: filteredRecords.filter(r => r.status === 'ERROR').length,
        malfunctionCount: filteredRecords.filter(r => r.status === 'MALFUNCTION').length
      };
      
      console.log(`[BIN HISTORY CONTROLLER] Returning ${filteredRecords.length} bin history records`);
      
      res.status(200).json({
        success: true,
        message: 'All bin history retrieved successfully',
        records: filteredRecords,
        stats: stats,
        filters: {
          limit: parseInt(limit),
          binId: binId || null,
          status: status || null,
          startDate: startDate || null,
          endDate: endDate || null
        },
        count: filteredRecords.length
      });

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error retrieving all bin history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve all bin history',
        error: error.message
      });
    }
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
   * Process real-time data from monitoring system using hybrid approach
   * This method can be called internally or via webhook
   * @param {Object} monitoringData - Real-time monitoring data
   * @returns {Object} Processed result
   */
  async processRealTimeData(monitoringData) {
    try {
      const result = await hybridDataService.processIncomingData(monitoringData);
      
      console.log(`[REAL-TIME] Processed monitoring data for bin ${monitoringData.binId}: Action=${result.action}`);

      // Return result in the expected format for backward compatibility
      return {
        success: result.success,
        action: result.action,
        priority: result.priority,
        status: this.determineStatusFromResult(result, monitoringData),
        recordId: result.recordId,
        error: result.error
      };

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error processing real-time data:', error);
      return {
        success: false,
        error: error.message,
        status: 'ERROR'
      };
    }
  }

  /**
   * Determine status from hybrid service result
   * @param {Object} result - Hybrid service result
   * @param {Object} monitoringData - Original monitoring data
   * @returns {string} Status string
   */
  determineStatusFromResult(result, monitoringData) {
    if (!result.success) {
      return 'ERROR';
    }

    // Check for critical conditions
    if (monitoringData.binLevel >= 90) {
      return 'CRITICAL';
    } else if (monitoringData.binLevel >= 70) {
      return 'WARNING';
    } else if (monitoringData.errorMessage) {
      return 'ERROR';
    } else if (!monitoringData.gpsValid || monitoringData.satellites < 3) {
      return 'WARNING';
    } else {
      return 'OK';
    }
  }

  /**
   * Get hybrid system statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHybridStats(req, res) {
    try {
      const stats = hybridDataService.getStats();
      
      res.status(200).json({
        success: true,
        message: 'Hybrid system statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error retrieving hybrid stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve hybrid statistics',
        error: error.message
      });
    }
  }

  /**
   * Get latest data for a bin from memory buffer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getLatestBinData(req, res) {
    try {
      const { binId } = req.params;
      
      const latestData = hybridDataService.getLatestData(binId);
      
      if (!latestData) {
        return res.status(404).json({
          success: false,
          message: 'No recent data found for this bin'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Latest bin data retrieved successfully',
        data: latestData
      });

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error retrieving latest data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve latest bin data',
        error: error.message
      });
    }
  }

  /**
   * Get all latest data from memory buffer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllLatestData(req, res) {
    try {
      const allLatestData = hybridDataService.getAllLatestData();
      
      res.status(200).json({
        success: true,
        message: 'All latest data retrieved successfully',
        data: allLatestData,
        count: allLatestData.length
      });

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error retrieving all latest data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve all latest data',
        error: error.message
      });
    }
  }

  /**
   * Force process all buffered data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async forceProcessAll(req, res) {
    try {
      const results = await hybridDataService.forceProcessAll();
      
      res.status(200).json({
        success: true,
        message: 'All buffered data processed successfully',
        data: results
      });

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error force processing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process buffered data',
        error: error.message
      });
    }
  }

  /**
   * Update hybrid system configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateHybridConfig(req, res) {
    try {
      const newConfig = req.body;
      
      hybridDataService.updateConfig(newConfig);
      
      res.status(200).json({
        success: true,
        message: 'Hybrid system configuration updated successfully',
        data: newConfig
      });

    } catch (error) {
      console.error('[BIN HISTORY CONTROLLER] Error updating config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update configuration',
        error: error.message
      });
    }
  }
}

module.exports = new BinHistoryController();
