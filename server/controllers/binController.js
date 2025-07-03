const { saveData, db, collection, query, where, getDocs, addDoc} = require("../models/firebase");
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

    if (action === "save_once") {
      if (!alreadySaved85_90[sensored_id]) {
        await saveData("bins", {
          sensored_id,
          bin_code,
          type,
          location,
          bin_level,
          capacity,
          last_collected,
          status,
          timestamp: new Date()
        });
        alreadySaved85_90[sensored_id] = true;
        return res.status(200).json({ message: "Saved once for 85–90% bin level" });
      } else {
        return res.status(200).json({ message: "Already saved for 85–90%, skipping" });
      }
    }

    if (action === "save_always") {
      await saveData("bins", {
        sensored_id,
        bin_code,
        type,
        location,
        bin_level,
        capacity,
        last_collected,
        status,
        timestamp: new Date()
      });
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
    const binsRef = collection(db, "bins");
    const snapshot = await getDocs(binsRef);

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
    const docRef = await addDoc(collection(db, "task_assignments"), taskData);

    // create a notification
    const notificationData = {
      user_id,
      message: `New task assigned for bin ${bin_id} at ${location}`,
      task_id: docRef.id,
      createdAt: new Date().toISOString(),
      read: false
    };

    await addDoc(collection(db, "notifications"), notificationData);

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