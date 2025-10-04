const { db } = require("../models/firebase");
const notificationModel = require('../models/notificationModel');
const fcmService = require('../services/fcmService');

class AutomaticTaskService {
  constructor() {
    this.createdTasks = new Set(); // Track created tasks to avoid duplicates
    this.thresholdCrossed = new Map(); // Track when bin crosses 85% threshold
  }

  /**
   * Create automatic task assignment when bin level exceeds threshold
   * @param {Object} binData - Bin monitoring data
   * @returns {Promise<Object>} Task creation result
   */
  async createAutomaticTask(binData) {
    const { binId, binLevel, binLocation, timestamp } = binData;
    
    // Check if bin level is above threshold
    if (binLevel < 85) {
      // Reset threshold flag when bin goes below 84% (not 85%)
      if (binLevel < 84) {
        const thresholdKeyReset = `${binId}_threshold_crossed`;
        this.thresholdCrossed.delete(thresholdKeyReset);
        console.log(`[AUTOMATIC TASK] Reset threshold flag for ${binId} - bin level ${binLevel}% below 84%`);
      }
      return { success: false, reason: 'Bin level below threshold', message: 'Below threshold' };
    }

    // Check for archiving logic: If bin reaches 90% and no one accepted previous task
    if (binLevel >= 90) {
      await this.archiveUnacceptedTasks(binId, binLevel, timestamp);
    }

    // Check if we've already crossed the threshold for this bin recently (within last 5 minutes)
    const thresholdKey = `${binId}_threshold_crossed`;
    const lastCrossed = this.thresholdCrossed.get(thresholdKey);
    if (lastCrossed && (timestamp.getTime() - lastCrossed.getTime()) < 5 * 60 * 1000) {
      console.log(`[AUTOMATIC TASK] Threshold already crossed for ${binId} at ${binLevel}% within last 5 minutes`);
      return { success: false, reason: 'Threshold already crossed recently' };
    }

    // Mark threshold as crossed
    this.thresholdCrossed.set(thresholdKey, timestamp);
    console.log(`[AUTOMATIC TASK] Threshold crossed for ${binId} at ${binLevel}% - creating task`);
    
    // Create unique task key to prevent duplicates - use bin ID and level range
    const levelRange = Math.floor(binLevel / 5) * 5; // Group by 5% ranges (85-89, 90-94, 95-99, 100+)
    const taskKey = `${binId}_${levelRange}_${Math.floor(timestamp.getTime() / (10 * 60 * 1000))}`; // 10-minute window
    
    if (this.createdTasks.has(taskKey)) {
      console.log(`[AUTOMATIC TASK] Task already created for ${binId} at ${binLevel}% (range ${levelRange}%)`);
      return { success: false, reason: 'Task already created', message: 'Duplicate suppressed (memory)' };
    }

    // Additional check: Look for existing pending tasks for this bin
    try {
      // Get all recent activity logs and filter in-memory to avoid Firestore index issues
      const allLogsSnapshot = await db.collection('activitylogs')
        .orderBy('created_at', 'desc')
        .limit(50) // Get recent logs
        .get();
      
      const recentLogs = allLogsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for pending automatic tasks for this bin in the last 30 minutes
      const existingTasks = recentLogs.filter(log => 
        log.bin_id === binId &&
        log.status === 'pending' &&
        log.source === 'automatic_monitoring' &&
        new Date(log.created_at) > new Date(Date.now() - 30 * 60 * 1000)
      );
      
      if (existingTasks.length > 0) {
        console.log(`[AUTOMATIC TASK] Found ${existingTasks.length} existing pending tasks for ${binId}, skipping creation`);
        console.log(`[AUTOMATIC TASK] Existing tasks:`, existingTasks.map(t => ({ id: t.id, created_at: t.created_at })));
        return { success: false, reason: 'Pending task already exists' };
      }
    } catch (checkError) {
      console.log(`[AUTOMATIC TASK] Could not check existing tasks: ${checkError.message}`);
    }

    try {
      // Determine priority based on bin level
      let priority = 'medium';
      if (binLevel >= 95) priority = 'urgent';
      else if (binLevel >= 90) priority = 'high';
      else if (binLevel >= 85) priority = 'high';

      // Create task assignment data - AVAILABLE FOR JANITOR ACCEPTANCE
      const taskData = {
        user_id: null, // No specific user assigned initially - available for acceptance
        bin_id: binId,
        bin_location: binLocation || 'Central Plaza',
        bin_status: 'pending',
        bin_level: binLevel,
        assigned_janitor_id: null, // NULL = available for any janitor to accept
        assigned_janitor_name: null, // NULL = available for any janitor to accept
        task_note: `🚨 AUTOMATIC TASK: Bin level ${binLevel}% exceeds threshold (85%). Bin needs immediate attention. Available for janitor acceptance.`,
        activity_type: 'task_assignment',
        priority: priority,
        status: 'pending', // PENDING = waiting for janitor to accept
        created_by: 'system',
        created_at: timestamp.toISOString(),
        updated_at: timestamp.toISOString(),
        source: 'automatic_monitoring',
        available_for_acceptance: true, // Flag to indicate janitors can accept this task
        acceptance_deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes to accept
      };

      // Save to activity logs collection using idempotent document id
      // Use Firestore create() so it fails if document already exists
      const docRefId = taskKey;
      try {
        const docRef = db.collection('activitylogs').doc(docRefId);
        const existing = await docRef.get();
        if (existing.exists) {
          this.createdTasks.add(taskKey);
          console.log(`[AUTOMATIC TASK] Found existing doc ${docRefId}, skipping create`);
          return { success: false, reason: 'Task already exists', message: 'Duplicate suppressed (pre-exists)' };
        }
        await docRef.create(taskData);
      } catch (e) {
        if (e.code === 6 || e.message?.includes('ALREADY_EXISTS')) { // already exists
          this.createdTasks.add(taskKey);
          console.log(`[AUTOMATIC TASK] Skipped creating duplicate task doc ${docRefId}`);
          return { success: false, reason: 'Task already exists', message: 'Duplicate suppressed (firestore)' };
        }
        throw e;
      }
      
      // Mark task as created
      this.createdTasks.add(taskKey);
      
      // Clean up old task keys (keep only last 100)
      if (this.createdTasks.size > 100) {
        const keysArray = Array.from(this.createdTasks);
        this.createdTasks.clear();
        keysArray.slice(-50).forEach(key => this.createdTasks.add(key));
      }

      console.log(`[AUTOMATIC TASK] ✅ Created task ${docRefId} for ${binId} at ${binLevel}%`);
      
      // Send built-in notification
      await this.sendTaskCreatedNotification({
        taskId: docRefId,
        binId: binId,
        binLevel: binLevel,
        binLocation: binLocation,
        priority: priority
      });
      
      return {
        success: true,
        taskId: docRefId,
        taskData: taskData,
        message: `Automatic task created for ${binId} at ${binLevel}%`
      };

    } catch (error) {
      console.error('[AUTOMATIC TASK] Error creating automatic task:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create automatic task'
      };
    }
  }

