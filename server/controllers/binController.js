const { db } = require("../models/firebase");
const { shouldSaveBinData } = require("../utils/binLevelHandler");

let alreadySaved85_90 = {};  // in-memory tracking

const saveBinData = async (req, res, next) => {
  try {
    const {
      sensored_id,
      bin_code,
      type,
      location,
      bin_level,
      capacity,
      last_collected,
      status
    } = req.body;

    const action = shouldSaveBinData(bin_level);
    const binData = {
      sensored_id,
      bin_code,
      type,
      location,
      bin_level,
      capacity,
      last_collected,
      status,
      timestamp: new Date()
    };

    if (action === "save_once") {
      if (!alreadySaved85_90[sensored_id]) {
        console.log("Saving bin data to Firestore collection: bins (save_once)");
        await db.collection("bins").add(binData);
        alreadySaved85_90[sensored_id] = true;
        return res.status(200).json({ message: "Saved once for 85–90% bin level" });
      } else {
        return res.status(200).json({ message: "Already saved for 85–90%, skipping" });
      }
    }

    if (action === "save_always") {
      console.log("Saving bin data to Firestore collection: bins (save_always)");
      await db.collection("bins").add(binData);
      alreadySaved85_90[sensored_id] = false; 
      return res.status(200).json({ message: "Saved individually for 91–99% bin level" });
    }

    return res.status(200).json({ message: "Bin level not in monitored range, no save" });

  } catch (err) {
    next(err);
  }
};

const getAllBins = async (req, res, next) => {
  try {
    console.log("Querying all bins from Firestore collection: bins");
    const snapshot = await db.collection("bins").get();

    const bins = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(bins);
  } catch (err) {
    next(err);
  }
};

const assignBinTask = async (req, res, next) => {
  try {
    const { user_id, bin_id, add_info, status, date, time, location } = req.body;

    if (!user_id || !bin_id || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const taskData = {
      user_id,
      bin_id,
      add_info: add_info || "",
      status,
      date,
      time,
      location
    };

    // save the task
    console.log("Saving task assignment to Firestore collection: task_assignments");
    const docRef = await db.collection("task_assignments").add(taskData);

    // create a notification
    const notificationData = {
      user_id,
      message: `New task assigned for bin ${bin_id} at ${location}`,
      task_id: docRef.id,
      createdAt: new Date().toISOString(),
      read: false
    };

    console.log("Saving notification to Firestore collection: notifications");
    await db.collection("notifications").add(notificationData);

    res.status(201).json({
      message: "Task assigned successfully and notification sent",
      id: docRef.id,
      task: taskData
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  saveBinData,
  getAllBins,
  assignBinTask
};