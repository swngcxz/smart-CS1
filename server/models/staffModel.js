// models/staffModel.js

const {
  db,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc
} = require("./firebase");

const STAFF_COLLECTION = "staff";

const StaffModel = {
  // Create a new staff member
  async createStaff(data) {
    const docRef = await addDoc(collection(db, STAFF_COLLECTION), data);
    return docRef.id;
  },

  // Get all staff
  async getAllStaff() {
    const snapshot = await getDocs(collection(db, STAFF_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Update a staff member by ID
  async updateStaff(id, data) {
    const docRef = doc(db, STAFF_COLLECTION, id);
    await updateDoc(docRef, data);
    return true;
  },

  // Delete a staff member by ID
  async deleteStaff(id) {
    const docRef = doc(db, STAFF_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  },

  // Get a staff member by ID
  async getStaffById(id) {
    const staffDocRef = doc(db, STAFF_COLLECTION, id);
    const staffSnapshot = await getDoc(staffDocRef);
    if (staffSnapshot.exists()) {
      return { id: staffSnapshot.id, ...staffSnapshot.data() };
    }
    return null;
  },
};

module.exports = StaffModel;
