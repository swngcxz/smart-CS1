const {
  createSchedule,
  getSchedules,
  updateScheduleStatus,
  findScheduleByStaffAndDate
} = require("../models/scheduleModel");

const { validateSchedule } = require("../utils/validateSchedule");

async function createNewSchedule(req, res) {
  const error = validateSchedule(req.body);
  if (error) return res.status(400).json({ error });

  const lunchStart = req.body.lunch_break_start || "12:00";
  const lunchEnd = req.body.lunch_break_end || "13:00";

  const start = new Date(`1970-01-01T${req.body.start_time}:00Z`);
  const end = new Date(`1970-01-01T${req.body.end_time}:00Z`);
  const lunchStartDate = new Date(`1970-01-01T${lunchStart}:00Z`);
  const lunchEndDate = new Date(`1970-01-01T${lunchEnd}:00Z`);

  if (
    (start >= lunchStartDate && start < lunchEndDate) ||
    (end > lunchStartDate && end <= lunchEndDate)
  ) {
    return res.status(400).json({
      error: `Schedule cannot overlap lunch break (${lunchStart}–${lunchEnd})`
    });
  }

  try {
    
    const existing = await findScheduleByStaffAndDate(req.body.staffId, req.body.sched_type);
    if (existing && existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Staff already has a schedule for this type." });
    }

    const data = {
      staffId: req.body.staffId,
      sched_type: req.body.sched_type,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      lunch_break: {
        start: lunchStart,
        end: lunchEnd
      },
      location: req.body.location,
      status: req.body.status,
      createdAt: new Date().toISOString()
    };

    const docRef = await createSchedule(data);
    return res.status(201).json({ message: "Schedule created", id: docRef.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function getAllSchedules(req, res) {
  try {
    const data = await getSchedules();
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function updateSchedule(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: "Status is required" });

  try {
    await updateScheduleStatus(id, status);
    return res.json({ message: "Schedule updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createNewSchedule,
  getAllSchedules,
  updateSchedule,
};
