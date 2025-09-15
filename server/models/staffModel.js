// models/staffModel.js

const { db, admin } = require("./firebase");

const STAFF_COLLECTION = "janitor";

const StaffModel = {
  // Create a new staff member
  async createStaff(data) {
    const docRef = await db.collection(STAFF_COLLECTION).add(data);
    return docRef.id;
  },

  // Get all staff
  async getAllStaff() {
    const snapshot = await db.collection(STAFF_COLLECTION).get();
    const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('StaffModel.getAllStaff() - Raw data from Firestore:', staff.map(s => ({ id: s.id, fullName: s.fullName, contactNumber: s.contactNumber })));
    return staff;
  },

  // Get all users (to include janitor users)
  async getAllUsers() {
    const snapshot = await db.collection("users").get();
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

  // Seed sample janitor data for testing
  async seedSampleJanitors() {
    const sampleJanitors = [
      {
        fullName: "Janitor Alice",
        email: "alice@smartwaste.com",
        contactNumber: "+63 912 345 6789",
        role: "janitor",
        location: "Central Plaza",
        status: "active",
        lastActivity: "2 hours ago"
      },
      {
        fullName: "Janitor Bob",
        email: "bob@smartwaste.com",
        contactNumber: "+63 912 345 6790",
        role: "janitor",
        location: "Park Avenue",
        status: "active",
        lastActivity: "30 min ago"
      },
      {
        fullName: "Janitor Charlie",
        email: "charlie@smartwaste.com",
        contactNumber: "+63 912 345 6791",
        role: "janitor",
        location: "Mall District",
        status: "active",
        lastActivity: "1 hour ago"
      },
      {
        fullName: "Janitor Daisy",
        email: "daisy@smartwaste.com",
        contactNumber: "+63 912 345 6792",
        role: "janitor",
        location: "Residential Area",
        status: "active",
        lastActivity: "45 min ago"
      },
      {
        fullName: "Janitor Ethan",
        email: "ethan@smartwaste.com",
        contactNumber: "+63 912 345 6793",
        role: "janitor",
        location: "Central Plaza",
        status: "active",
        lastActivity: "15 min ago"
      }
    ];

    for (const janitor of sampleJanitors) {
      await this.createStaff(janitor);
    }
    
    console.log("Sample janitors seeded successfully");
  }
};

module.exports = StaffModel;
