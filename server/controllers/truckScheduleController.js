// truckScheduleController.js

const {
  createTruckSchedule,
  getTruckSchedules,
  updateTruckScheduleStatus,
  findTruckScheduleByStaffAndDate
} = require("../models/truckScheduleModel");

const StaffModel= require("../models/staffModel");
const { db } = require("../models/firebase");
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
    
    console.log('Saving truck schedule data to Firebase:', data);

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

async function updateFullTruckSchedule(req, res) {
  const { id } = req.params;
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

  if (!id) {
    return res.status(400).json({ error: "Truck schedule ID is required" });
  }

  try {
    // Check if truck schedule exists
    const scheduleRef = db.collection("truckSchedules").doc(id);
    const scheduleDoc = await scheduleRef.get();
    
    if (!scheduleDoc.exists) {
      return res.status(404).json({ error: "Truck schedule not found" });
    }

    // Validate that the date is not in the past (if date is being updated)
    if (date) {
      const scheduleDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (scheduleDate < today) {
        return res.status(400).json({ 
          error: "Cannot update schedule to past dates. Please select today or a future date." 
        });
      }
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Only update fields that are provided
    if (staffId !== undefined) updateData.staffId = staffId;
    if (sched_type !== undefined) updateData.sched_type = sched_type;
    if (start_collected !== undefined) updateData.start_collected = start_collected;
    if (end_collected !== undefined) updateData.end_collected = end_collected;
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;
    if (date !== undefined) updateData.date = date;
    if (priority !== undefined) updateData.priority = priority;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (notes !== undefined) updateData.notes = notes;
    if (truckPlate !== undefined) updateData.truckPlate = truckPlate;

    // Update the truck schedule
    await scheduleRef.update(updateData);

    console.log(`Truck schedule ${id} updated successfully`);
    return res.status(200).json({ 
      message: "Truck schedule updated successfully",
      scheduleId: id,
      updatedData: updateData
    });

  } catch (err) {
    console.error("Error updating truck schedule:", err);
    return res.status(500).json({ error: err.message });
  }
}

async function deleteTruckSchedule(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Truck schedule ID is required" });
  }

  try {
    // Check if truck schedule exists
    const scheduleRef = db.collection("truckSchedules").doc(id);
    const scheduleDoc = await scheduleRef.get();
    
    if (!scheduleDoc.exists) {
      return res.status(404).json({ error: "Truck schedule not found" });
    }

    // Delete the truck schedule
    await scheduleRef.delete();

    console.log(`Truck schedule ${id} deleted successfully`);
    return res.status(200).json({ 
      message: "Truck schedule deleted successfully",
      scheduleId: id
    });

  } catch (err) {
    console.error("Error deleting truck schedule:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createNewTruckSchedule,
  getAllTruckSchedules,
  updateTruckSchedule,
  updateFullTruckSchedule,
  deleteTruckSchedule
};
