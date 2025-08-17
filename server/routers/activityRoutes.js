const express = require("express");
const { saveActivityLog, saveTaskAssignment, getUserActivityLogs, getDailyActivitySummary, getAllActivityLogs, getActivityLogsByUserId } = require("../controllers/activityController");

const router = express.Router();

// Save a new activity log
router.post("/activitylogs", saveActivityLog);

// Save a task assignment
router.post("/task-assignments", saveTaskAssignment);

// Get all activity logs for admin view
router.get("/activitylogs", getAllActivityLogs);

// Get all activity logs for a user (with user validation)
router.get("/activitylogs/:userId", getUserActivityLogs);

// Get all activity logs for any user (for testing/debugging)
router.get("/activitylogs/user/:userId", getActivityLogsByUserId);

router.get("/activity/daily-summary", getDailyActivitySummary);

module.exports = router;