  /**
   * Archive unaccepted tasks when bin reaches 90% and create new task
   * @param {string} binId - Bin identifier
   * @param {number} binLevel - Current bin level
   * @param {Date} timestamp - Current timestamp
   */
  async archiveUnacceptedTasks(binId, binLevel, timestamp) {
    try {
      console.log(`[AUTOMATIC TASK] Checking for unaccepted tasks to archive for ${binId} at ${binLevel}%`);
      
      // Get all pending tasks for this bin that haven't been accepted
      const pendingTasksSnapshot = await db.collection("activitylogs")
        .where("bin_id", "==", binId)
        .where("status", "==", "pending")
        .where("activity_type", "==", "task_assignment")
        .get();

      if (pendingTasksSnapshot.empty) {
        console.log(`[AUTOMATIC TASK] No pending tasks found for ${binId} to archive`);
        return;
      }

      console.log(`[AUTOMATIC TASK] Found ${pendingTasksSnapshot.size} pending tasks for ${binId} - archiving them`);

      // Archive all pending tasks
      const archivePromises = [];
      pendingTasksSnapshot.forEach(doc => {
        const archivePromise = doc.ref.update({
          status: 'archived',
          bin_status: 'archived',
          archived_at: timestamp.toISOString(),
          archived_reason: `Bin level reached ${binLevel}% - no janitor accepted task within time limit`,
          updated_at: timestamp.toISOString()
        });
        archivePromises.push(archivePromise);
      });

      await Promise.all(archivePromises);
      console.log(`[AUTOMATIC TASK] Successfully archived ${pendingTasksSnapshot.size} pending tasks for ${binId}`);

      // Clear the created tasks cache for this bin to allow new task creation
      const keysToDelete = Array.from(this.createdTasks).filter(key => key.startsWith(binId));
      keysToDelete.forEach(key => this.createdTasks.delete(key));
      console.log(`[AUTOMATIC TASK] Cleared task cache for ${binId} - ${keysToDelete.length} entries removed`);

    } catch (error) {
      console.error(`[AUTOMATIC TASK] Error archiving tasks for ${binId}:`, error);
    }
  }

