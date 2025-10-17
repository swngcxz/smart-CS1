const express = require("express");
const router = express.Router();
const { createNewSchedule, getAllSchedules, updateSchedule, updateFullSchedule, deleteSchedule } = require("../controllers/scheduleController");

// route definitions
router.post("/", createNewSchedule);
router.get("/", getAllSchedules);
router.patch("/:id", updateSchedule);
router.put("/:id", updateFullSchedule);
router.delete("/:id", deleteSchedule);

module.exports = router;
