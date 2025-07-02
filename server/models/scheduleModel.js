const { db, collection, addDoc, getDocs, query, where, updateDoc, doc } = require("./firebase");

// CREATE
async function createSchedule(data) {
  return await addDoc(collection(db, "schedules"), data);
}

// READ ALL with optional filter
async function getSchedules(filter = {}) {
  let q = collection(db, "schedules");

  if (filter.status) {
    q = query(q, where("status", "==", filter.status));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// UPDATE
async function updateScheduleStatus(id, status) {
  const ref = doc(db, "schedules", id);
  await updateDoc(ref, { status });
}


async function findScheduleByStaffAndDate(staffId, sched_type) {
  const q = query(
    collection(db, "schedules"),
    where("staffId", "==", staffId),
    where("sched_type", "==", sched_type)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// export everything
module.exports = {
  createSchedule,
  getSchedules,
  updateScheduleStatus,
  findScheduleByStaffAndDate, // ✅ export it
};
