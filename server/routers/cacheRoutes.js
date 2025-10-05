const express = require('express');
const router = express.Router();
const CacheManager = require('../utils/cacheManager');
const rateLimiter = require('../utils/rateLimiter');

// Get cache statistics
router.get('/stats', (req, res) => {
  try {
    const cacheStats = CacheManager.getStats();
    res.json({
      success: true,
      data: {
        cache: cacheStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics',
      message: error.message
    });
  }
});

// Clear all caches
router.post('/clear', (req, res) => {
  try {
    CacheManager.flushAll();
    res.json({
      success: true,
      message: 'All caches cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear caches',
      message: error.message
    });
  }
});

// Get rate limiter status
router.get('/rate-limiter/status', (req, res) => {
  try {
    const gpsRemaining = rateLimiter.getRemaining('gps_processing', 5, 60000);
    const gpsBin1Remaining = rateLimiter.getRemaining('gps_processing_bin1', 5, 60000);
    
    res.json({
      success: true,
      data: {
        gps_processing: {
          remaining: gpsRemaining,
          resetTime: rateLimiter.getResetTime('gps_processing', 60000)
        },
        gps_processing_bin1: {
          remaining: gpsBin1Remaining,
          resetTime: rateLimiter.getResetTime('gps_processing_bin1', 60000)
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get rate limiter status',
      message: error.message
    });
  }
});

module.exports = router;
