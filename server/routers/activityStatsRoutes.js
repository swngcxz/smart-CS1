const express = require("express");
const router = express.Router();
const { getActivityStats, getActivityStatsWithRange } = require("../controllers/activityStatsController");

// Get activity statistics for today (overview cards)
router.get("/activity-stats", getActivityStats);

// Get activity statistics with date range
router.get("/activity-stats/range", getActivityStatsWithRange);

module.exports = router;
