const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all performance routes
router.use(authMiddleware);

// Get janitor performance data for a specific month/year
router.get('/janitors', performanceController.getJanitorPerformance);

// Get performance summary for dashboard
router.get('/summary', performanceController.getPerformanceSummary);

module.exports = router;
