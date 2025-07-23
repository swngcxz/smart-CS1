// models/staffModel.js

const { db, admin } = require("./firebase");

const STAFF_COLLECTION = "staff";

const StaffModel = {
  // Create a new staff member
  async createStaff(data) {
    const docRef = await db.collection(STAFF_COLLECTION).add(data);
    return docRef.id;
  },

  // Get all staff
  async getAllStaff() {
    const snapshot = await db.collection(STAFF_COLLECTION).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Update a staff member by ID
  async updateStaff(id, data) {
    await db.collection(STAFF_COLLECTION).doc(id).update(data);
    return true;
  },

  // Delete a staff member by ID
  async deleteStaff(id) {
    await db.collection(STAFF_COLLECTION).doc(id).delete();
    return true;
  },

  // Get a staff member by ID
  async getStaffById(id) {
    const staffDoc = await db.collection(STAFF_COLLECTION).doc(id).get();
    if (staffDoc.exists) {
      return { id: staffDoc.id, ...staffDoc.data() };
    }
    return null;
  },
};

module.exports = StaffModel;
