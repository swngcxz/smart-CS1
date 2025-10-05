// Get activity logs assigned to a janitor
const getAssignedActivityLogs = async (req, res, next) => {
  try {
    const { janitorId } = req.params;
    const snapshot = await db.collection("activitylogs").where("assigned_janitor_id", "==", janitorId).get();
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).json({ activities: logs });
  } catch (err) {
    next(err);
  }
};

// ...existing code...


const { db, rtdb } = require("../models/firebase");
const notificationModel = require('../models/notificationModel');
const { admin } = require("../models/firebase");
const realtimeDb = admin.database();

// Helper function to create notifications in Realtime Database
const createRealtimeNotification = async (userId, notificationData) => {
  try {
    const notification = {
      ...notificationData,
      timestamp: Date.now(),
      read: false,
      createdAt: new Date().toISOString()
    };
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Realtime Database timeout')), 3000)
    );
    
    const notificationPromise = realtimeDb.ref(`notifications/${userId}`).push(notification);
    
    await Promise.race([notificationPromise, timeoutPromise]);
    console.log(`[REALTIME NOTIFICATION] Created notification for user ${userId}: ${notification.title}`);
    return true;
  } catch (error) {
    console.error('[REALTIME NOTIFICATION] Error creating notification:', error);
    throw error;
  }
};
const fcmService = require('../services/fcmService');
const smsNotificationService = require('../services/smsNotificationService');
const gsmService = require('../services/gsmService');

// Database health check function
const checkDatabaseHealth = async () => {
  try {
    if (!rtdb) {
      return { isHealthy: false, error: 'Realtime Database not initialized' };
    }
    
    // Test database connection with a simple query
    const testRef = rtdb.ref('.info/connected');
    const snapshot = await testRef.once('value');
    return { isHealthy: true, connected: snapshot.val() };
  } catch (error) {
    return { isHealthy: false, error: error.message };
  }
};

// Get activity statistics for overview cards
const getActivityStatsSimple = async (req, res, next) => {
  try {
    console.log(`[ACTIVITY STATS SIMPLE] Fetching activity statistics...`);
    
    // Get all activities using the same approach as getAllActivityLogs
    const snapshot = await db.collection("activitylogs").get();
    console.log(`[ACTIVITY STATS SIMPLE] Found ${snapshot.size} activities`);

    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate statistics based on status
    const alerts = activities.filter(activity => 
      activity.status === 'pending'
    ).length;

    const inProgress = activities.filter(activity => 
      activity.status === 'in_progress'
    ).length;

    const collections = activities.filter(activity => 
      activity.status === 'done' && (
        activity.activity_type === 'collection' || 
        activity.activity_type === 'task_assignment' ||
        activity.activity_type === 'bin_collection' ||
        activity.activity_type === 'bin_emptied'
      )
    ).length;

    const maintenance = activities.filter(activity => 
      activity.activity_type === 'maintenance' || 
      activity.activity_type === 'repair' ||
      activity.activity_type === 'cleaning'
    ).length;

    const routeChanges = activities.filter(activity => 
      activity.activity_type === 'route_change' || 
      activity.activity_type === 'schedule_update' ||
      activity.activity_type === 'route_update'
    ).length;

    const stats = {
      collections,
      alerts,
      maintenance,
      routeChanges,
      inProgress,
      totalActivities: activities.length,
      date: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString()
    };

    console.log(`[ACTIVITY STATS SIMPLE] Calculated stats:`, stats);

    res.status(200).json({
      success: true,
      stats
    });

  } catch (err) {
    console.error('[ACTIVITY STATS SIMPLE] Error fetching activity statistics:', err);
    next(err);
  }
};

// Atomic task assignment using Firestore transactions
const assignTaskAtomically = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    const { assigned_janitor_id, assigned_janitor_name, status = 'in_progress' } = req.body;

    if (!assigned_janitor_id) {
      return res.status(400).json({ error: "assigned_janitor_id is required" });
    }

    const activityRef = db.collection("activitylogs").doc(activityId);
    
    // Use Firestore transaction to ensure atomic assignment
    const result = await db.runTransaction(async (transaction) => {
      const activityDoc = await transaction.get(activityRef);
      
      if (!activityDoc.exists) {
        throw new Error("Activity log not found");
      }
      
      const originalData = activityDoc.data();
      
      // Check if task is already assigned to a different janitor
      if (originalData.assigned_janitor_id && 
          originalData.assigned_janitor_id !== assigned_janitor_id) {
        
        console.log("🚫 TRANSACTION CONFLICT:", {
          activityId,
          currentAssignee: originalData.assigned_janitor_name,
          currentAssigneeId: originalData.assigned_janitor_id,
          attemptedAssignee: assigned_janitor_name,
          attemptedAssigneeId: assigned_janitor_id
        });
        
        throw new Error(`CONFLICT: Task already assigned to ${originalData.assigned_janitor_name}`);
      }
      
      // Check if task is already assigned to the same janitor
      if (originalData.assigned_janitor_id === assigned_janitor_id && 
          originalData.status === 'in_progress') {
        
        console.log("ℹ️ TRANSACTION REDUNDANT:", {
          activityId,
          janitor: originalData.assigned_janitor_name,
          janitorId: originalData.assigned_janitor_id
        });
        
        return {
          success: true,
          redundant: true,
          message: "Task already assigned to this janitor",
          data: originalData
        };
      }
      
      // Perform the assignment
      const updateData = {
        assigned_janitor_id,
        assigned_janitor_name,
        status,
        bin_status: status,
        updated_at: new Date().toISOString()
      };
      
      transaction.update(activityRef, updateData);
      
      console.log("✅ TRANSACTION SUCCESS:", {
        activityId,
        assignedTo: assigned_janitor_name,
        assignedToId: assigned_janitor_id,
        status
      });
      
      return {
        success: true,
        redundant: false,
        message: "Task assigned successfully",
        data: { ...originalData, ...updateData }
      };
    });
    
    if (result.redundant) {
      return res.status(200).json({
        message: result.message,
        activityId,
        status: result.data.status,
        assigned_janitor_name: result.data.assigned_janitor_name,
        assigned_janitor_id: result.data.assigned_janitor_id,
        warning: "No changes made - task already assigned to this janitor"
      });
    }
    
    // Mark notifications as read for the accepting janitor
    try {
      await markNotificationsAsReadForTask(assigned_janitor_id, result.data.bin_id, activityId);
    } catch (markErr) {
      console.error('[TASK ASSIGNMENT] Failed to mark notifications as read:', markErr);
      // Don't fail the main operation if marking fails
    }

    // Send notification to staff when janitor accepts task
    try {
      // Add timeout to prevent hanging
      const notificationPromise = sendTaskAcceptanceNotification({
        activityId: activityId,
        binId: result.data.bin_id,
        binLocation: result.data.bin_location,
        binLevel: result.data.bin_level,
        janitorId: assigned_janitor_id,
        janitorName: assigned_janitor_name,
        activityType: result.data.activity_type || 'task_assignment',
        priority: result.data.priority || 'medium',
        timestamp: new Date()
      });
      
      // Wait for notification with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Notification timeout')), 5000)
      );
      
      await Promise.race([notificationPromise, timeoutPromise]);
    } catch (notifyErr) {
      console.error('[TASK ASSIGNMENT] Failed to send task acceptance notification:', notifyErr);
      // Don't fail the main operation if notification fails
    }
    
    res.status(200).json({
      message: result.message,
      activityId,
      status,
      assigned_janitor_name,
      assigned_janitor_id
    });
    
  } catch (error) {
    console.error("❌ TRANSACTION ERROR:", error);
    
    if (error.message.includes("CONFLICT:")) {
      return res.status(409).json({
        error: "Task assignment conflict",
        message: error.message.replace("CONFLICT: ", ""),
        conflict: true
      });
    }
    
    next(error);
  }
};

