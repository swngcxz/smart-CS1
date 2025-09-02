const { db } = require("../models/firebase");
const notificationModel = require('../models/notificationModel');
const fcmService = require('../services/fcmService');

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
      timestamp 
    } = req.body;

    const data = {
      user_id,
      bin_id,
      bin_location,
      bin_status,
      bin_level,
      assigned_janitor_id,
      assigned_janitor_name,
      task_note,
      activity_type: activity_type || 'task_assignment',
      timestamp: timestamp || new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0]
    };

    console.log("Saving activity log to Firestore collection: activitylogs", data);
    await db.collection("activitylogs").add(data);

    res.status(201).json({ message: "Activity log saved successfully." });
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
      const janitor = await notificationModel.getUserById(staff_id);
      const notificationData = {
        binId: bin_id,
        type: 'task_assignment',
        title: `🧹 New Task Assigned`,
        message: `You have a new ${task_type || 'task'} for bin ${bin_id} at ${bin_location || 'assigned location'}. Priority: ${priority || 'normal'}.`,
        status: 'ASSIGNED',
        binLevel: null,
        gps: { lat: 0, lng: 0 },
        timestamp: new Date()
      };

      // Send push if token exists
      if (janitor && janitor.fcmToken) {
        try {
          await fcmService.sendToUser(janitor.fcmToken, notificationData);
        } catch (sendErr) {
          console.error('[TASK ASSIGNMENT] FCM send failed:', sendErr);
        }
      }

      // Create in-app notification record
      await notificationModel.createNotification({
        ...notificationData,
        janitorId: staff_id
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
    const { limit = 100, offset = 0, type, user_id } = req.query;
    
    let query = db.collection("activitylogs");
    
    // Apply filters if provided
    if (type) {
      query = query.where("activity_type", "==", type);
    }
    if (user_id) {
      query = query.where("user_id", "==", user_id);
    }
    
    // Get logs with pagination
    const snapshot = await query
      .orderBy("timestamp", "desc")
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get total count for pagination
    const totalSnapshot = await query.get();
    const totalCount = totalSnapshot.size;

    res.status(200).json({
      activities: logs,
      totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (err) {
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

module.exports = {
  saveActivityLog,
  saveTaskAssignment,
  getUserActivityLogs,
  getDailyActivitySummary,
  getAllActivityLogs,
  getActivityLogsByUserId
};
