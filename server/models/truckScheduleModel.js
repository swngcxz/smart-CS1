// truckScheduleModel.js
const {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} = require("./firebase");

async function createTruckSchedule(data) {
  return await addDoc(collection(db, "truckSchedules"), data);
}

async function getTruckSchedules(filter = {}) {
  let ref = collection(db, "truckSchedules");

  if (filter.status) {
    ref = query(ref, where("status", "==", filter.status));
  }

  const snapshot = await getDocs(ref);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function updateTruckScheduleStatus(id, status) {
  const ref = doc(db, "truckSchedules", id);
  await updateDoc(ref, { status });
}

async function findTruckScheduleByStaffAndDate(staffId, date) {
  const q = query(
    collection(db, "truckSchedules"),
    where("staffId", "==", staffId),
    where("date", "==", date)
  );

  const snapshot = await getDocs(q);
  return snapshot.empty ? null : {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data()
  };
}

module.exports = {
  createTruckSchedule,
  getTruckSchedules,
  updateTruckScheduleStatus,
  findTruckScheduleByStaffAndDate
};
