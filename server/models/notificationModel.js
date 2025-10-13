const { db } = require('./firebase');
const withRetry = require('../utils/retryHandler');

class NotificationModel {
  constructor() {
    this.collections = {
      users: 'users',
      binAssignments: 'binAssignments',
      binHistory: 'binHistory',
      notifications: 'notifications'
    };
  }

  /**
   * Get janitor assigned to a specific bin
   * @param {string} binId - Bin identifier
   * @returns {Promise<Object|null>} Janitor assignment data
   */
  async getBinAssignment(binId) {
    try {
      const doc = await withRetry(() =>
        db.collection(this.collections.binAssignments).doc(binId).get()
      );

      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('[NOTIFICATION MODEL] Error getting bin assignment:', error);
      throw new Error(`Failed to get bin assignment: ${error.message}`);
    }
  }

  /**
   * Get user (janitor) by ID
   * @param {string} userId - User identifier
   * @returns {Promise<Object|null>} User data including FCM token
   */
  async getUserById(userId) {
    try {
      const doc = await withRetry(() =>
        db.collection(this.collections.users).doc(userId).get()
      );

      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('[NOTIFICATION MODEL] Error getting user:', error);
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Get users by role(s)
   * @param {Array<string>} roles - Roles to match (e.g., ['janitor','staff'])
   * @returns {Promise<Array>} Users with matching roles
   */
  async getUsersByRoles(roles = []) {
    try {
      if (!roles.length) return [];
      // Firestore doesn't support "in" on different fields, so query by role field
      const snapshot = await withRetry(() =>
        db.collection(this.collections.users).where('role', 'in', roles).get()
      );

      const users = [];
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });

      // Some records might use an alternate field like acc_type; include them via a second pass
      // Note: This requires a separate query per role because Firestore doesn't support 'in' on different fields
      for (const role of roles) {
        const altSnapshot = await withRetry(() =>
          db.collection(this.collections.users).where('acc_type', '==', role).get()
        );
        altSnapshot.forEach(doc => {
          const user = { id: doc.id, ...doc.data() };
          if (!users.find(u => u.id === user.id)) users.push(user);
        });
      }

      return users;
    } catch (error) {
      console.error('[NOTIFICATION MODEL] Error getting users by roles:', error);
      throw new Error(`Failed to get users by roles: ${error.message}`);
    }
  }

