const { db } = require("../models/firebase");

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

      // Create task assignment data
      const taskData = {
        user_id: null, // No specific user assigned initially
        bin_id: binId,
        bin_location: binLocation || 'Central Plaza',
        bin_status: 'pending',
        bin_level: binLevel,
        assigned_janitor_id: null,
        assigned_janitor_name: null,
        task_note: `Automatic task created - Bin level ${binLevel}% exceeds threshold (85%). Bin needs immediate attention.`,
        activity_type: 'task_assignment',
        priority: priority,
        status: 'pending',
        created_by: 'system',
        created_at: timestamp.toISOString(),
        updated_at: timestamp.toISOString(),
        source: 'automatic_monitoring'
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
   * Send built-in notification when task is created
   * @param {Object} taskInfo - Task information
   */
  async sendTaskCreatedNotification(taskInfo) {
    const { taskId, binId, binLevel, binLocation, priority } = taskInfo;
    
    try {
      // Create notification data
      const notificationData = {
        type: 'task_created',
        title: `🚨 Automatic Task Created`,
        message: `Bin ${binId} at ${binLevel}% needs immediate attention`,
        details: {
          taskId: taskId,
          binId: binId,
          binLevel: binLevel,
          binLocation: binLocation,
          priority: priority,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString(),
        read: false,
        source: 'automatic_monitoring'
      };

      // Save notification to database
      await db.collection('notifications').add(notificationData);
      
      console.log(`[AUTOMATIC TASK] 📢 Notification sent for task ${taskId}`);
      
      // Also log to console for immediate visibility
      console.log(`🔔 NOTIFICATION: ${notificationData.title}`);
      console.log(`   Message: ${notificationData.message}`);
      console.log(`   Location: ${binLocation}`);
      console.log(`   Priority: ${priority}`);
      console.log(`   Time: ${new Date().toLocaleString()}`);
      
    } catch (error) {
      console.error('[AUTOMATIC TASK] Error sending notification:', error);
    }
  }
}

// Export singleton instance
module.exports = new AutomaticTaskService();
