const { db } = require("../models/firebase");
const CacheManager = require("../utils/cacheManager");

const getBinCollectionSummary = async (req, res, next) => {
  try {
    // Check cache first to reduce Firebase reads
    const cacheKey = 'bin_collection_summary';
    const cached = CacheManager.get(cacheKey);
    
    if (cached) {
      console.log("Using cached bin collection summary");
      return res.status(200).json(cached);
    }
    
    console.log("Querying all bins from Firestore collection: bins");
    const snapshot = await db.collection("bins").get();

    const bins = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 1. Aggregate by station/area
    const stationSummary = {}; 

    bins.forEach(bin => {
      const station = bin.location || "Unknown";  // you can change this to bin.station if you have it
      const binLevelCollected = bin.bin_level || 0;

      if (!stationSummary[station]) {
        stationSummary[station] = {
          totalCollected: 0,
          bins: []
        };
      }

      stationSummary[station].totalCollected += binLevelCollected;
      stationSummary[station].bins.push({
        id: bin.id,
        bin_level: bin.bin_level,
        status: bin.status,
        last_collected: bin.last_collected,
        capacity: bin.capacity
      });
    });

    // 2. Maintenance alerts
    const maintenanceAlerts = bins.filter(bin => 
      bin.status === "damaged" || bin.status === "needs_maintenance"
    ).map(bin => ({
      id: bin.id,
      location: bin.location,
      message: `Bin at ${bin.location} needs maintenance (${bin.status})`
    }));

    const routePriorities = bins.filter(bin => bin.bin_level >= 90)
      .map(bin => ({
        id: bin.id,
        location: bin.location,
        bin_level: bin.bin_level
      }));

    const result = {
      summaryByStation: stationSummary,
      maintenanceAlerts,
      routePriorities
    };
    
    // Cache the result for 1 minute
    CacheManager.setBinData(cacheKey, result, 60);
    
    res.status(200).json(result);

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBinCollectionSummary
};
