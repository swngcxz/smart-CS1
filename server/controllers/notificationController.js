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
    console.log(`⚠️ Warning bin notification sent: Bin ${binId} at ${binLevel}%`);
    return true;
  } catch (error) {
    console.error('Failed to send warning bin notification:', error);
    return false;
  }
};
const admin = require('firebase-admin');
const db = admin.database();

// Send a notification to a user or group
exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'info', metadata = {} } = req.body;
    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'userId, title, and message are required' });
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
    console.log(`📧 Notification sent to ${userId}: ${title}`);
    res.status(200).json({ success: true });
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