// Save an activity log
const saveActivityLog = async (req, res, next) => {
  try {
    const { 
      user_id, 
      bin_id, 
      bin_location, 
      bin_status, 
      bin_level, 
      assigned_janitor_id, 
      assigned_janitor_name, 
      task_note, 
      activity_type,
      timestamp,
      description,
      source
    } = req.body;

    const now = new Date();
    const data = {
      user_id,
      bin_id,
      bin_location,
      bin_status: assigned_janitor_id ? 'in_progress' : (bin_status || 'pending'),
      bin_level: bin_level || 0,
      assigned_janitor_id,
      assigned_janitor_name,
      task_note,
      activity_type: activity_type || 'task_assignment',
      status: assigned_janitor_id ? 'in_progress' : 'pending', // Set status based on assignment
      priority: bin_level > 80 ? 'high' : bin_level > 50 ? 'medium' : 'low',
      timestamp: timestamp || now.toISOString(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    console.log("Saving activity log to Firestore collection: activitylogs", data);
    const activityRef = await db.collection("activitylogs").add(data);

    // Send notification to assigned janitor if assigned_janitor_id is provided
    if (assigned_janitor_id) {
      try {
        await sendJanitorAssignmentNotification({
          janitorId: assigned_janitor_id,
          janitorName: assigned_janitor_name,
          binId: bin_id,
          binLocation: bin_location,
          binLevel: bin_level,
          taskNote: task_note,
          activityType: activity_type,
          priority: data.priority,
          activityId: activityRef.id,
          timestamp: now,
          isTaskAssignment: true
        });
      } catch (notifyErr) {
        console.error('[ACTIVITY LOG] Failed to send janitor assignment notification:', notifyErr);
        // Don't fail the main operation if notification fails
      }
    } else {
      // If no assigned janitor, create notifications for all janitors (task available for acceptance)
      try {
        await sendTaskAvailableNotification({
          binId: bin_id,
          binLocation: bin_location,
          binLevel: bin_level,
          taskNote: task_note,
          activityType: activity_type,
          priority: data.priority,
          activityId: activityRef.id,
          timestamp: now
        });
      } catch (notifyErr) {
        console.error('[ACTIVITY LOG] Failed to send task available notification:', notifyErr);
        // Don't fail the main operation if notification fails
      }
    }

    res.status(201).json({ 
      message: "Activity log saved successfully.",
      activity_id: activityRef.id 
    });
  } catch (err) {
    next(err);
  }
};

// Save a task assignment
const saveTaskAssignment = async (req, res, next) => {
  try {
    const { 
      staff_id, 
      bin_id, 
      bin_location, 
      task_type, 
      priority, 
      notes, 
      assigned_by,
      assigned_at 
    } = req.body;

    const data = {
      staff_id,
      bin_id,
      bin_location,
      task_type,
      priority,
      notes,
      assigned_by,
      assigned_at: assigned_at || new Date().toISOString(),
      status: "assigned"
    };

    console.log("Saving task assignment to Firestore collection: task_assignments");
    const taskRef = await db.collection("task_assignments").add(data);

    // Notify assigned janitor (staff_id) via push and in-app record
    try {
      await sendJanitorAssignmentNotification({
        janitorId: staff_id,
        janitorName: null, // Will be fetched from user data
        binId: bin_id,
        binLocation: bin_location,
        binLevel: null,
        taskNote: notes,
        activityType: task_type,
        priority: priority,
        activityId: taskRef.id,
        timestamp: new Date(),
        isTaskAssignment: true
      });
    } catch (notifyErr) {
      console.error('[TASK ASSIGNMENT] Failed to notify assigned janitor:', notifyErr);
    }

    res.status(201).json({ 
      message: "Task assignment saved successfully.",
      task_id: taskRef.id 
    });
  } catch (err) {
    next(err);
  }
};

const getUserActivityLogs = async (req, res, next) => {
  try {
    const { userId } = req.params;

    console.log("Querying activitylogs for user_id:", userId);
    
    // Get activity logs directly without requiring user document to exist
    const snapshot = await db.collection("activitylogs").where("user_id", "==", userId).get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${logs.length} activity logs for user: ${userId}`);

    // Try to get user info if it exists, but don't fail if it doesn't
    let userInfo = { id: userId, name: userId };
    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userInfo = {
          id: userId,
          name: userData.fullName || userData.name || userId
        };
      }
    } catch (userErr) {
      console.log("User document not found, using default user info:", userErr.message);
    }

    res.status(200).json({
      user: userInfo,
      activities: logs
    });

  } catch (err) {
    console.error("Error in getUserActivityLogs:", err);
    next(err);
  }
};

const getDailyActivitySummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const snapshot = await db.collection("activitylogs")
      .where("date", "==", today)
      .orderBy("timestamp", "desc")
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      date: today,
      totalActivities: logs.length,
      activities: logs
    });

  } catch (err) {
    next(err);
  }
};

// Get all activity logs for admin view
const getAllActivityLogs = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0, type, user_id, status } = req.query;
    
    // Fetch all logs without complex Firestore filtering to avoid index issues
    const snapshot = await db.collection("activitylogs").get();
    
    let allLogs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure consistent status values
        status: data.status || 'pending',
        priority: data.priority || (data.bin_level > 80 ? 'high' : data.bin_level > 50 ? 'medium' : 'low'),
        // Format display values
        display_status: getDisplayStatus(data.status || 'pending'),
        display_priority: getDisplayPriority(data.priority || (data.bin_level > 80 ? 'high' : data.bin_level > 50 ? 'medium' : 'low')),
        formatted_date: formatDisplayDate(data.timestamp),
        formatted_time: formatDisplayTime(data.timestamp)
      };
    });

    // Apply filters in-memory
    if (type) {
      allLogs = allLogs.filter(log => log.activity_type === type);
    }
    if (user_id) {
      allLogs = allLogs.filter(log => log.user_id === user_id);
    }
    if (status) {
      allLogs = allLogs.filter(log => log.status === status);
    }

    // Sort by timestamp (descending)
    allLogs.sort((a, b) => {
      const timestampA = a.timestamp || a.created_at || 0;
      const timestampB = b.timestamp || b.created_at || 0;
      return new Date(timestampB) - new Date(timestampA);
    });

    // Apply pagination
    const totalCount = allLogs.length;
    const paginatedLogs = allLogs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.status(200).json({
      activities: paginatedLogs,
      totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
    next(err);
  }
};

// Helper function to get display status
const getDisplayStatus = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'in_progress': 'In Progress',
    'done': 'Done'
  };
  return statusMap[status] || 'Unknown';
};

// Helper function to get display priority
const getDisplayPriority = (priority) => {
  const priorityMap = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'urgent': 'Urgent'
  };
  return priorityMap[priority] || 'Low';
};

// Helper function to format display date
const formatDisplayDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to format display time
const formatDisplayTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Update activity status
const updateActivityStatus = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = ['pending', 'in_progress', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.status_notes = notes;
    }

    await db.collection("activitylogs").doc(activityId).update(updateData);

    res.status(200).json({ 
      message: "Activity status updated successfully",
      activityId,
      status 
    });

  } catch (err) {
    next(err);
  }
};

// Update activity log with completion details
const updateActivityLog = async (req, res, next) => {
  try {
    const { activityId } = req.params;
    const { 
      status, 
      bin_status,
      assigned_janitor_id,
      assigned_janitor_name,
      completion_notes, 
      collected_weight, 
      collection_time,
      bin_condition,
      photos,
      user_id,
      user_name
    } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = ['pending', 'in_progress', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Get the original activity log
    const activityDoc = await db.collection("activitylogs").doc(activityId).get();
    if (!activityDoc.exists) {
      return res.status(404).json({ error: "Activity log not found" });
    }

    const originalData = activityDoc.data();
    const now = new Date().toISOString();
    
    // ASSIGNMENT VALIDATION: Prevent conflicts when assigning janitors
    console.log("🔍 VALIDATION DEBUG:", {
      activityId,
      hasAssignedJanitorId: req.body.assigned_janitor_id !== undefined,
      assignedJanitorId: req.body.assigned_janitor_id,
      assignedJanitorName: req.body.assigned_janitor_name,
      originalAssignedJanitorId: originalData.assigned_janitor_id,
      originalAssignedJanitorName: originalData.assigned_janitor_name,
      originalStatus: originalData.status
    });
    
    if (req.body.assigned_janitor_id !== undefined && req.body.assigned_janitor_id !== null && req.body.assigned_janitor_id !== "") {
      console.log("🔍 VALIDATION CHECK: assigned_janitor_id is defined and not empty");
      
      // Check if task is already assigned to a different janitor
      if (originalData.assigned_janitor_id && 
          originalData.assigned_janitor_id !== req.body.assigned_janitor_id) {
        
        console.log("🚫 ASSIGNMENT CONFLICT DETECTED:", {
          activityId,
          currentAssignee: originalData.assigned_janitor_name,
          currentAssigneeId: originalData.assigned_janitor_id,
          attemptedAssignee: req.body.assigned_janitor_name,
          attemptedAssigneeId: req.body.assigned_janitor_id,
          currentStatus: originalData.status
        });
        
        return res.status(409).json({ 
          error: "Task assignment conflict",
          message: `This task is already assigned to ${originalData.assigned_janitor_name}. Cannot reassign to ${req.body.assigned_janitor_name || 'another janitor'}.`,
          currentAssignee: originalData.assigned_janitor_name,
          currentAssigneeId: originalData.assigned_janitor_id,
          attemptedAssignee: req.body.assigned_janitor_name,
          attemptedAssigneeId: req.body.assigned_janitor_id
        });
      }
      
      // Check if task is already assigned to the same janitor (redundant assignment)
      if (originalData.assigned_janitor_id === req.body.assigned_janitor_id && 
          originalData.status === 'in_progress') {
        
        console.log("ℹ️ REDUNDANT ASSIGNMENT DETECTED:", {
          activityId,
          janitor: originalData.assigned_janitor_name,
          janitorId: originalData.assigned_janitor_id,
          status: originalData.status
        });
        
        return res.status(200).json({ 
          message: "Task already assigned to this janitor",
          activityId,
          status: originalData.status,
          assigned_janitor_name: originalData.assigned_janitor_name,
          assigned_janitor_id: originalData.assigned_janitor_id,
          warning: "No changes made - task already assigned to this janitor"
        });
      }
      
      console.log("✅ VALIDATION PASSED: No conflicts detected");
    } else {
      console.log("🔍 VALIDATION SKIPPED: assigned_janitor_id not provided or empty");
    }
    
    console.log("🔍 Update Activity Debug:", {
      activityId,
      originalData: {
        assigned_janitor_id: originalData.assigned_janitor_id,
        assigned_janitor_name: originalData.assigned_janitor_name,
        status: originalData.status
      },
      requestBody: {
        assigned_janitor_id: req.body.assigned_janitor_id,
        assigned_janitor_name: req.body.assigned_janitor_name,
        status: req.body.status,
        fullBody: req.body
      },
      updateLogic: {
        assigned_janitor_id_undefined: req.body.assigned_janitor_id !== undefined,
        assigned_janitor_name_undefined: req.body.assigned_janitor_name !== undefined,
        assigned_janitor_id_value: req.body.assigned_janitor_id,
        assigned_janitor_name_value: req.body.assigned_janitor_name
      }
    });

    const updateData = {
      status,
      bin_status: bin_status || status,
      task_note: req.body.task_note !== undefined ? req.body.task_note : originalData.task_note,
      priority: req.body.priority !== undefined ? req.body.priority : originalData.priority,
      updated_at: now,
      completed_at: status === 'done' ? now : null,
      completion_notes: completion_notes || '',
      collected_weight: collected_weight || null,
      collection_time: collection_time || now,
      bin_condition: bin_condition || 'good',
      photos: photos || [],
      completed_by: {
        user_id: user_id || null,
        user_name: user_name || 'Unknown',
        completed_at: now
      }
    };

    // Handle assigned_janitor_id and assigned_janitor_name separately to properly handle null values
    if (req.body.assigned_janitor_id !== undefined) {
      if (req.body.assigned_janitor_id === null || req.body.assigned_janitor_id === "") {
        updateData.assigned_janitor_id = null;
      } else {
        updateData.assigned_janitor_id = req.body.assigned_janitor_id;
      }
    } else {
      updateData.assigned_janitor_id = originalData.assigned_janitor_id;
    }

    if (req.body.assigned_janitor_name !== undefined) {
      if (req.body.assigned_janitor_name === null || req.body.assigned_janitor_name === "") {
        updateData.assigned_janitor_name = null;
      } else {
        updateData.assigned_janitor_name = req.body.assigned_janitor_name;
      }
    } else {
      updateData.assigned_janitor_name = originalData.assigned_janitor_name;
    }

    console.log("🔧 Final Update Data:", updateData);
    await db.collection("activitylogs").doc(activityId).update(updateData);
    console.log("✅ Update completed successfully");

    // Send notifications based on status change
    // Note: Task acceptance notifications are handled by assignTaskAtomically function
    // to avoid duplicate notifications

    // Send SMS notification when janitor is assigned
    if (assigned_janitor_id && assigned_janitor_name && status === 'in_progress') {
      try {
        console.log(`[ACTIVITY UPDATE] Sending SMS notification for janitor assignment: ${assigned_janitor_name}`);
        await sendJanitorAssignmentNotification({
          janitorId: assigned_janitor_id,
          janitorName: assigned_janitor_name,
          binId: originalData.bin_id,
          binLocation: originalData.bin_location,
          binLevel: originalData.bin_level,
          taskNote: originalData.task_note || '',
          activityType: originalData.activity_type || 'task_assignment',
          priority: originalData.priority || 'medium',
          activityId: activityId,
          timestamp: new Date(),
          isTaskAssignment: true,
          assignmentType: 'manual' // Manual assignment via activity update
        });
        console.log(`[ACTIVITY UPDATE] ✅ SMS notification sent to ${assigned_janitor_name}`);
      } catch (smsError) {
        console.error('[ACTIVITY UPDATE] SMS notification error:', smsError);
        // Don't fail the main operation if SMS fails
      }
    }

    // If status is 'done', send notification to staff
    if (status === 'done') {
      // Task was completed
      try {
        await sendActivityCompletedNotification({
          activityId: activityId,
          binId: originalData.bin_id,
          binLocation: originalData.bin_location,
          binLevel: originalData.bin_level,
          completedBy: user_name || 'Unknown',
          completionTime: now,
          collectedWeight: collected_weight,
          completionNotes: completion_notes,
          binCondition: bin_condition,
          activityType: originalData.activity_type || 'task_assignment'
        });
      } catch (notifyErr) {
        console.error('[ACTIVITY UPDATE] Failed to send completion notification:', notifyErr);
        // Don't fail the main operation if notification fails
      }
    }

    res.status(200).json({ 
      message: "Activity log updated successfully",
      activityId,
      status,
      completed_at: status === 'done' ? now : null
    });

  } catch (err) {
    console.error("Error updating activity log:", err);
    next(err);
  }
};

// Get all activity logs for any user (for testing/debugging)
const getActivityLogsByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    console.log(`Getting all activity logs for user: ${userId}`);
    
    const snapshot = await db.collection("activitylogs")
      .where("user_id", "==", userId)
      .orderBy("timestamp", "desc")
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${logs.length} activity logs for user: ${userId}`);

    res.status(200).json({
      user_id: userId,
      totalCount: logs.length,
      activities: logs
    });

  } catch (err) {
    console.error("Error in getActivityLogsByUserId:", err);
    next(err);
  }
};

// Get login history logs
const getLoginHistory = async (req, res, next) => {
  try {
    console.log('[LOGIN HISTORY] Fetching login history...');
    
    // Get all login logs from the logs collection
    const snapshot = await db.collection("logs").orderBy("loginTime", "desc").get();
    
    const logs = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        const role = data.role?.toLowerCase().trim() || '';
        const userEmail = data.userEmail?.toLowerCase().trim() || '';
        
        // Exclude admin logs from the response
        const isAdmin = role === 'admin' || role === 'administrator' || userEmail.includes('admin');
        if (isAdmin) {
          console.log(`[LOGIN HISTORY] Excluding admin log: ${data.userEmail} with role: "${data.role}"`);
        }
        return !isAdmin;
      })
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userEmail: data.userEmail || 'Unknown',
          role: data.role || 'Unknown',
          loginTime: data.loginTime || new Date().toISOString(),
          logoutTime: data.logoutTime || null,
          sessionDuration: data.logoutTime ? 
            Math.round((new Date(data.logoutTime).getTime() - new Date(data.loginTime).getTime()) / (1000 * 60)) : 
            null, // Duration in minutes
          status: data.logoutTime ? 'completed' : 'active',
          ipAddress: data.ipAddress || 'Unknown',
          userAgent: data.userAgent || 'Unknown',
          location: data.location || 'Unknown'
        };
      });

    console.log(`[LOGIN HISTORY] Found ${logs.length} login history records (admin logs excluded)`);
    
    res.status(200).json({ 
      logs,
      totalCount: logs.length
    });
  } catch (err) {
    console.error('[LOGIN HISTORY] Error fetching login history:', err);
    next(err);
  }
};

