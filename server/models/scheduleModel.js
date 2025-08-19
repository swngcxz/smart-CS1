const { db } = require("./firebase");

// CREATE
async function createSchedule(data) {
  return await db.collection("schedules").add(data);
}

// READ ALL with optional filter
async function getSchedules(filter = {}) {
  let ref = db.collection("schedules");
  if (filter.status) {
    ref = ref.where("status", "==", filter.status);
  }
  const snapshot = await ref.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// UPDATE
async function updateScheduleStatus(id, status) {
  await db.collection("schedules").doc(id).update({ status });
}

async function findScheduleByStaffAndDate(staffId, date) {
  const snapshot = await db.collection("schedules")
    .where("staffId", "==", staffId)
    .where("date", "==", date)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

module.exports = {
  createSchedule,
  getSchedules,
  updateScheduleStatus,
  findScheduleByStaffAndDate, 
};
