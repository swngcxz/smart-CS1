const express = require("express");
const { saveActivityLog, getUserActivityLogs,getDailyActivitySummary  } = require("../controllers/activityController");

const router = express.Router();

// Save a new activity log
router.post("/activitylogs", saveActivityLog);

// Get all activity logs for a user
router.get("/activitylogs/:userId", getUserActivityLogs);


router.get("/activity/daily-summary", getDailyActivitySummary);

module.exports = router;
