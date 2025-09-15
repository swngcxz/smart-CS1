const express = require("express");
const { saveBinData, getAllBins, assignBinTask  } = require("../controllers/binController");
const { getBinCollectionSummary } = require("../controllers/getBinCollectionSummary");
const { admin } = require("../models/firebase");
const router = express.Router();

router.post("/bins", saveBinData);
router.get("/bins", getAllBins);
router.post("/assign-task", assignBinTask);

router.get("/collection-summary", getBinCollectionSummary);

// Test route to verify binRoutes is working
router.get("/test", (req, res) => {
  console.log('[BIN ROUTES] Test route called');
  res.json({ message: 'BinRoutes is working!', timestamp: new Date().toISOString() });
});

// Add bin1 endpoint to handle real-time data
router.get("/bin1", async (req, res) => {
  console.log('[BIN ROUTES] /bin1 endpoint called');
  try {
    const db = admin.database();
    const bin1Ref = db.ref('monitoring/bin1');
    const snapshot = await bin1Ref.once('value');
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
    
    console.log(`[BIN ROUTES] Serving bin1 data with coordinates: ${formattedData.latitude}, ${formattedData.longitude}`);
    res.json(formattedData);
  } catch (err) {
    console.error('[BIN ROUTES] Error fetching bin1 data:', err);
    res.status(500).json({ error: 'Failed to fetch bin1 data', details: err.message });
  }
});

module.exports = router;
