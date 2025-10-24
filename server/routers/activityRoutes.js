
const express = require("express");
const router = express.Router();
const { saveActivityLog, saveTaskAssignment, getUserActivityLogs, getDailyActivitySummary, getAllActivityLogs, getActivityLogsByUserId, getActivityLogsByBinId, getAssignedActivityLogs, updateActivityStatus, updateActivityLog, deleteActivityLog, clearAllActivityLogs, assignTaskAtomically, getActivityStatsSimple, getLoginHistory, testJanitorNotification, testNotification } = require("../controllers/activityController");

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

// Get activity logs by bin ID
router.get("/activity-logs/bin/:binId", getActivityLogsByBinId);

router.get("/activity/daily-summary", getDailyActivitySummary);

// Get login history logs
router.get("/login-history", getLoginHistory);

// Get activity statistics (simple version)
router.get("/activity-stats-simple", getActivityStatsSimple);

// Update activity status
router.put("/activitylogs/:activityId/status", updateActivityStatus);

// Update activity log with completion details
router.put("/activitylogs/:activityId", updateActivityLog);

// Atomic task assignment (prevents conflicts)
router.put("/activitylogs/:activityId/assign", assignTaskAtomically);

// Delete activity log
router.delete("/activitylogs/:activityId", deleteActivityLog);

// Clear all activity logs
router.delete("/activity-logs/clear-all", clearAllActivityLogs);

// Test janitor notification endpoint
router.post("/test-notification", testJanitorNotification);

// Test notification system endpoint
router.post("/test-notification-system", testNotification);

module.exports = router;
