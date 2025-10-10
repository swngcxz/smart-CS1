// truckScheduleController.js

const {
  createTruckSchedule,
  getTruckSchedules,
  updateTruckScheduleStatus,
  findTruckScheduleByStaffAndDate
} = require("../models/truckScheduleModel");

const StaffModel= require("../models/staffModel");
async function createNewTruckSchedule(req, res) {
  console.log('🚛 Creating new truck schedule with data:', req.body);
  const {
    staffId,
    sched_type,
    start_collected,
    end_collected,
    location,
    status,
    date,
    priority,
    contactPerson,
    notes,
    truckPlate
  } = req.body;

  if (!staffId || !sched_type || !start_collected || !end_collected || !location || !status || !date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate that the date is not in the past
  const scheduleDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
  
  if (scheduleDate < today) {
    return res.status(400).json({ 
      error: "Cannot create schedule for past dates. Please select today or a future date." 
    });
  }

  try {
    // verify staff exists
    const staff = await StaffModel.getStaffById(staffId);
    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }

    const normalizedRole = String(staff.role || '').toLowerCase();
    if (normalizedRole !== "driver" && normalizedRole !== "janitor") {
      return res.status(400).json({ error: "Staff must have role 'driver' (or 'janitor') to be scheduled" });
    }

    // check if already has schedule on same date
    const existing = await findTruckScheduleByStaffAndDate(staffId, date);
    if (existing && existing.length > 0) {
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
      priority: priority || "Normal",
      contactPerson: contactPerson || "Not specified",
      notes: notes || "No additional notes",
      truckPlate: truckPlate || "Not assigned",
      createdAt: new Date().toISOString()
    };
    
    console.log('💾 Saving truck schedule data to Firebase:', data);

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
