// Mark a single notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const { userId, key } = req.params;
    if (!userId || !key) {
      return res.status(400).json({ error: 'userId and key are required' });
    }
    await db.ref(`notifications/${userId}/${key}`).update({ read: true });
    res.status(200).json({ success: true });
  } catch (error) {
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
    });
    await ref.update(updates);
    res.status(200).json({ success: true });
  } catch (error) {
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
const admin = require('firebase-admin');
const db = admin.database();
const rateLimitService = require('../services/rateLimitService');

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

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const snapshot = await db.ref(`notifications/${userId}`).once('value');
    const notifications = snapshot.val() || {};
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get admin notifications (with access control)
exports.getAdminNotifications = async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify JWT token and check admin role
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.TOKEN_SECRET || "your_jwt_secret";
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin - allow both 'admin' role and 'acc_type' admin
    if (decoded.role !== 'admin' && decoded.acc_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get admin notifications
    const adminUserId = 'admin';
    const snapshot = await db.ref(`notifications/${adminUserId}`).once('value');
    const notifications = snapshot.val() || {};
    
    res.status(200).json({ notifications });
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
