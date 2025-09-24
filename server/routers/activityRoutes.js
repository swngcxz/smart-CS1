
const express = require("express");
const router = express.Router();
const { saveActivityLog, saveTaskAssignment, getUserActivityLogs, getDailyActivitySummary, getAllActivityLogs, getActivityLogsByUserId, getAssignedActivityLogs, updateActivityStatus, updateActivityLog, deleteActivityLog, getLoginHistory, testJanitorNotification } = require("../controllers/activityController");

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

// Get login history logs
router.get("/login-history", getLoginHistory);

// Update activity status
router.put("/activitylogs/:activityId/status", updateActivityStatus);

// Update activity log with completion details
router.put("/activitylogs/:activityId", updateActivityLog);

// Delete activity log
router.delete("/activitylogs/:activityId", deleteActivityLog);

// Test janitor notification endpoint
router.post("/test-notification", testJanitorNotification);

module.exports = router;