  /**
   * Check if bin level requires automatic task creation
   * @param {number} binLevel - Current bin level
   * @returns {boolean} Whether task should be created
   */
  shouldCreateTask(binLevel) {
    return binLevel >= 85;
  }

  /**
   * Get task creation status for debugging
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      trackedTasks: this.createdTasks.size,
      recentTasks: Array.from(this.createdTasks).slice(-10),
      thresholdCrossedCount: this.thresholdCrossed.size,
      thresholdCrossed: Array.from(this.thresholdCrossed.entries()),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset threshold flag for a specific bin (useful for testing)
   * @param {string} binId - Bin ID to reset
   */
  resetThresholdFlag(binId) {
    const thresholdKey = `${binId}_threshold_crossed`;
    this.thresholdCrossed.delete(thresholdKey);
    console.log(`[AUTOMATIC TASK] Reset threshold flag for ${binId}`);
  }

  /**
   * Get available tasks for janitor acceptance
   * @returns {Promise<Array>} Available tasks
   */
  async getAvailableTasksForAcceptance() {
    try {
      const snapshot = await db.collection('activitylogs')
        .where('available_for_acceptance', '==', true)
        .where('status', '==', 'pending')
        .where('assigned_janitor_id', '==', null)
        .orderBy('created_at', 'desc')
        .limit(20)
        .get();

      const availableTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`[AUTOMATIC TASK] Found ${availableTasks.length} tasks available for acceptance`);
      return availableTasks;
    } catch (error) {
      console.error('[AUTOMATIC TASK] Error getting available tasks:', error);
      return [];
    }
  }

  /**
   * Send built-in notification when task is created - NOW USES YOUR EXISTING SYSTEM
   * @param {Object} taskInfo - Task information
   */
  async sendTaskCreatedNotification(taskInfo) {
    const { taskId, binId, binLevel, binLocation, priority } = taskInfo;
    
    try {
      // Get all janitor users to notify them about the automatic task
      const janitorUsers = await notificationModel.getUsersByRoles(['janitor', 'staff']);
      
      if (janitorUsers.length === 0) {
        console.log('[AUTOMATIC TASK] No janitor users found to notify');
        return;
      }

      console.log(`[AUTOMATIC TASK] 📢 Sending task acceptance notifications to ${janitorUsers.length} janitors`);
      
      // Send notifications to ALL janitors using your existing system
      const notificationPromises = janitorUsers.map(janitor => {
        // Use your existing sendJanitorAssignmentNotification function
        // But modify it to indicate this is for ACCEPTANCE, not assignment
        return this.sendJanitorAcceptanceNotification({
          janitorId: janitor.id,
          janitorName: janitor.fullName || janitor.name || 'Janitor',
          binId: binId,
          binLocation: binLocation,
          binLevel: binLevel,
          taskNote: `🚨 AUTOMATIC TASK: Bin level ${binLevel}% exceeds threshold (85%). Click to accept this task.`,
          activityType: 'task_assignment',
          priority: priority,
          activityId: taskId,
          timestamp: new Date(),
          isAutomaticTask: true,
          availableForAcceptance: true
        }).catch(err => 
          console.error(`[AUTOMATIC TASK] Failed to notify janitor ${janitor.id}:`, err)
        );
      });

      await Promise.all(notificationPromises);
      
      console.log(`[AUTOMATIC TASK] ✅ Sent task acceptance notifications to ${janitorUsers.length} janitors`);
      console.log(`🔔 AUTOMATIC TASK ACCEPTANCE NOTIFICATIONS:`);
      console.log(`   Task ID: ${taskId}`);
      console.log(`   Bin: ${binId} at ${binLocation}`);
      console.log(`   Level: ${binLevel}% (Priority: ${priority})`);
      console.log(`   Time: ${new Date().toLocaleString()}`);
      console.log(`   Recipients: ${janitorUsers.length} janitors`);
      console.log(`   Action: Janitors can accept this task using assignTaskAtomically endpoint`);
      
    } catch (error) {
      console.error('[AUTOMATIC TASK] Error sending janitor acceptance notifications:', error);
    }
  }

  /**
   * Send janitor acceptance notification using your existing system
   * @param {Object} notificationData - Notification data
   */
  async sendJanitorAcceptanceNotification(notificationData) {
    try {
      const {
        janitorId,
        janitorName,
        binId,
        binLocation,
        binLevel,
        taskNote,
        activityType,
        priority,
        activityId,
        timestamp,
        isAutomaticTask = false,
        availableForAcceptance = false
      } = notificationData;

      // Get janitor information
      const janitor = await notificationModel.getUserById(janitorId);
      if (!janitor) {
        console.error(`[AUTOMATIC TASK] Janitor with ID ${janitorId} not found`);
        return;
      }

      // Create acceptance-specific notification content
      const priorityEmoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
      const binLevelText = binLevel ? ` (${binLevel}% full)` : '';
      const locationText = binLocation ? ` at ${binLocation}` : '';
      const automaticFlag = isAutomaticTask ? '🚨 AUTOMATIC ' : '';
      
      const title = isAutomaticTask ? '🚨 Automatic Task Available' : '🧹 New Task Assigned';
      const message = `${automaticFlag}Task available for acceptance: Bin ${binId}${locationText}${binLevelText}\n📝 ${taskNote}\n\nPriority: ${priorityEmoji} ${priority}\n\n⚠️ Click to accept this task!`;

      const notificationPayload = {
        binId: binId,
        type: isAutomaticTask ? 'automatic_task_available' : 'task_assignment',
        title: title,
        message: message,
        status: availableForAcceptance ? 'AVAILABLE_FOR_ACCEPTANCE' : 'ASSIGNED',
        binLevel: binLevel,
        gps: { lat: 0, lng: 0 }, // Default GPS, can be updated with actual location
        timestamp: timestamp || new Date(),
        activityId: activityId,
        priority: priority,
        isAutomaticTask: isAutomaticTask,
        availableForAcceptance: availableForAcceptance,
        acceptanceDeadline: isAutomaticTask ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null
      };

      // Send push notification if FCM token exists
      if (janitor.fcmToken) {
        try {
          await fcmService.sendToUser(janitor.fcmToken, notificationPayload);
          console.log(`[AUTOMATIC TASK] Push notification sent to janitor ${janitorId}`);
        } catch (fcmErr) {
          console.error('[AUTOMATIC TASK] FCM send failed:', fcmErr);
        }
      } else {
        console.log(`[AUTOMATIC TASK] No FCM token found for janitor ${janitorId}`);
      }

      // Create in-app notification record using your existing system
      await notificationModel.createNotification({
        ...notificationPayload,
        janitorId: janitorId
      });

      console.log(`[AUTOMATIC TASK] In-app notification created for janitor ${janitorId}`);

    } catch (error) {
      console.error('[AUTOMATIC TASK] Error sending janitor acceptance notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new AutomaticTaskService();