  /**
   * Get all bin assignments
   * @returns {Promise<Array>} Array of all bin assignments
   */
  async getAllBinAssignments() {
    try {
      const snapshot = await withRetry(() =>
        db.collection(this.collections.binAssignments).get()
      );
      const assignments = [];

      snapshot.forEach(doc => {
        assignments.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return assignments;
    } catch (error) {
      console.error('[NOTIFICATION MODEL] Error getting all bin assignments:', error);
      throw new Error(`Failed to get bin assignments: ${error.message}`);
    }
  }

  /**
   * Create a new notification record
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(notificationData) {
    try {
      const {
        binId,
        janitorId,
        type,
        title,
        message,
        status,
        binLevel,
        gps,
        timestamp,
        read = false
      } = notificationData;

      const notification = {
        binId,
        janitorId,
        type,
        title,
        message,
        status,
        binLevel,
        gps,
        timestamp: timestamp || new Date(),
        read,
        createdAt: new Date()
      };

      const docRef = await withRetry(() =>
        db.collection(this.collections.notifications).add(notification)
      );
      
      console.log(`[NOTIFICATION MODEL] Created notification for bin ${binId} to janitor ${janitorId}`);
      
      return {
        id: docRef.id,
        ...notification
      };
    } catch (error) {
      console.error('[NOTIFICATION MODEL] Error creating notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  /**
   * Get notifications for a specific janitor
   * @param {string} janitorId - Janitor identifier
   * @param {number} limit - Number of notifications to return
   * @returns {Promise<Array>} Array of notifications
   */
  async getNotificationsForJanitor(janitorId, limit = 50) {
    try {
      // Use a simpler query without orderBy to avoid index requirements
      const snapshot = await withRetry(() =>
        db.collection(this.collections.notifications)
          .where('janitorId', '==', janitorId)
          .limit(limit)
          .get()
      );

      const notifications = [];
      snapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort in-memory by timestamp descending
      notifications.sort((a, b) => {
        const timestampA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const timestampB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return timestampB - timestampA;
      });

      return notifications;
    } catch (error) {
      console.error('[NOTIFICATION MODEL] Error getting notifications:', error);
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification identifier
   * @returns {Promise<boolean>} Success status
   */
  async markNotificationAsRead(notificationId) {
    try {
      await withRetry(() =>
        db.collection(this.collections.notifications)
          .doc(notificationId)
          .update({
            read: true,
            readAt: new Date()
          })
      );

      console.log(`[NOTIFICATION MODEL] Marked notification ${notificationId} as read`);
      return true;
    } catch (error) {
      console.error('[NOTIFICATION MODEL] Error marking notification as read:', error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Get unread notification count for a janitor
   * @param {string} janitorId - Janitor identifier
   * @returns {Promise<number>} Count of unread notifications
   */
  async getUnreadNotificationCount(janitorId) {
    try {
      const snapshot = await withRetry(() =>
        db.collection(this.collections.notifications)
          .where('janitorId', '==', janitorId)
          .where('read', '==', false)
          .get()
      );

      return snapshot.size;
    } catch (error) {
      console.error('[NOTIFICATION MODEL] Error getting unread count:', error);
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  /**
   * Update notifications for a specific task when status changes
   * @param {string} binId - Bin identifier
   * @param {string} activityId - Activity identifier
   * @param {string} newStatus - New status (e.g., 'in_progress', 'completed')
   * @param {string} assignedJanitorName - Name of janitor who accepted the task
   * @param {string} assignedJanitorId - ID of janitor who accepted the task
   * @returns {Promise<number>} Number of updated notifications
   */
  async updateTaskNotifications(binId, activityId, newStatus, assignedJanitorName, assignedJanitorId) {
    try {
      console.log(`[NOTIFICATION MODEL] Updating task notifications for bin ${binId}, activity ${activityId}, status ${newStatus}`);
      
      // Find all notifications for this bin and activity that are task-related
      const snapshot = await withRetry(() =>
        db.collection(this.collections.notifications)
          .where('binId', '==', binId)
          .where('type', 'in', ['automatic_task_available', 'task_assignment', 'automatic_task_created'])
          .where('read', '==', false)
          .get()
      );

      if (snapshot.empty) {
        console.log(`[NOTIFICATION MODEL] No unread task notifications found for bin ${binId}`);
        return 0;
      }

      const batch = db.batch();
      let updatedCount = 0;

      snapshot.docs.forEach(doc => {
        const notificationData = doc.data();
        
        // Update notification based on new status
        let updatedNotification = {
          updated_at: new Date().toISOString()
        };

        if (newStatus === 'in_progress') {
          // Task has been accepted by someone
          updatedNotification = {
            ...updatedNotification,
            status: 'ACCEPTED',
            title: 'Task Accepted by Someone',
            message: `${assignedJanitorName || 'A janitor'} has accepted the task for bin ${binId}. Status: In Progress`,
            acceptedBy: assignedJanitorName,
            acceptedById: assignedJanitorId,
            taskStatus: 'accepted',
            availableForAcceptance: false
          };
        } else if (newStatus === 'done') {
          // Task has been completed
          updatedNotification = {
            ...updatedNotification,
            status: 'COMPLETED',
            title: 'Task Completed',
            message: `The task for bin ${binId} has been completed by ${assignedJanitorName || 'a janitor'}.`,
            completedBy: assignedJanitorName,
            completedById: assignedJanitorId,
            taskStatus: 'completed',
            availableForAcceptance: false
          };
        }

        batch.update(doc.ref, updatedNotification);
        updatedCount++;
      });

      if (updatedCount > 0) {
        await withRetry(() => batch.commit());
        console.log(`[NOTIFICATION MODEL] Updated ${updatedCount} notifications for bin ${binId}`);
      }

      return updatedCount;
    } catch (error) {
      console.error('[NOTIFICATION MODEL] Error updating task notifications:', error);
      throw new Error(`Failed to update task notifications: ${error.message}`);
    }
  }

  /**
   * Delete old notifications (cleanup)
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise<number>} Number of deleted notifications
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const snapshot = await withRetry(() =>
        db.collection(this.collections.notifications)
          .where('timestamp', '<', cutoffDate)
          .get()
      );

      const batch = db.batch();
      let deletedCount = 0;

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      if (deletedCount > 0) {
        await withRetry(() => batch.commit());
        console.log(`[NOTIFICATION MODEL] Cleaned up ${deletedCount} old notifications`);
      }

      return deletedCount;
    } catch (error) {
      console.error('[NOTIFICATION MODEL] Error cleaning up notifications:', error);
      throw new Error(`Failed to cleanup notifications: ${error.message}`);
    }
  }
}

module.exports = new NotificationModel();

