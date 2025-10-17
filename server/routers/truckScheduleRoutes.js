const express = require("express");
const router = express.Router();
const {
  createNewTruckSchedule,
  getAllTruckSchedules,
  updateTruckSchedule,
  updateFullTruckSchedule,
  deleteTruckSchedule,
} = require("../controllers/truckScheduleController");

router.post("/", createNewTruckSchedule);
router.get("/", getAllTruckSchedules);
router.patch("/:id", updateTruckSchedule);
router.put("/:id", updateFullTruckSchedule);
router.delete("/:id", deleteTruckSchedule);

module.exports = router;
