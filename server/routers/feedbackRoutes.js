const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Submit new feedback (public endpoint)
router.post('/', feedbackController.submitFeedback);

// Get all feedback with pagination (admin only - can be made public if needed)
router.get('/', feedbackController.getAllFeedback);

// Get feedback by ID (admin only)
router.get('/:id', feedbackController.getFeedbackById);

// Get feedback statistics (admin only)
router.get('/stats/overview', feedbackController.getFeedbackStats);

// Update feedback status (admin only)
router.put('/:id/status', feedbackController.updateFeedbackStatus);

// Delete feedback (admin only)
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;
