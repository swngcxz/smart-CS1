const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

// Submit a rating
router.post('/', ratingController.submitRating);

// Get ratings (with pagination)
router.get('/', ratingController.getRatings);

// Get rating statistics
router.get('/stats', ratingController.getRatingStats);

module.exports = router;
