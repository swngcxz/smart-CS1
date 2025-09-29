const express = require('express');
const router = express.Router();
const gpsFallbackService = require('../services/gpsFallbackService');

// Get GPS fallback service status
router.get('/status', (req, res) => {
  try {
    const status = gpsFallbackService.getStatus();
    res.status(200).json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('[GPS FALLBACK API] Error getting status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all fallback coordinates
router.get('/coordinates', (req, res) => {
  try {
    const coordinates = gpsFallbackService.getAllFallbackCoordinates();
    res.status(200).json({
      success: true,
      coordinates: coordinates
    });
  } catch (error) {
    console.error('[GPS FALLBACK API] Error getting coordinates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get fallback coordinates for a specific bin
router.get('/coordinates/:binId', (req, res) => {
  try {
    const { binId } = req.params;
    const coordinates = gpsFallbackService.getFallbackCoordinates(binId);
    
    if (coordinates) {
      res.status(200).json({
        success: true,
        binId: binId,
        coordinates: coordinates
      });
    } else {
      res.status(404).json({
        success: false,
        error: `No fallback coordinates found for bin ${binId}`
      });
    }
  } catch (error) {
    console.error('[GPS FALLBACK API] Error getting coordinates for bin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manually save coordinates for a bin (for testing or manual updates)
router.post('/coordinates/:binId', (req, res) => {
  try {
    const { binId } = req.params;
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    if (!gpsFallbackService.isValidCoordinates(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates provided'
      });
    }
    
    gpsFallbackService.saveCoordinates(binId, latitude, longitude);
    
    res.status(200).json({
      success: true,
      message: `Coordinates saved for bin ${binId}`,
      coordinates: {
        binId,
        latitude,
        longitude,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[GPS FALLBACK API] Error saving coordinates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear old coordinates
router.delete('/coordinates/cleanup', (req, res) => {
  try {
    const { maxAgeHours = 24 } = req.query;
    gpsFallbackService.clearOldCoordinates(parseInt(maxAgeHours));
    
    res.status(200).json({
      success: true,
      message: `Cleared coordinates older than ${maxAgeHours} hours`
    });
  } catch (error) {
    console.error('[GPS FALLBACK API] Error clearing old coordinates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
