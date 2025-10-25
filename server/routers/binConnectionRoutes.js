/**
 * Bin Connection Routes
 * API endpoints for monitoring bin connections and connection errors
 */

const express = require('express');
const router = express.Router();
const binConnectionMonitor = require('../services/binConnectionMonitor');

/**
 * @route GET /api/bin-connections/status
 * @desc Get connection status for all bins
 * @access Private
 */
router.get('/status', async (req, res) => {
  try {
    const statuses = binConnectionMonitor.getAllConnectionStatuses();
    const stats = binConnectionMonitor.getStats();
    
    res.json({
      success: true,
      data: {
        statuses,
        stats
      }
    });
  } catch (error) {
    console.error('[BIN CONNECTION ROUTES] Error getting connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connection status',
      error: error.message
    });
  }
});

/**
 * @route GET /api/bin-connections/status/:binId
 * @desc Get connection status for a specific bin
 * @access Private
 */
router.get('/status/:binId', async (req, res) => {
  try {
    const { binId } = req.params;
    const status = binConnectionMonitor.getConnectionStatus(binId);
    
    res.json({
      success: true,
      data: {
        binId,
        ...status
      }
    });
  } catch (error) {
    console.error(`[BIN CONNECTION ROUTES] Error getting status for bin ${req.params.binId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bin connection status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/bin-connections/check/:binId
 * @desc Manually trigger connection check for a specific bin
 * @access Private
 */
router.post('/check/:binId', async (req, res) => {
  try {
    const { binId } = req.params;
    
    await binConnectionMonitor.triggerConnectionCheck(binId);
    
    res.json({
      success: true,
      message: `Connection check triggered for bin ${binId}`
    });
  } catch (error) {
    console.error(`[BIN CONNECTION ROUTES] Error checking connection for bin ${req.params.binId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to check bin connection',
      error: error.message
    });
  }
});

/**
 * @route POST /api/bin-connections/check-all
 * @desc Manually trigger connection check for all bins
 * @access Private
 */
router.post('/check-all', async (req, res) => {
  try {
    await binConnectionMonitor.checkAllBinConnections();
    
    res.json({
      success: true,
      message: 'Connection check triggered for all bins'
    });
  } catch (error) {
    console.error('[BIN CONNECTION ROUTES] Error checking all connections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check all bin connections',
      error: error.message
    });
  }
});

/**
 * @route GET /api/bin-connections/stats
 * @desc Get connection monitoring statistics
 * @access Private
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = binConnectionMonitor.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[BIN CONNECTION ROUTES] Error getting connection stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connection statistics',
      error: error.message
    });
  }
});

/**
 * @route POST /api/bin-connections/start
 * @desc Start connection monitoring
 * @access Private
 */
router.post('/start', async (req, res) => {
  try {
    binConnectionMonitor.startMonitoring();
    
    res.json({
      success: true,
      message: 'Connection monitoring started'
    });
  } catch (error) {
    console.error('[BIN CONNECTION ROUTES] Error starting monitoring:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start connection monitoring',
      error: error.message
    });
  }
});

/**
 * @route POST /api/bin-connections/stop
 * @desc Stop connection monitoring
 * @access Private
 */
router.post('/stop', async (req, res) => {
  try {
    binConnectionMonitor.stopMonitoring();
    
    res.json({
      success: true,
      message: 'Connection monitoring stopped'
    });
  } catch (error) {
    console.error('[BIN CONNECTION ROUTES] Error stopping monitoring:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop connection monitoring',
      error: error.message
    });
  }
});

module.exports = router;
