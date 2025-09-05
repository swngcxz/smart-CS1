
const express = require("express");
const router = express.Router();
const { saveActivityLog, saveTaskAssignment, getUserActivityLogs, getDailyActivitySummary, getAllActivityLogs, getActivityLogsByUserId, getAssignedActivityLogs } = require("../controllers/activityController");

// Get all activity logs assigned to a janitor
router.get("/activitylogs/assigned/:janitorId", getAssignedActivityLogs);

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