// Delete activity log
const deleteActivityLog = async (req, res, next) => {
  try {
    const { activityId } = req.params;

    // Check if activity exists
    const activityDoc = await db.collection("activitylogs").doc(activityId).get();
    if (!activityDoc.exists) {
      return res.status(404).json({ error: "Activity log not found" });
    }

    // Delete the activity log
    await db.collection("activitylogs").doc(activityId).delete();

    res.status(200).json({ 
      message: "Activity log deleted successfully",
      activityId
    });

  } catch (err) {
    console.error("Error in deleteActivityLog:", err);
    next(err);
  }
};

// Helper function to send activity completed notifications
const sendActivityCompletedNotification = async (notificationData) => {
  try {
    const {
      activityId,
      binId,
      binLocation,
      binLevel,
      completedBy,
      completionTime,
      collectedWeight,
      completionNotes,
      binCondition,
      activityType
    } = notificationData;

    // Get all staff users to notify them
    const staffSnapshot = await db.collection("users").where("role", "in", ["admin", "staff", "supervisor"]).get();
    
    if (staffSnapshot.empty) {
      console.log('[ACTIVITY COMPLETED NOTIFICATION] No staff users found to notify');
      return;
    }

    const title = '✅ Activity Completed';
    const message = `Activity for bin ${binId} at ${binLocation} has been completed by ${completedBy}. Type: ${activityType}`;

    const notificationPayload = {
      binId: binId,
      type: 'activity_completed',
      title: title,
      message: message,
      status: 'COMPLETED',
      binLevel: binLevel,
      completedBy: completedBy,
      completionTime: completionTime,
      collectedWeight: collectedWeight,
      binCondition: binCondition,
      completionNotes: completionNotes,
      activityType: activityType,
      timestamp: new Date(),
      activityId: activityId
    };

    // Send notifications to all staff
    const notificationPromises = [];
    staffSnapshot.forEach((doc) => {
      const staff = doc.data();
      if (staff.fcmToken) {
        notificationPromises.push(
          fcmService.sendToUser(staff.fcmToken, notificationPayload).catch(err => 
            console.error(`[ACTIVITY COMPLETED NOTIFICATION] Failed to send to ${staff.email}:`, err)
          )
        );
      }
      
      // Create in-app notification record in Realtime Database
      notificationPromises.push(
        createRealtimeNotification(doc.id, {
          ...notificationPayload,
          read: false
        }).catch(err => 
          console.error(`[ACTIVITY COMPLETED NOTIFICATION] Failed to create in-app notification for ${staff.email}:`, err)
        )
      );
    });

    await Promise.all(notificationPromises);
    console.log(`[ACTIVITY COMPLETED NOTIFICATION] Successfully notified ${staffSnapshot.size} staff members about activity completion`);

  } catch (error) {
    console.error('[ACTIVITY COMPLETED NOTIFICATION] Error sending activity completion notification:', error);
    throw error;
  }
};

