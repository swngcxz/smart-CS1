const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');


// Send notification
router.post('/send', notificationController.sendNotification);

// Get notifications for a user
router.get('/:userId', notificationController.getNotifications);

// Mark a single notification as read
router.patch('/:userId/mark-read/:key', notificationController.markNotificationRead);

// Mark all notifications as read
router.patch('/:userId/mark-all-read', notificationController.markAllNotificationsRead);

// Delete a notification
router.delete('/:userId/:key', notificationController.deleteNotification);

module.exports = router;
