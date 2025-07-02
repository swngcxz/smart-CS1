const express = require("express");
const router = express.Router();
const {
  createNewTruckSchedule,
  getAllTruckSchedules,
  updateTruckSchedule,
} = require("../controllers/truckScheduleController");

router.post("/", createNewTruckSchedule);
router.get("/", getAllTruckSchedules);
router.put("/:id", updateTruckSchedule);

module.exports = router;
