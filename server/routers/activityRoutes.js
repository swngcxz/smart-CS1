const express = require("express");
const { saveActivityLog, saveTaskAssignment, getUserActivityLogs,getDailyActivitySummary  } = require("../controllers/activityController");

const router = express.Router();

// Save a new activity log
router.post("/activitylogs", saveActivityLog);

// Save a task assignment
router.post("/task-assignments", saveTaskAssignment);

// Get all activity logs for a user
router.get("/activitylogs/:userId", getUserActivityLogs);


router.get("/activity/daily-summary", getDailyActivitySummary);

module.exports = router;
