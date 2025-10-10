const { db } = require("./firebase");

async function createTruckSchedule(data) {
  return await db.collection("truckSchedules").add(data);
}

async function getTruckSchedules(filter = {}) {
  let ref = db.collection("truckSchedules");
  if (filter.status) {
    ref = ref.where("status", "==", filter.status);
  }
  const snapshot = await ref.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function updateTruckScheduleStatus(id, status) {
  await db.collection("truckSchedules").doc(id).update({ 
    status,
    updatedAt: new Date().toISOString()
  });
}

async function findTruckScheduleByStaffAndDate(staffId, date) {
  const snapshot = await db.collection("truckSchedules")
    .where("staffId", "==", staffId)
    .where("date", "==", date)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

module.exports = {
  createTruckSchedule,
  getTruckSchedules,
  updateTruckScheduleStatus,
  findTruckScheduleByStaffAndDate
};
