const { db } = require("../models/firebase");

// get collection counts (weekly, daily, monthly, yearly)
const getCollectionCounts = async (req, res, next) => {
  try {
    const snapshot = await db.collection("bins").get();

    const now = new Date();
    let todayCount = 0, weekCount = 0, monthCount = 0, yearCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const collected = new Date(data.last_collected);

      if (isSameDay(collected, now)) todayCount++;
      if (isSameWeek(collected, now)) weekCount++;
      if (isSameMonth(collected, now)) monthCount++;
      if (isSameYear(collected, now)) yearCount++;
    });

    res.status(200).json({
      daily: todayCount,
      weekly: weekCount,
      monthly: monthCount,
      yearly: yearCount
    });
  } catch (err) {
    next(err);
  }
};

// calculate average fill level
const getAverageFillLevel = async (req, res, next) => {
  try {
    const snapshot = await db.collection("bins").get();

    let totalFill = 0;
    let count = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      totalFill += data.bin_level || 0;
      count++;
    });

    const avg = count > 0 ? totalFill / count : 0;
    res.status(200).json({ averageFillLevel: avg });
  } catch (err) {
    next(err);
  }
};

// identify critical bins
const getCriticalBins = async (req, res, next) => {
  try {
    const snapshot = await db.collection("bins").where("bin_level", ">=", 95).get();

    const critical = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(critical);
  } catch (err) {
    next(err);
  }
};

// dummy route efficiency example
const getRouteEfficiency = async (req, res, next) => {
  try {
    // simplistic version:
    // count how many bins >90% are in the same location
    const snapshot = await db.collection("bins").where("bin_level", ">", 90).get();

    const grouped = {};
    snapshot.forEach(doc => {
      const bin = doc.data();
      const location = bin.location;
      if (!grouped[location]) grouped[location] = [];
      grouped[location].push(bin);
    });

    res.status(200).json({ routeEfficiency: grouped });
  } catch (err) {
    next(err);
  }
};

// helpers
function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isSameWeek(d1, d2) {
  const oneJan = new Date(d2.getFullYear(),0,1);
  const week1 = Math.ceil((((d1 - oneJan) / 86400000) + oneJan.getDay()+1)/7);
  const week2 = Math.ceil((((d2 - oneJan) / 86400000) + oneJan.getDay()+1)/7);
  return week1 === week2 && d1.getFullYear() === d2.getFullYear();
}

function isSameMonth(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth()
  );
}

function isSameYear(d1, d2) {
  return d1.getFullYear() === d2.getFullYear();
}

module.exports = {
  getCollectionCounts,
  getAverageFillLevel,
  getCriticalBins,
  getRouteEfficiency
};
