const notificationModel = require('../models/notificationModel');
const fcmService = require('../services/fcmService');

class BinNotificationController {
  /**
   * Check bin data and send notifications if needed
   * @param {Object} binData - Bin monitoring data
   * @returns {Promise<Object>} Notification result
   */
  async checkBinAndNotify(binData) {
    try {
      const {
        binId,
        binLevel,
        status,
        gps,
        timestamp,
        weight,
        distance,
        gpsValid,
        satellites,
        errorMessage
      } = binData;

      console.log(`[BIN NOTIFICATION] Checking bin ${binId} for notifications...`);

      // Check if notifications should be sent
      const shouldNotify = this.shouldSendNotification(binData);
      
      if (!shouldNotify.shouldNotify) {
        console.log(`[BIN NOTIFICATION] No notification needed for bin ${binId}`);
        return {
          success: true,
          notificationSent: false,
          reason: shouldNotify.reason
        };
      }

      // Get janitor assignment for this bin
      const assignment = await notificationModel.getBinAssignment(binId);

      // Create notification payload
      const notificationData = this.createNotificationData(binData, shouldNotify.type);

      // If no assignment, broadcast to all janitors
      if (!assignment) {
        console.log(`[BIN NOTIFICATION] No janitor assigned to bin ${binId}. Broadcasting to all janitors...`);

        // Fetch all users with janitor-like roles
        const janitorCandidates = await notificationModel.getUsersByRoles(['janitor', 'staff']);

        // Send to each janitor if they have FCM and create per-user notification records for ALL
        const results = [];
        for (const user of janitorCandidates) {
          try {
            let fcmMessageId = null;
            if (user.fcmToken) {
              try {
                fcmMessageId = await fcmService.sendToUser(user.fcmToken, notificationData);
              } catch (sendErr) {
                console.error(`[BIN NOTIFICATION] FCM send failed for janitor ${user.id}:`, sendErr);
              }
            }

            const created = await notificationModel.createNotification({
              ...notificationData,
              janitorId: user.id,
              timestamp: timestamp || new Date()
            });
            results.push({ userId: user.id, fcmMessageId, notificationId: created.id, hadFcmToken: !!user.fcmToken });
          } catch (err) {
            console.error(`[BIN NOTIFICATION] Failed processing janitor ${user.id}:`, err);
          }
        }

        return {
          success: true,
          notificationSent: results.length > 0,
          broadcast: true,
          recipients: results
        };
      }

      // Otherwise, notify the specifically assigned janitor
      const { janitorId } = assignment;

      // Get janitor's FCM token
      const janitor = await notificationModel.getUserById(janitorId);
      
      if (!janitor || !janitor.fcmToken) {
        console.log(`[BIN NOTIFICATION] Janitor ${janitorId} has no FCM token`);
        return {
          success: true,
          notificationSent: false,
          reason: 'No FCM token available'
        };
      }

      // Send FCM notification
      const fcmResult = await fcmService.sendToUser(janitor.fcmToken, notificationData);
      
      // Save notification to Firestore
      const savedNotification = await notificationModel.createNotification({
        ...notificationData,
        janitorId,
        timestamp: timestamp || new Date()
      });

      console.log(`[BIN NOTIFICATION] Successfully sent notification to janitor ${janitorId} for bin ${binId}`);

      return {
        success: true,
        notificationSent: true,
        fcmMessageId: fcmResult,
        notificationId: savedNotification.id,
        janitorId,
        type: shouldNotify.type
      };

    } catch (error) {
      console.error('[BIN NOTIFICATION] Error checking bin and sending notification:', error);
      return {
        success: false,
        notificationSent: false,
        error: error.message
      };
    }
  }

  /**
   * Determine if a notification should be sent
   * @param {Object} binData - Bin monitoring data
   * @returns {Object} Notification decision
   */
  shouldSendNotification(binData) {
    const { binLevel, status, gpsValid, satellites, errorMessage } = binData;

    // Check for high bin level (>= 80%)
    if (binLevel >= 80) {
      return {
        shouldNotify: true,
        type: 'bin_full',
        reason: `Bin level is ${binLevel}% (threshold: 80%)`
      };
    }

    // Check for error status
    if (status === 'ERROR') {
      return {
        shouldNotify: true,
        type: 'bin_error',
        reason: `Bin status is ERROR: ${errorMessage || 'Unknown error'}`
      };
    }

    // Check for malfunction status
    if (status === 'MALFUNCTION') {
      return {
        shouldNotify: true,
        type: 'bin_malfunction',
        reason: `Bin status is MALFUNCTION: ${errorMessage || 'Unknown malfunction'}`
      };
    }

    // Check for GPS issues
    if (!gpsValid || satellites === 0) {
      return {
        shouldNotify: true,
        type: 'gps_error',
        reason: `GPS signal invalid (valid: ${gpsValid}, satellites: ${satellites})`
      };
    }

    // Check for specific error messages
    if (errorMessage) {
      if (errorMessage.includes('Error opening port') || 
          errorMessage.includes('Modem not connected')) {
        return {
          shouldNotify: true,
          type: 'connection_error',
          reason: `Connection error: ${errorMessage}`
        };
      }
    }

    return {
      shouldNotify: false,
      reason: 'No notification criteria met'
    };
  }

