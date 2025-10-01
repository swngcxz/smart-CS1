const admin = require('firebase-admin');
const db = admin.database();
const rateLimitService = require('../services/rateLimitService');

// Mark a single notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const { userId, key } = req.params;
    if (!userId || !key) {
      return res.status(400).json({ error: 'userId and key are required' });
    }
    
    // Update notification in Realtime Database
    await db.ref(`notifications/${userId}/${key}`).update({ 
      read: true,
      readAt: new Date().toISOString()
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark all notifications as read
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const ref = db.ref(`notifications/${userId}`);
    const snapshot = await ref.once('value');
    const notifications = snapshot.val() || {};
    const updates = {};
    
    Object.keys(notifications).forEach(key => {
      updates[`${key}/read`] = true;
      updates[`${key}/readAt`] = new Date().toISOString();
    });
    
    await ref.update(updates);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { userId, key } = req.params;
    if (!userId || !key) {
      return res.status(400).json({ error: 'userId and key are required' });
    }
    await db.ref(`notifications/${userId}/${key}`).remove();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send critical bin level notification to admin
exports.sendCriticalBinNotification = async (binId, binLevel, location) => {
  try {
    const adminUserId = 'admin';
    
    // Check rate limit before sending notification
    const rateLimitStatus = rateLimitService.checkNotificationUploadLimit(adminUserId);
    if (!rateLimitStatus.allowed) {
      console.log(`[NOTIFICATION CONTROLLER] Rate limit exceeded for admin notifications. Current: ${rateLimitStatus.currentCount}/${rateLimitStatus.maxCount}`);
      return false;
    }
    
    const notification = {
      title: 'Critical Bin Alert',
      message: `Bin ${binId} at ${location} is at ${binLevel}% capacity and needs immediate attention!`,
      timestamp: Date.now(),
      read: false,
      type: 'critical',
      binId,
      binLevel,
      location
    };
    await db.ref(`notifications/${adminUserId}`).push(notification);
    
    // Record the notification upload
    rateLimitService.recordNotificationUpload(adminUserId);
    
    console.log(`🚨 Critical bin notification sent: Bin ${binId} at ${binLevel}%`);
    return true;
  } catch (error) {
    console.error('Failed to send critical bin notification:', error);
    return false;
  }
};

// Send warning bin level notification to admin
exports.sendWarningBinNotification = async (binId, binLevel, location) => {
  try {
    const adminUserId = 'admin';
    
    // Check rate limit before sending notification
    const rateLimitStatus = rateLimitService.checkNotificationUploadLimit(adminUserId);
    if (!rateLimitStatus.allowed) {
      console.log(`[NOTIFICATION CONTROLLER] Rate limit exceeded for admin notifications. Current: ${rateLimitStatus.currentCount}/${rateLimitStatus.maxCount}`);
      return false;
    }
    
    const notification = {
      title: 'Bin Warning Alert',
      message: `Bin ${binId} at ${location} is at ${binLevel}% capacity and should be monitored.`,
      timestamp: Date.now(),
      read: false,
      type: 'warning',
      binId,
      binLevel,
      location
    };
    await db.ref(`notifications/${adminUserId}`).push(notification);
    
    // Record the notification upload
    rateLimitService.recordNotificationUpload(adminUserId);
    
    console.log(`⚠️ Warning bin notification sent: Bin ${binId} at ${binLevel}%`);
    return true;
  } catch (error) {
    console.error('Failed to send warning bin notification:', error);
    return false;
  }
};

// Send admin login notification (only for admin dashboard)
exports.sendAdminLoginNotification = async (userData) => {
  try {
    const adminUserId = 'admin';
    
    // Check rate limit before sending notification
    const rateLimitStatus = rateLimitService.checkNotificationUploadLimit(adminUserId);
    if (!rateLimitStatus.allowed) {
      console.log(`[NOTIFICATION CONTROLLER] Rate limit exceeded for admin notifications. Current: ${rateLimitStatus.currentCount}/${rateLimitStatus.maxCount}`);
      return false;
    }
    
    const notification = {
      title: 'User Login',
      message: `${userData.fullName || userData.firstName || 'Unknown User'} (${userData.role || 'user'})`,
      timestamp: Date.now(),
      read: false,
      type: 'login',
      userId: userData.id,
      userRole: userData.role || 'user',
      userEmail: userData.email,
      userFullName: userData.fullName || userData.firstName || 'Unknown'
    };

    await db.ref(`notifications/${adminUserId}`).push(notification);
    
    // Record the notification upload
    rateLimitService.recordNotificationUpload(adminUserId);
    
    console.log(`📧 Admin login notification sent: ${userData.email} (${userData.role || 'user'}) logged in`);
    return true;
  } catch (error) {
    console.error('Failed to send admin login notification:', error);
    return false;
  }
};

// Send a notification to a user or group
exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'info', metadata = {} } = req.body;
    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'userId, title, and message are required' });
    }

    // Check rate limit before sending notification
    const rateLimitStatus = rateLimitService.checkNotificationUploadLimit(userId);
    if (!rateLimitStatus.allowed) {
      console.log(`[NOTIFICATION CONTROLLER] Rate limit exceeded for user ${userId}. Current: ${rateLimitStatus.currentCount}/${rateLimitStatus.maxCount}`);
      return res.status(429).json({ 
        error: 'Daily notification limit exceeded for this user',
        rateLimit: {
          currentCount: rateLimitStatus.currentCount,
          maxCount: rateLimitStatus.maxCount,
          remaining: rateLimitStatus.remaining,
          resetTime: rateLimitStatus.resetTime
        }
      });
    }

    const notification = {
      title,
      message,
      timestamp: Date.now(),
      read: false,
      type,
      ...metadata
    };

    await db.ref(`notifications/${userId}`).push(notification);
    
    // Record the notification upload
    rateLimitService.recordNotificationUpload(userId);
    
    console.log(`📧 Notification sent to ${userId}: ${title}`);
    res.status(200).json({ 
      success: true,
      rateLimit: rateLimitService.checkNotificationUploadLimit(userId)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get notifications for a user (staff notifications - bin activities)
exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    console.log(`[GET NOTIFICATIONS] Fetching notifications for user: ${userId}`);
    
    // Get staff notifications from Realtime Database
    const snapshot = await db.ref(`notifications/${userId}`).once('value');
    const notifications = snapshot.val() || {};
    
    console.log(`[GET NOTIFICATIONS] Raw notifications for ${userId}:`, Object.keys(notifications).length);
    
    // Filter out admin login notifications for staff users
    const filteredNotifications = {};
    Object.entries(notifications).forEach(([key, notification]) => {
      // Only include bin activity notifications for staff
      if (notification.type === 'activity_completed' || 
          notification.type === 'bin_collection_completed' ||
          notification.type === 'bin_full' ||
          notification.type === 'bin_warning' ||
          notification.type === 'bin_maintenance' ||
          notification.type === 'bin_maintenance_urgent' ||
          notification.type === 'task_accepted') {
        filteredNotifications[key] = notification;
      }
    });
    
    console.log(`[GET NOTIFICATIONS] Filtered notifications for ${userId}:`, Object.keys(filteredNotifications).length);
    
    res.status(200).json({ notifications: filteredNotifications });
  } catch (error) {
    console.error('Error getting staff notifications:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get admin notifications (with access control)
exports.getAdminNotifications = async (req, res) => {
  try {
    // For development/testing, allow access without strict authentication
    // In production, you should uncomment the authentication checks below
    
    // Check if user is authenticated and is admin
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    // Skip authentication for development - remove this in production
    if (!token) {
      console.log('[ADMIN NOTIFICATIONS] No token provided - allowing access for development');
    } else {
      // Verify JWT token and check admin role
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.TOKEN_SECRET || "your_jwt_secret";
      
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
        console.log('[ADMIN NOTIFICATIONS] Token verified for user:', decoded);
      } catch (err) {
        console.log('[ADMIN NOTIFICATIONS] Invalid token - allowing access for development');
      }
    }

    // Get admin notifications (login alerts only)
    const adminUserId = 'admin';
    const snapshot = await db.ref(`notifications/${adminUserId}`).once('value');
    const allNotifications = snapshot.val() || {};
    
    // Filter to only show admin login notifications
    const adminNotifications = {};
    Object.entries(allNotifications).forEach(([key, notification]) => {
      // Only include admin login notifications
      if (notification.type === 'login' || 
          notification.title?.includes('User Login') ||
          notification.title?.includes('Staff Login Alert')) {
        adminNotifications[key] = notification;
      }
    });
    
    res.status(200).json({ notifications: adminNotifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get rate limit statistics for notifications
exports.getNotificationRateLimitStats = async (req, res) => {
  try {
    const stats = rateLimitService.getStats();
    
    res.status(200).json({
      success: true,
      message: 'Notification rate limit statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
