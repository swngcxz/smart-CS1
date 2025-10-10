const express = require("express");
const router = express.Router();
const { createNewSchedule, getAllSchedules, updateSchedule } = require("../controllers/scheduleController");

// route definitions
router.post("/", createNewSchedule);
router.get("/", getAllSchedules);
router.patch("/:id", updateSchedule);

module.exports = router;
