const { db } = require("../models/firebase");

// Save an activity log
const saveActivityLog = async (req, res, next) => {
  try {
    const { 
      user_id, 
      bin_id, 
      bin_location, 
      bin_status, 
      bin_level, 
      assigned_janitor_id, 
      assigned_janitor_name, 
      task_note, 
      activity_type,
      timestamp 
    } = req.body;

    const data = {
      user_id,
      bin_id,
      bin_location,
      bin_status,
      bin_level,
      assigned_janitor_id,
      assigned_janitor_name,
      task_note,
      activity_type: activity_type || 'task_assignment',
      timestamp: timestamp || new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0]
    };

    console.log("Saving activity log to Firestore collection: activitylogs", data);
    await db.collection("activitylogs").add(data);

    res.status(201).json({ message: "Activity log saved successfully." });
  } catch (err) {
    next(err);
  }
};

const getUserActivityLogs = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // first get user info
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    // then get activity logs
    console.log("Querying activitylogs for user_id:", userId);
    const snapshot = await db.collection("activitylogs").where("user_id", "==", userId).get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      user: {
        id: userId,
        name: userData.fullName    // use correct field
      },
      activities: logs
    });

  } catch (err) {
    next(err);
  }
};

const getDailyActivitySummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0); // midnight start
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("Querying activitylogs for today's summary");
    const snapshot = await db.collection("activitylogs")
      .where("timestamp", ">=", today)
      .where("timestamp", "<", tomorrow)
      .get();

    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // categorize
    const summary = {
      shifts: [],
      task: [],
      onboarding: [],
      reports: [],
      update: []
    };

    activities.forEach(act => {
      if (summary[act.type]) {
        summary[act.type].push(act);
      }
    });

    res.status(200).json({
      date: today.toISOString().slice(0,10),
      summary
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  saveActivityLog,
  getUserActivityLogs,
  getDailyActivitySummary
};
