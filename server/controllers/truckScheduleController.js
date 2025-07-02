// truckScheduleController.js

const {
  createTruckSchedule,
  getTruckSchedules,
  updateTruckScheduleStatus,
  findTruckScheduleByStaffAndDate
} = require("../models/truckScheduleModel");

const StaffModel= require("../models/staffModel");
async function createNewTruckSchedule(req, res) {
  const {
    staffId,
    sched_type,
    start_collected,
    end_collected,
    location,
    status,
    date
  } = req.body;

  if (!staffId || !sched_type || !start_collected || !end_collected || !location || !status || !date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // verify staff exists
    const staff = await StaffModel.getStaffById(staffId);
    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }

    if (staff.role !== "Driver") {
      return res.status(400).json({ error: "Staff must have role 'driver' to be scheduled for truck collection" });
    }

    // check if already has schedule on same date
    const existing = await findTruckScheduleByStaffAndDate(staffId, date);
    if (existing) {
      return res.status(400).json({ error: "Schedule for this driver already exists on that date" });
    }

    const data = {
      staffId,
      sched_type,
      start_collected,
      end_collected,
      location,
      status,
      date,
      createdAt: new Date().toISOString()
    };

    const docRef = await createTruckSchedule(data);
    return res.status(201).json({ message: "Truck schedule created", id: docRef.id });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function getAllTruckSchedules(req, res) {
  try {
    const data = await getTruckSchedules();
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function updateTruckSchedule(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  try {
    await updateTruckScheduleStatus(id, status);
    return res.json({ message: "Truck schedule updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createNewTruckSchedule,
  getAllTruckSchedules,
  updateTruckSchedule
};
