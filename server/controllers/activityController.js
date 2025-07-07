const { db, collection, addDoc, getDocs, query, where,getDoc, doc } = require("../models/firebase");

// Save an activity log
const saveActivityLog = async (req, res, next) => {
  try {
    const { user_id, bin_id, date, time, status } = req.body;

    const data = {
      user_id,
      bin_id,
      date,
      time,
      status
    };

    await addDoc(collection(db, "activitylogs"), data);

    res.status(201).json({ message: "Activity log saved successfully." });
  } catch (err) {
    next(err);
  }
};

const getUserActivityLogs = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // first get user info
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    // then get activity logs
    const logsRef = collection(db, "activitylogs");
    const q = query(logsRef, where("user_id", "==", userId));
    const snapshot = await getDocs(q);

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

    const activityRef = collection(db, "activity_logs");
    const q = query(
      activityRef,
      where("timestamp", ">=", today),
      where("timestamp", "<", tomorrow)
    );

    const snapshot = await getDocs(q);

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