  /**
   * Create notification data based on event type
   * @param {Object} binData - Bin monitoring data
   * @param {string} type - Notification type
   * @returns {Object} Notification data
   */
  createNotificationData(binData, type) {
    const { binId, binLevel, status, gps, timestamp, errorMessage } = binData;

    const notificationTemplates = {
      bin_full: {
        title: `🚮 Bin ${binId} Needs Collection`,
        message: `Bin ${binId} is ${binLevel}% full. Please collect the waste at GPS(${gps.lat}, ${gps.lng}).`
      },
      bin_error: {
        title: `⚠️ Bin ${binId} Error Detected`,
        message: `Bin ${binId} has an error: ${errorMessage || 'Unknown error'}. Please check at GPS(${gps.lat}, ${gps.lng}).`
      },
      bin_malfunction: {
        title: `🔧 Bin ${binId} Malfunction`,
        message: `Bin ${binId} has a malfunction: ${errorMessage || 'Unknown malfunction'}. Please inspect at GPS(${gps.lat}, ${gps.lng}).`
      },
      gps_error: {
        title: `📍 Bin ${binId} GPS Issue`,
        message: `Bin ${binId} has GPS signal problems. Please check the GPS module at the bin location.`
      },
      connection_error: {
        title: `📡 Bin ${binId} Connection Issue`,
        message: `Bin ${binId} has connection problems: ${errorMessage}. Please check the communication module.`
      }
    };

    const template = notificationTemplates[type] || notificationTemplates.bin_error;

    return {
      binId,
      type,
      title: template.title,
      message: template.message,
      status,
      binLevel,
      gps,
      timestamp: timestamp || new Date()
    };
  }

  /**
   * Send manual notification to a specific bin
   * @param {string} binId - Bin identifier
   * @param {string} message - Custom message
   * @returns {Promise<Object>} Notification result
   */
  async sendManualNotification(binId, message) {
    try {
      // Get janitor assignment for this bin
      const assignment = await notificationModel.getBinAssignment(binId);
      
      if (!assignment) {
        return {
          success: false,
          notificationSent: false,
          reason: 'No janitor assigned to this bin'
        };
      }

      const { janitorId } = assignment;

      // Get janitor's FCM token
      const janitor = await notificationModel.getUserById(janitorId);
      
      if (!janitor || !janitor.fcmToken) {
        return {
          success: false,
          notificationSent: false,
          reason: 'Janitor has no FCM token'
        };
      }

      // Create manual notification data
      const notificationData = {
        binId,
        type: 'manual',
        title: `📢 Manual Alert - Bin ${binId}`,
        message: message,
        status: 'MANUAL',
        binLevel: null,
        gps: { lat: 0, lng: 0 },
        timestamp: new Date()
      };

      // Send FCM notification
      const fcmResult = await fcmService.sendToUser(janitor.fcmToken, notificationData);
      
      // Save notification to Firestore
      const savedNotification = await notificationModel.createNotification({
        ...notificationData,
        janitorId,
        timestamp: new Date()
      });

      return {
        success: true,
        notificationSent: true,
        fcmMessageId: fcmResult,
        notificationId: savedNotification.id,
        janitorId
      };

    } catch (error) {
      console.error('[BIN NOTIFICATION] Error sending manual notification:', error);
      return {
        success: false,
        notificationSent: false,
        error: error.message
      };
    }
  }

  /**
   * Get notifications for a specific janitor
   * @param {string} janitorId - Janitor identifier
   * @param {number} limit - Number of notifications to return
   * @returns {Promise<Object>} Notifications data
   */
  async getJanitorNotifications(janitorId, limit = 50) {
    try {
      const notifications = await notificationModel.getNotificationsForJanitor(janitorId, limit);
      const unreadCount = await notificationModel.getUnreadNotificationCount(janitorId);

      return {
        success: true,
        notifications,
        unreadCount,
        totalCount: notifications.length
      };
    } catch (error) {
      console.error('[BIN NOTIFICATION] Error getting janitor notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification identifier
   * @returns {Promise<Object>} Result
   */
  async markNotificationAsRead(notificationId) {
    try {
      await notificationModel.markNotificationAsRead(notificationId);
      
      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error) {
      console.error('[BIN NOTIFICATION] Error marking notification as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get notification statistics
   * @param {string} janitorId - Janitor identifier (optional)
   * @returns {Promise<Object>} Statistics
   */
  async getNotificationStats(janitorId = null) {
    try {
      // This would need to be implemented in the model
      // For now, return basic stats
      return {
        success: true,
        stats: {
          totalNotifications: 0,
          unreadNotifications: 0,
          todayNotifications: 0,
          thisWeekNotifications: 0
        }
      };
    } catch (error) {
      console.error('[BIN NOTIFICATION] Error getting notification stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new BinNotificationController();

