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

  // Seed sample janitor data for testing
  async seedSampleJanitors() {
    const sampleJanitors = [
      {
        fullName: "Janitor Alice",
        email: "alice@smartwaste.com",
        role: "janitor",
        location: "Central Plaza",
        status: "active",
        lastActivity: "2 hours ago"
      },
      {
        fullName: "Janitor Bob",
        email: "bob@smartwaste.com",
        role: "janitor",
        location: "Park Avenue",
        status: "active",
        lastActivity: "30 min ago"
      },
      {
        fullName: "Janitor Charlie",
        email: "charlie@smartwaste.com",
        role: "janitor",
        location: "Mall District",
        status: "active",
        lastActivity: "1 hour ago"
      },
      {
        fullName: "Janitor Daisy",
        email: "daisy@smartwaste.com",
        role: "janitor",
        location: "Residential Area",
        status: "active",
        lastActivity: "45 min ago"
      },
      {
        fullName: "Janitor Ethan",
        email: "ethan@smartwaste.com",
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
