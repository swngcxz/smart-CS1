const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const { createNewSchedule, getAllSchedules, updateSchedule } = require("../controllers/scheduleController");

// route definitions
router.post("/", authMiddleware, createNewSchedule);
router.get("/", authMiddleware, getAllSchedules);
router.patch("/:id", authMiddleware, updateSchedule);

module.exports = router;