// Helper function to send bin collection notifications
const sendBinCollectionNotification = async (notificationData) => {
  try {
    const {
      activityId,
      binId,
      binLocation,
      binLevel,
      collectedBy,
      collectionTime,
      collectedWeight,
      completionNotes,
      binCondition
    } = notificationData;

    // Get all staff users to notify them
    const staffSnapshot = await db.collection("users").where("role", "in", ["admin", "staff", "supervisor"]).get();
    
    if (staffSnapshot.empty) {
      console.log('[BIN COLLECTION NOTIFICATION] No staff users found to notify');
      return;
    }

    const title = '🗑️ Bin Collection Completed';
    const message = `Bin ${binId} at ${binLocation} has been collected by ${collectedBy}. Weight: ${collectedWeight || 'N/A'}kg, Condition: ${binCondition}`;

    const notificationPayload = {
      binId: binId,
      type: 'bin_collection_completed',
      title: title,
      message: message,
      status: 'COMPLETED',
      binLevel: binLevel,
      collectedBy: collectedBy,
      collectionTime: collectionTime,
      collectedWeight: collectedWeight,
      binCondition: binCondition,
      completionNotes: completionNotes,
      timestamp: new Date(),
      activityId: activityId
    };

    // Send notifications to all staff
    const notificationPromises = [];
    staffSnapshot.forEach((doc) => {
      const staff = doc.data();
      if (staff.fcmToken) {
        notificationPromises.push(
          fcmService.sendToUser(staff.fcmToken, notificationPayload).catch(err => 
            console.error(`[BIN COLLECTION NOTIFICATION] Failed to send to ${staff.email}:`, err)
          )
        );
      }
      
      // Create in-app notification record in Realtime Database
      notificationPromises.push(
        createRealtimeNotification(doc.id, {
          ...notificationPayload,
          read: false
        }).catch(err => 
          console.error(`[BIN COLLECTION NOTIFICATION] Failed to create in-app notification for ${staff.email}:`, err)
        )
      );
    });

    await Promise.all(notificationPromises);
    console.log(`[BIN COLLECTION NOTIFICATION] Successfully notified ${staffSnapshot.size} staff members about bin collection completion`);

  } catch (error) {
    console.error('[BIN COLLECTION NOTIFICATION] Error sending bin collection notification:', error);
    throw error;
  }
};

