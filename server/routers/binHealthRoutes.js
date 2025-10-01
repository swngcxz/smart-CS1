const express = require('express');
const router = express.Router();
const binHealthMonitor = require('../services/binHealthMonitor');

// Get bin health monitor status
router.get('/status', (req, res) => {
  try {
    const status = binHealthMonitor.getStatus();
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start bin health monitoring
router.post('/start', (req, res) => {
  try {
    binHealthMonitor.start();
    res.status(200).json({
      success: true,
      message: 'Bin health monitoring started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stop bin health monitoring
router.post('/stop', (req, res) => {
  try {
    binHealthMonitor.stop();
    res.status(200).json({
      success: true,
      message: 'Bin health monitoring stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manually trigger health check
router.post('/check', async (req, res) => {
  try {
    await binHealthMonitor.manualHealthCheck();
    res.status(200).json({
      success: true,
      message: 'Manual health check completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

