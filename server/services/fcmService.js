const admin = require('firebase-admin');

class FCMService {
  constructor() {
    this.messaging = admin.messaging();
  }

  /**
   * Send notification to a single user
   * @param {string} fcmToken - User's FCM token
   * @param {Object} notification - Notification data
   * @returns {Promise<string>} Message ID
   */
  async sendToUser(fcmToken, notification) {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.message
        },
        data: {
          binId: notification.binId,
          type: notification.type,
          status: notification.status,
          binLevel: notification.binLevel?.toString() || '',
          gps: JSON.stringify(notification.gps),
          timestamp: notification.timestamp?.toISOString() || new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'bin-alerts'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await this.messaging.send(message);
      console.log(`[FCM SERVICE] Successfully sent notification: ${response}`);
      return response;
    } catch (error) {
      console.error('[FCM SERVICE] Error sending notification:', error);
      throw new Error(`Failed to send FCM notification: ${error.message}`);
    }
  }

  /**
   * Send notification to multiple users
   * @param {Array<string>} fcmTokens - Array of FCM tokens
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>} Batch response
   */
  async sendToMultipleUsers(fcmTokens, notification) {
    try {
      if (!fcmTokens || fcmTokens.length === 0) {
        throw new Error('No FCM tokens provided');
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.message
        },
        data: {
          binId: notification.binId,
          type: notification.type,
          status: notification.status,
          binLevel: notification.binLevel?.toString() || '',
          gps: JSON.stringify(notification.gps),
          timestamp: notification.timestamp?.toISOString() || new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'bin-alerts'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await this.messaging.sendMulticast({
        tokens: fcmTokens,
        ...message
      });

      console.log(`[FCM SERVICE] Successfully sent ${response.successCount} notifications`);
      console.log(`[FCM SERVICE] Failed to send ${response.failureCount} notifications`);

      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push({
              token: fcmTokens[idx],
              error: resp.error
            });
          }
        });
        console.error('[FCM SERVICE] Failed tokens:', failedTokens);
      }

      return response;
    } catch (error) {
      console.error('[FCM SERVICE] Error sending multicast notification:', error);
      throw new Error(`Failed to send multicast FCM notification: ${error.message}`);
    }
  }

  /**
   * Send notification to a topic
   * @param {string} topic - Topic name
   * @param {Object} notification - Notification data
   * @returns {Promise<string>} Message ID
   */
  async sendToTopic(topic, notification) {
    try {
      const message = {
        topic: topic,
        notification: {
          title: notification.title,
          body: notification.message
        },
        data: {
          binId: notification.binId,
          type: notification.type,
          status: notification.status,
          binLevel: notification.binLevel?.toString() || '',
          gps: JSON.stringify(notification.gps),
          timestamp: notification.timestamp?.toISOString() || new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
            channelId: 'bin-alerts'
          }
        }
      };

      const response = await this.messaging.send(message);
      console.log(`[FCM SERVICE] Successfully sent topic notification to ${topic}: ${response}`);
      return response;
    } catch (error) {
      console.error('[FCM SERVICE] Error sending topic notification:', error);
      throw new Error(`Failed to send topic FCM notification: ${error.message}`);
    }
  }

  /**
   * Subscribe user to a topic
   * @param {string} fcmToken - User's FCM token
   * @param {string} topic - Topic name
   * @returns {Promise<Object>} Response
   */
  async subscribeToTopic(fcmToken, topic) {
    try {
      const response = await this.messaging.subscribeToTopic(fcmToken, topic);
      console.log(`[FCM SERVICE] Successfully subscribed ${fcmToken} to topic ${topic}`);
      return response;
    } catch (error) {
      console.error('[FCM SERVICE] Error subscribing to topic:', error);
      throw new Error(`Failed to subscribe to topic: ${error.message}`);
    }
  }

  /**
   * Unsubscribe user from a topic
   * @param {string} fcmToken - User's FCM token
   * @param {string} topic - Topic name
   * @returns {Promise<Object>} Response
   */
  async unsubscribeFromTopic(fcmToken, topic) {
    try {
      const response = await this.messaging.unsubscribeFromTopic(fcmToken, topic);
      console.log(`[FCM SERVICE] Successfully unsubscribed ${fcmToken} from topic ${topic}`);
      return response;
    } catch (error) {
      console.error('[FCM SERVICE] Error unsubscribing from topic:', error);
      throw new Error(`Failed to unsubscribe from topic: ${error.message}`);
    }
  }

  /**
   * Validate FCM token
   * @param {string} fcmToken - FCM token to validate
   * @returns {Promise<boolean>} Token validity
   */
  async validateToken(fcmToken) {
    try {
      const response = await this.messaging.send({
        token: fcmToken,
        data: {
          test: 'validation'
        }
      }, true);
      return true;
    } catch (error) {
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return false;
      }
      throw error;
    }
  }
}

module.exports = new FCMService();
