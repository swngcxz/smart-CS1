const { db } = require("../models/firebase");

async function migrateScheduleData() {
  console.log("🔄 Starting schedule data migration...");
  
  try {
    // Update truck schedules
    console.log("📦 Updating truck schedules...");
    const truckSchedulesSnapshot = await db.collection("truckSchedules").get();
    
    for (const doc of truckSchedulesSnapshot.docs) {
      const data = doc.data();
      const updates = {};
      
      // Add missing fields with default values
      if (!data.priority) updates.priority = "Normal";
      if (!data.contactPerson) updates.contactPerson = "Not specified";
      if (!data.notes) updates.notes = "No additional notes";
      if (!data.truckPlate) updates.truckPlate = "Not assigned";
      
      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        console.log(`✅ Updated truck schedule ${doc.id}:`, updates);
      }
    }
    
    // Update regular schedules
    console.log("📋 Updating regular schedules...");
    const schedulesSnapshot = await db.collection("schedules").get();
    
    for (const doc of schedulesSnapshot.docs) {
      const data = doc.data();
      const updates = {};
      
      // Add missing fields with default values
      if (!data.priority) updates.priority = "Normal";
      if (!data.contactPerson) updates.contactPerson = "Not specified";
      if (!data.notes) updates.notes = "No additional notes";
      
      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        console.log(`✅ Updated schedule ${doc.id}:`, updates);
      }
    }
    
    console.log("🎉 Schedule data migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during migration:", error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateScheduleData().then(() => {
    console.log("Migration finished. Exiting...");
    process.exit(0);
  });
}

module.exports = { migrateScheduleData };
