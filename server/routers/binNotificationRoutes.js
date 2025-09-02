const express = require('express');
const router = express.Router();
const binNotificationController = require('../controllers/binNotificationController');

/**
 * @route POST /api/bin-notifications/check-and-notify
 * @desc Check bin data and send notifications if needed
 * @access Public (for IoT devices and monitoring systems)
 */
router.post('/bin-notifications/check-and-notify', async (req, res) => {
  try {
    const binData = req.body;
    
    if (!binData.binId) {
      return res.status(400).json({
        success: false,
        message: 'binId is required'
      });
    }

    const result = await binNotificationController.checkBinAndNotify(binData);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('[BIN NOTIFICATION ROUTES] Error in check-and-notify:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/bin-notifications/manual
 * @desc Send manual notification to a specific bin
 * @access Private (for staff/admin)
 */
router.post('/bin-notifications/manual', async (req, res) => {
  try {
    const { binId, message } = req.body;
    
    if (!binId || !message) {
      return res.status(400).json({
        success: false,
        message: 'binId and message are required'
      });
    }

    const result = await binNotificationController.sendManualNotification(binId, message);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('[BIN NOTIFICATION ROUTES] Error in manual notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/bin-notifications/janitor/:janitorId
 * @desc Get notifications for a specific janitor
 * @access Private
 */
router.get('/bin-notifications/janitor/:janitorId', async (req, res) => {
  try {
    const { janitorId } = req.params;
    const { limit = 50 } = req.query;

    const result = await binNotificationController.getJanitorNotifications(
      janitorId, 
      parseInt(limit)
    );
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('[BIN NOTIFICATION ROUTES] Error getting janitor notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route PUT /api/bin-notifications/:notificationId/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/bin-notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await binNotificationController.markNotificationAsRead(notificationId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('[BIN NOTIFICATION ROUTES] Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/bin-notifications/stats
 * @desc Get notification statistics
 * @access Private
 */
router.get('/bin-notifications/stats', async (req, res) => {
  try {
    const { janitorId } = req.query;

    const result = await binNotificationController.getNotificationStats(janitorId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('[BIN NOTIFICATION ROUTES] Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/bin-notifications/test
 * @desc Test endpoint to verify notification system
 * @access Public (for testing)
 */
router.get('/bin-notifications/test', async (req, res) => {
  try {
    // Test data
    const testBinData = {
      binId: 'bin1',
      binLevel: 85,
      status: 'OK',
      gps: { lat: 10.2901, lng: 123.8810 },
      timestamp: new Date(),
      weight: 45.2,
      distance: 30.5,
      gpsValid: true,
      satellites: 8,
      errorMessage: null
    };

    const result = await binNotificationController.checkBinAndNotify(testBinData);
    
    res.status(200).json({
      success: true,
      message: 'Test notification sent',
      testData: testBinData,
      result
    });
  } catch (error) {
    console.error('[BIN NOTIFICATION ROUTES] Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

