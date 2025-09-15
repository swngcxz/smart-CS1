const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');


// Send notification
router.post('/send', notificationController.sendNotification);

// Get notifications for a user
router.get('/:userId', notificationController.getNotifications);

// Admin-specific route for admin notifications (with access control)
router.get('/admin/notifications', notificationController.getAdminNotifications);

// Mark a single notification as read
router.patch('/:userId/mark-read/:key', notificationController.markNotificationRead);

// Mark all notifications as read
router.patch('/:userId/mark-all-read', notificationController.markAllNotificationsRead);

// Delete a notification
router.delete('/:userId/:key', notificationController.deleteNotification);

// Get rate limit statistics for notifications
router.get('/rate-limit/stats', notificationController.getNotificationRateLimitStats);

module.exports = router;
