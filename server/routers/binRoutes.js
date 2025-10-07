const express = require("express");
const { saveBinData, getAllBins, assignBinTask, updateBinDetails  } = require("../controllers/binController");
const { getBinCollectionSummary } = require("../controllers/getBinCollectionSummary");
const { admin } = require("../models/firebase");
const router = express.Router();

router.post("/bins", saveBinData);
router.get("/bins", getAllBins);
router.put("/bins/:binId", updateBinDetails);
// Note: /assign-task moved to main index.js to avoid route conflicts

router.get("/collection-summary", getBinCollectionSummary);

// Test route to verify binRoutes is working
router.get("/test", (req, res) => {
  console.log('[BIN ROUTES] Test route called');
  res.json({ message: 'BinRoutes is working!', timestamp: new Date().toISOString() });
});

// Add caching for better performance
let cachedBinData = null;
let lastCacheTime = 0;
const CACHE_DURATION = 2000; // 2 seconds cache

// Add bin1 endpoint to handle real-time data - OPTIMIZED with caching
router.get("/bin1", async (req, res) => {
  console.log('[BIN ROUTES] /bin1 endpoint called');
  try {
    // Serve cached data if recent (within 2 seconds)
    if (cachedBinData && (Date.now() - lastCacheTime) < CACHE_DURATION) {
      console.log('[BIN ROUTES] Serving cached data');
      return res.json(cachedBinData);
    }
    
    const db = admin.database();
    const bin1Ref = db.ref('monitoring/bin1');
    
    // Add timeout to prevent hanging requests
    const snapshot = await Promise.race([
      bin1Ref.once('value'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase timeout')), 2000)
      )
    ]);
    const data = snapshot.val();
    
    console.log('[BIN ROUTES] Raw data from Firebase:', data);
    
    if (!data) {
      console.log('[BIN ROUTES] No data found in monitoring/bin1');
      return res.status(404).json({ success: false, message: "Bin not found" });
    }
    
    // Ensure coordinates are properly formatted
    const formattedData = {
      ...data,
      latitude: parseFloat(data?.latitude) || 0,
      longitude: parseFloat(data?.longitude) || 0,
      gps_valid: Boolean(data?.gps_valid),
      satellites: parseInt(data?.satellites) || 0,
      bin_level: parseFloat(data?.bin_level) || 0,
      weight_percent: parseFloat(data?.weight_percent) || 0,
      height_percent: parseFloat(data?.height_percent) || 0,
      timestamp: data?.timestamp || Date.now()
    };
    
    // Cache the response for faster subsequent requests
    cachedBinData = formattedData;
    lastCacheTime = Date.now();
    
    console.log(`[BIN ROUTES] Serving bin1 data with coordinates: ${formattedData.latitude}, ${formattedData.longitude}`);
    res.json(formattedData);
  } catch (err) {
    console.error('[BIN ROUTES] Error fetching bin1 data:', err);
    
    // Serve stale cache if available during errors
    if (cachedBinData) {
      console.log('[BIN ROUTES] Serving stale cached data due to error');
      return res.json(cachedBinData);
    }
    
    res.status(500).json({ error: 'Failed to fetch bin1 data', details: err.message });
  }
});

module.exports = router;