// Helper function to send task acceptance notifications to staff
const sendTaskAcceptanceNotification = async (notificationData) => {
  try {
    const {
      activityId,
      binId,
      binLocation,
      binLevel,
      janitorId,
      janitorName,
      activityType,
      priority,
      timestamp
    } = notificationData;

    // Get all staff users to notify them about task acceptance
    const staffUsers = await notificationModel.getUsersByRoles(['staff', 'admin', 'supervisor']);
    
    console.log(`[TASK ACCEPTANCE] Found ${staffUsers.length} staff users:`, staffUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));
    
    if (staffUsers.length === 0) {
      console.log('[TASK ACCEPTANCE] No staff users found to notify.');
      return false;
    }

    const title = '✅ Task Accepted';
    const message = `${janitorName || 'A janitor'} has accepted the task for bin ${binId} at ${binLocation}. Status: In Progress`;

    const notificationPayload = {
      binId: binId,
      type: 'task_accepted',
      title: title,
      message: message,
      status: 'ACCEPTED',
      binLevel: binLevel,
      acceptedBy: janitorName,
      acceptedById: janitorId,
      activityType: activityType,
      priority: priority,
      timestamp: Date.now(),
      read: false
    };

    // Send notification to all staff users using Realtime Database (like the rest of the system)
    const notificationPromises = staffUsers.map(async (staff) => {
      try {
        // Create notification in Realtime Database (same as other notifications)
        await createRealtimeNotification(staff.id, notificationPayload);
        console.log(`[TASK ACCEPTANCE] Created Realtime Database notification for staff ${staff.email}`);
        return true;
      } catch (err) {
        console.error(`[TASK ACCEPTANCE] Failed to create notification for ${staff.email}:`, err);
        return false;
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r === true).length;
    console.log(`[TASK ACCEPTANCE] Sent task acceptance notification to ${successCount}/${staffUsers.length} staff members.`);
    return successCount > 0;
  } catch (error) {
    console.error('[TASK ACCEPTANCE] Error sending task acceptance notification:', error);
    return false;
  }
};

// Helper function to mark notifications as read when a task is accepted
const markNotificationsAsReadForTask = async (janitorId, binId, activityId) => {
  try {
    console.log(`[MARK NOTIFICATIONS AS READ] Marking notifications as read for janitor ${janitorId}, bin ${binId}, activity ${activityId}`);
    
    // Find and mark notifications as read for this specific task
    const notificationsSnapshot = await db.collection('notifications')
      .where('janitorId', '==', janitorId)
      .where('binId', '==', binId)
      .where('read', '==', false)
      .get();
    
    if (notificationsSnapshot.empty) {
      console.log(`[MARK NOTIFICATIONS AS READ] No unread notifications found for janitor ${janitorId} and bin ${binId}`);
      return;
    }
    
    // Mark all matching notifications as read
    const batch = db.batch();
    notificationsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
    
    await batch.commit();
    
    console.log(`[MARK NOTIFICATIONS AS READ] ✅ Marked ${notificationsSnapshot.docs.length} notifications as read for janitor ${janitorId}`);
    
  } catch (error) {
    console.error('[MARK NOTIFICATIONS AS READ] Error marking notifications as read:', error);
    throw error;
  }
};

// Helper function to send task available notifications to all janitors
const sendTaskAvailableNotification = async (notificationData) => {
  try {
    const {
      binId,
      binLocation,
      binLevel,
      taskNote,
      activityType,
      priority,
      activityId,
      timestamp
    } = notificationData;

    // Get all janitor users to notify them about the available task
    const janitorUsers = await notificationModel.getUsersByRoles(['janitor', 'staff']);
    
    if (janitorUsers.length === 0) {
      console.log('[TASK AVAILABLE NOTIFICATION] No janitor users found to notify');
      return;
    }

    const priorityEmoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
    const binLevelText = binLevel ? ` (${binLevel}% full)` : '';
    const locationText = binLocation ? ` at ${binLocation}` : '';
    
    const title = '🚮 Bin Needs Collection';
    const message = `Bin ${binId}${locationText}${binLevelText} needs collection. Please accept this task.\n📝 ${taskNote}\n\nPriority: ${priorityEmoji} ${priority}\n\n⚠️ Click to accept this task!`;

    const notificationPayload = {
      binId: binId,
      type: 'bin_full',
      title: title,
      message: message,
      status: 'AVAILABLE_FOR_ACCEPTANCE',
      binLevel: binLevel,
      gps: { lat: 0, lng: 0 }, // Default GPS, can be updated with actual location
      timestamp: timestamp || new Date(),
      activityId: activityId,
      priority: priority,
      availableForAcceptance: true
    };

    // Send notifications to all janitors
    const notificationPromises = janitorUsers.map(janitor => {
      // Send push notification if FCM token exists
      const fcmPromise = janitor.fcmToken ? 
        fcmService.sendToUser(janitor.fcmToken, notificationPayload).catch(err => 
          console.error(`[TASK AVAILABLE NOTIFICATION] FCM failed for ${janitor.id}:`, err)
        ) : Promise.resolve();

      // Create in-app notification record
      const inAppPromise = notificationModel.createNotification({
        ...notificationPayload,
        janitorId: janitor.id
      }).catch(err => 
        console.error(`[TASK AVAILABLE NOTIFICATION] In-app notification failed for ${janitor.id}:`, err)
      );

      return Promise.all([fcmPromise, inAppPromise]);
    });

    await Promise.all(notificationPromises);
    
    console.log(`[TASK AVAILABLE NOTIFICATION] ✅ Sent task available notifications to ${janitorUsers.length} janitors`);
    console.log(`🔔 TASK AVAILABLE NOTIFICATIONS:`);
    console.log(`   Activity ID: ${activityId}`);
    console.log(`   Bin: ${binId} at ${binLocation}`);
    console.log(`   Level: ${binLevel}% (Priority: ${priority})`);
    console.log(`   Time: ${new Date().toLocaleString()}`);
    console.log(`   Recipients: ${janitorUsers.length} janitors`);
    
  } catch (error) {
    console.error('[TASK AVAILABLE NOTIFICATION] Error sending task available notifications:', error);
    throw error;
  }
};

// Helper function to send janitor assignment notifications
const sendJanitorAssignmentNotification = async (notificationData) => {
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
      isTaskAssignment = false
    } = notificationData;

    // Get janitor information
    const janitor = await notificationModel.getUserById(janitorId);
    if (!janitor) {
      console.error(`[JANITOR NOTIFICATION] Janitor with ID ${janitorId} not found`);
      return;
    }

    // Debug logging
    console.log(`[JANITOR NOTIFICATION DEBUG] isTaskAssignment: ${isTaskAssignment}, contactNumber: ${janitor.contactNumber}`);

    // Determine notification type and content
    const notificationType = isTaskAssignment ? 'task_assignment' : 'activity_assignment';
    const priorityEmoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
    const binLevelText = binLevel ? ` (${binLevel}% full)` : '';
    const locationText = binLocation ? ` at ${binLocation}` : '';
    const taskTypeText = activityType ? ` (${activityType})` : '';
    const noteText = taskNote ? `\n📝 Note: ${taskNote}` : '';

    const title = isTaskAssignment ? '🧹 New Task Assigned' : '📋 New Activity Assigned';
    const message = `You have been assigned a new ${activityType || 'task'} for bin ${binId}${locationText}${binLevelText}${taskTypeText}.${noteText}\n\nPriority: ${priorityEmoji} ${priority || 'normal'}`;

    const notificationPayload = {
      binId: binId,
      type: notificationType,
      title: title,
      message: message,
      status: 'ASSIGNED',
      binLevel: binLevel,
      gps: { lat: 0, lng: 0 }, // Default GPS, can be updated with actual location
      timestamp: timestamp || new Date(),
      activityId: activityId,
      priority: priority
    };

    // Send push notification if FCM token exists
    if (janitor.fcmToken) {
      try {
        await fcmService.sendToUser(janitor.fcmToken, notificationPayload);
        console.log(`[JANITOR NOTIFICATION] Push notification sent to janitor ${janitorId}`);
      } catch (fcmErr) {
        console.error('[JANITOR NOTIFICATION] FCM send failed:', fcmErr);
      }
    } else {
      console.log(`[JANITOR NOTIFICATION] No FCM token found for janitor ${janitorId}`);
    }

    // Create in-app notification record
    await notificationModel.createNotification({
      ...notificationPayload,
      janitorId: janitorId
    });

    console.log(`[JANITOR NOTIFICATION] In-app notification created for janitor ${janitorId}`);

    // Send SMS notification for manual task assignments
    console.log(`[JANITOR NOTIFICATION DEBUG] SMS check - isTaskAssignment: ${isTaskAssignment}, hasContactNumber: ${!!janitor.contactNumber}`);
    if (isTaskAssignment && janitor.contactNumber) {
      try {
        console.log(`[JANITOR NOTIFICATION] Sending SMS notification to janitor: ${janitorId}`);
        
        // Fetch real-time bin data from database
        let binWeight = 0;
        let binHeight = 0;
        let binCoordinates = { latitude: 0, longitude: 0 };
        let currentBinLevel = binLevel || 0;
        let dataSource = 'fallback'; // Track data source for logging
        
        // Check database health before attempting to fetch
        const dbHealth = await checkDatabaseHealth();
        if (!dbHealth.isHealthy) {
          console.warn(`[JANITOR NOTIFICATION] ⚠️ Database not healthy: ${dbHealth.error}, using fallback values`);
        } else {
          try {
            console.log(`[JANITOR NOTIFICATION] Fetching real-time data for bin: ${binId}`);
            const binRef = rtdb.ref(`monitoring/${binId}`);
            
            // Add timeout protection for database query
            const fetchPromise = binRef.once('value');
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database query timeout')), 5000)
            );
            
            const binSnapshot = await Promise.race([fetchPromise, timeoutPromise]);
            const binData = binSnapshot.val();
          
            if (binData) {
              binWeight = binData.weight_kg || 0;
              binHeight = binData.height_percent || 0;
              currentBinLevel = binData.bin_level || binLevel || 0;
              dataSource = 'database';
              
              // Get coordinates if available
              if (binData.gps_latitude && binData.gps_longitude) {
                binCoordinates = {
                  latitude: binData.gps_latitude,
                  longitude: binData.gps_longitude
                };
              } else if (binData.latitude && binData.longitude) {
                binCoordinates = {
                  latitude: binData.latitude,
                  longitude: binData.longitude
                };
              }
              
              console.log(`[JANITOR NOTIFICATION] ✅ Fetched bin data for ${binId}:`, {
                weight: binWeight,
                height: binHeight,
                level: currentBinLevel,
                coordinates: binCoordinates,
                source: dataSource
              });
            } else {
              console.warn(`[JANITOR NOTIFICATION] ⚠️ Bin data not found for ${binId}, using fallback values`);
            }
          } catch (fetchError) {
            console.error(`[JANITOR NOTIFICATION] ❌ Error fetching bin data for ${binId}:`, fetchError);
            console.log(`[JANITOR NOTIFICATION] Using fallback values for SMS`);
          }
        }
        
        // Validate and sanitize data before sending SMS
        const sanitizedData = {
          binName: `Bin ${binId}`,
          binLocation: (binLocation && binLocation.trim()) || 'Unknown Location',
          binLevel: Math.max(0, Math.min(100, currentBinLevel)), // Ensure 0-100 range
          weight: Math.max(0, binWeight), // Ensure non-negative weight
          height: Math.max(0, Math.min(100, binHeight)), // Ensure 0-100 range
          coordinates: {
            latitude: binCoordinates.latitude || 0,
            longitude: binCoordinates.longitude || 0
          },
          taskNotes: (taskNote && taskNote.trim()) || '',
          assignedBy: (janitorName && janitorName.trim()) || 'Staff',
          dataSource: dataSource, // Include data source for debugging
          assignmentType: notificationData.assignmentType || 'automatic' // Add assignment type
        };

        console.log(`[JANITOR NOTIFICATION] Sending SMS with sanitized data:`, {
          binId,
          dataSource,
          weight: sanitizedData.weight,
          height: sanitizedData.height,
          level: sanitizedData.binLevel
        });

        const smsResult = await smsNotificationService.sendManualTaskSMS(sanitizedData, janitorId);

        if (smsResult.success) {
          console.log(`[JANITOR NOTIFICATION] ✅ SMS sent successfully to ${smsResult.janitor.name}`);
        } else {
          console.error(`[JANITOR NOTIFICATION] ❌ SMS failed: ${smsResult.error}`);
        }
      } catch (smsError) {
        console.error('[JANITOR NOTIFICATION] SMS notification error:', smsError);
        // Don't fail the main operation if SMS fails
      }
    } else if (isTaskAssignment && !janitor.contactNumber) {
      console.log(`[JANITOR NOTIFICATION] No contact number found for janitor ${janitorId}, skipping SMS notification`);
    }

    // Log the assignment for tracking
    console.log(`[JANITOR NOTIFICATION] Successfully notified janitor ${janitorId} (${janitor.name || janitorName || 'Unknown'}) about ${isTaskAssignment ? 'task' : 'activity'} assignment for bin ${binId}`);

    // Return success result
    return {
      success: true,
      message: 'Janitor notification sent successfully',
      janitor: {
        id: janitorId,
        name: janitor.name || janitorName || 'Unknown',
        contactNumber: janitor.contactNumber
      },
      binId: binId,
      isTaskAssignment: isTaskAssignment
    };

  } catch (error) {
    console.error('[JANITOR NOTIFICATION] Error sending janitor assignment notification:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send janitor notification'
    };
  }
};

// Manual task assignment endpoint
const assignTaskManually = async (req, res, next) => {
  try {
    const { activityId, janitorId, janitorName, taskNote } = req.body;
    
    if (!activityId || !janitorId) {
      return res.status(400).json({
        success: false,
        error: 'activityId and janitorId are required'
      });
    }

    console.log(`[MANUAL ASSIGNMENT] Assigning task ${activityId} to janitor ${janitorId}`);

    // Get the activity log to extract bin information
    const activityRef = db.collection("activitylogs").doc(activityId);
    const activityDoc = await activityRef.get();
    
    if (!activityDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Activity log not found'
      });
    }

    const activityData = activityDoc.data();
    const binId = activityData.bin_id;
    const binLocation = activityData.bin_location;
    const binLevel = activityData.bin_level;

    // Update the activity log with janitor assignment
    const updateData = {
      assigned_janitor_id: janitorId,
      assigned_janitor_name: janitorName || 'Staff Assigned',
      status: 'in_progress',
      bin_status: 'in_progress',
      updated_at: new Date().toISOString(),
      assignment_type: 'manual',
      assignment_timestamp: new Date().toISOString()
    };

    await activityRef.update(updateData);

    // Send SMS notification to the assigned janitor
    try {
      await sendJanitorAssignmentNotification({
        janitorId,
        janitorName: janitorName || 'Staff Assigned',
        binId,
        binLocation: binLocation || 'Unknown Location',
        binLevel: binLevel || 0,
        taskNote: taskNote || '',
        activityType: 'manual_assignment',
        priority: binLevel >= 80 ? 'high' : binLevel >= 50 ? 'medium' : 'low',
        activityId: activityId,
        timestamp: new Date(),
        isTaskAssignment: true,
        assignmentType: 'manual' // Add indicator for manual assignment
      });

      console.log(`[MANUAL ASSIGNMENT] ✅ Task ${activityId} assigned to janitor ${janitorId} with SMS notification`);
    } catch (smsError) {
      console.error('[MANUAL ASSIGNMENT] SMS notification error:', smsError);
      // Don't fail the assignment if SMS fails
    }

    res.json({
      success: true,
      message: 'Task assigned successfully',
      data: {
        activityId,
        assigned_janitor_id: janitorId,
        assigned_janitor_name: janitorName || 'Staff Assigned',
        status: 'in_progress',
        assignment_type: 'manual'
      }
    });

  } catch (error) {
    console.error('[MANUAL ASSIGNMENT] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Test endpoint for janitor assignment notifications
const testJanitorNotification = async (req, res, next) => {
  try {
    const { janitorId, binId, binLocation, binLevel, taskNote, activityType, priority } = req.body;

    if (!janitorId || !binId) {
      return res.status(400).json({ 
        error: "janitorId and binId are required" 
      });
    }

    console.log('[TEST NOTIFICATION] Testing janitor assignment notification...');
    
    await sendJanitorAssignmentNotification({
      janitorId: janitorId,
      janitorName: null,
      binId: binId,
      binLocation: binLocation || 'Test Location',
      binLevel: binLevel || 75,
      taskNote: taskNote || 'This is a test notification',
      activityType: activityType || 'test_task',
      priority: priority || 'medium',
      activityId: 'test-activity-' + Date.now(),
      timestamp: new Date(),
      isTaskAssignment: false
    });

    res.status(200).json({ 
      message: "Test notification sent successfully",
      janitorId,
      binId
    });

  } catch (err) {
    console.error('[TEST NOTIFICATION] Error sending test notification:', err);
    next(err);
  }
};

module.exports = {
  saveActivityLog,
  saveTaskAssignment,
  getUserActivityLogs,
  getDailyActivitySummary,
  getAllActivityLogs,
  getActivityLogsByUserId,
  getAssignedActivityLogs,
  updateActivityStatus,
  updateActivityLog,
  deleteActivityLog,
  assignTaskAtomically,
  getActivityStatsSimple,
  getLoginHistory,
  markNotificationsAsReadForTask,
  sendTaskAvailableNotification,
  sendJanitorAssignmentNotification,
  sendBinCollectionNotification,
  sendActivityCompletedNotification,
  sendTaskAcceptanceNotification,
  assignTaskManually,
  testJanitorNotification
};
