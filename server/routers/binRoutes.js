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

// Add bin1 endpoint to handle real-time data - OPTIMIZED with caching and fallback
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
    const backupRef = db.ref('monitoring/backup/bin1');
    
    // Fetch both main data and backup coordinates
    const [binSnapshot, backupSnapshot] = await Promise.all([
      Promise.race([
        bin1Ref.once('value'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase timeout')), 2000)
        )
      ]),
      Promise.race([
        backupRef.once('value'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase timeout')), 2000)
        )
      ])
    ]);
    
    const data = binSnapshot.val();
    const backupData = backupSnapshot.val();
    
    console.log('[BIN ROUTES] Raw data from Firebase:', data);
    console.log('[BIN ROUTES] Backup data from Firebase:', backupData);
    
    if (!data) {
      console.log('[BIN ROUTES] No data found in monitoring/bin1');
      return res.status(404).json({ success: false, message: "Bin not found" });
    }
    
          // Check if GPS coordinates are in the correct region (Cebu area)
          const latitude = parseFloat(data?.latitude) || 0;
          const longitude = parseFloat(data?.longitude) || 0;
          const isInCorrectRegion = latitude >= 10.0 && latitude <= 10.5 && 
                                    longitude >= 123.5 && longitude <= 124.0;
          
          // GPS is only valid if it's marked as valid AND in the correct region
          const gpsValid = Boolean(data?.gps_valid) && isInCorrectRegion;
          
          // Ensure coordinates are properly formatted and include backup coordinates
          const formattedData = {
            ...data,
            latitude: latitude,
            longitude: longitude,
            gps_valid: gpsValid,
            satellites: parseInt(data?.satellites) || 0,
            bin_level: parseFloat(data?.bin_level) || 0,
            weight_percent: parseFloat(data?.weight_percent) || 0,
            height_percent: parseFloat(data?.height_percent) || 0,
            timestamp: data?.timestamp || Date.now(),
            // Include backup coordinates if available
            backup_latitude: backupData ? parseFloat(backupData?.backup_latitude) : null,
            backup_longitude: backupData ? parseFloat(backupData?.backup_longitude) : null,
            backup_timestamp: backupData?.backup_timestamp || null
          };
    
    // Cache the response for faster subsequent requests
    cachedBinData = formattedData;
    lastCacheTime = Date.now();
    
    console.log(`[BIN ROUTES] Serving bin1 data with coordinates: ${formattedData.latitude}, ${formattedData.longitude}`);
    console.log(`[BIN ROUTES] Backup coordinates: ${formattedData.backup_latitude}, ${formattedData.backup_longitude}`);
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

// Add endpoint to get all bins from monitoring
router.get("/all", async (req, res) => {
  // console.log('[BIN ROUTES] /all endpoint called'); // Reduced logging - polls frequently
  try {
    const db = admin.database();
    const monitoringRef = db.ref('monitoring');
    
    // Get all bins under monitoring
    const snapshot = await Promise.race([
      monitoringRef.once('value'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase timeout')), 3000)
      )
    ]);
    
    const allData = snapshot.val();
    // console.log('[BIN ROUTES] All monitoring data:', allData); // Reduced logging - polls frequently
    
    if (!allData) {
      console.log('[BIN ROUTES] No data found in monitoring');
      return res.status(404).json({ success: false, message: "No bins found" });
    }
    
    // Process each bin
    const bins = [];
    Object.keys(allData).forEach(binKey => {
      const binData = allData[binKey];
      if (binData && typeof binData === 'object') {
        const formattedData = {
          binId: binKey,
          ...binData,
          latitude: parseFloat(binData?.latitude) || 0,
          longitude: parseFloat(binData?.longitude) || 0,
          gps_valid: Boolean(binData?.gps_valid),
          satellites: parseInt(binData?.satellites) || 0,
          bin_level: parseFloat(binData?.bin_level) || 0,
          weight_percent: parseFloat(binData?.weight_percent) || 0,
          height_percent: parseFloat(binData?.height_percent) || 0,
          timestamp: binData?.timestamp || Date.now()
        };
        bins.push(formattedData);
      }
    });
    
    // console.log(`[BIN ROUTES] Found ${bins.length} bins:`, bins.map(b => b.binId)); // Reduced logging - polls frequently
    res.json({ success: true, bins });
    
  } catch (err) {
    console.error('[BIN ROUTES] Error fetching all bins:', err);
    res.status(500).json({ error: 'Failed to fetch bins', details: err.message });
  }
});

// Add bin2 endpoint to handle real-time data
router.get("/bin2", async (req, res) => {
  console.log('[BIN ROUTES] /bin2 endpoint called');
  try {
    const db = admin.database();
    const bin2Ref = db.ref('monitoring/bin2');
    
    // Add timeout to prevent hanging requests
    const snapshot = await Promise.race([
      bin2Ref.once('value'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase timeout')), 2000)
      )
    ]);
    const data = snapshot.val();
    
    console.log('[BIN ROUTES] Raw bin2 data from Firebase:', data);
    
    if (!data) {
      console.log('[BIN ROUTES] No data found in monitoring/bin2');
      return res.status(404).json({ success: false, message: "Bin2 not found" });
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
    
    console.log(`[BIN ROUTES] Serving bin2 data with coordinates: ${formattedData.latitude}, ${formattedData.longitude}`);
    res.json(formattedData);
  } catch (err) {
    console.error('[BIN ROUTES] Error fetching bin2 data:', err);
    res.status(500).json({ error: 'Failed to fetch bin2 data', details: err.message });
  }
});

// Simple endpoint to check what bins exist in monitoring
router.get("/check", async (req, res) => {
  console.log('[BIN ROUTES] /check endpoint called - checking available bins');
  try {
    const db = admin.database();
    const monitoringRef = db.ref('monitoring');
    
    // Get all bins under monitoring
    const snapshot = await Promise.race([
      monitoringRef.once('value'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase timeout')), 3000)
      )
    ]);
    
    const allData = snapshot.val();
    console.log('[BIN ROUTES] Raw monitoring data structure:', allData);
    
    if (!allData) {
      console.log('[BIN ROUTES] No data found in monitoring');
      return res.json({ 
        success: true, 
        message: "No bins found in monitoring",
        bins: [],
        structure: null
      });
    }
    
    // Get the keys (bin names) from monitoring
    const binKeys = Object.keys(allData);
    console.log(`[BIN ROUTES] Found ${binKeys.length} bins in monitoring:`, binKeys);
    
    // Check if each bin has data
    const binStatus = {};
    binKeys.forEach(binKey => {
      const binData = allData[binKey];
      binStatus[binKey] = {
        exists: !!binData,
        hasData: binData && typeof binData === 'object' && Object.keys(binData).length > 0,
        dataKeys: binData ? Object.keys(binData) : [],
        sampleData: binData ? {
          bin_level: binData.bin_level,
          latitude: binData.latitude,
          longitude: binData.longitude,
          timestamp: binData.timestamp
        } : null
      };
    });
    
    console.log('[BIN ROUTES] Bin status:', binStatus);
    
    res.json({ 
      success: true, 
      message: `Found ${binKeys.length} bins in monitoring`,
      bins: binKeys,
      binStatus: binStatus,
      totalBins: binKeys.length
    });
    
  } catch (err) {
    console.error('[BIN ROUTES] Error checking bins:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check bins', 
      details: err.message 
    });
  }
});

// Get available bins from Firebase for registration
router.get("/available", async (req, res) => {
  console.log('[BIN ROUTES] /available endpoint called');
  try {
    const db = admin.database();
    const monitoringRef = db.ref('monitoring');
    
    // Get all bins under monitoring
    const snapshot = await monitoringRef.once('value');
    const allData = snapshot.val();
    
    if (!allData) {
      console.log('[BIN ROUTES] No bins found in monitoring');
      return res.json({ 
        success: true, 
        message: "No bins found in monitoring",
        availableBins: []
      });
    }
    
    // Filter out backup and get only actual bins
    const availableBins = [];
    Object.keys(allData).forEach(binKey => {
      if (binKey !== 'backup' && binKey.startsWith('bin')) {
        const binData = allData[binKey];
        if (binData && typeof binData === 'object') {
          availableBins.push({
            binId: binKey,
            name: binData.name || binKey,
            location: binData.mainLocation || binData.location || 'Unknown Location',
            type: binData.type || 'general',
            bin_level: binData.bin_level || 0,
            latitude: binData.latitude || 0,
            longitude: binData.longitude || 0,
            gps_valid: binData.gps_valid || false,
            last_active: binData.last_active || binData.timestamp || Date.now()
          });
        }
      }
    });
    
    console.log(`[BIN ROUTES] Found ${availableBins.length} available bins for registration:`, availableBins.map(b => b.binId));
    
    res.json({ 
      success: true, 
      message: `Found ${availableBins.length} available bins`,
      availableBins: availableBins
    });
    
  } catch (err) {
    console.error('[BIN ROUTES] Error getting available bins:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get available bins', 
      details: err.message 
    });
  }
});

// Register a bin for monitoring (add to active bins list)
router.post("/register", async (req, res) => {
  console.log('[BIN ROUTES] /register endpoint called');
  try {
    const { binId, customName, customLocation, assignedLocation } = req.body;
    
    // Validation
    if (!binId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: binId' 
      });
    }
    
    const db = admin.database();
    
    // Check if bin exists in Firebase
    const binRef = db.ref(`monitoring/${binId}`);
    const binSnapshot = await binRef.once('value');
    const binData = binSnapshot.val();
    
    if (!binData) {
      return res.status(404).json({ 
        success: false, 
        error: `Bin ${binId} not found in Firebase` 
      });
    }
    
    // Get or create active bins list
    const activeBinsRef = db.ref('activeBins');
    const activeBinsSnapshot = await activeBinsRef.once('value');
    const activeBins = activeBinsSnapshot.val() || {};
    
    // Check if bin is already registered - allow updates
    if (activeBins[binId]) {
      console.log(`[BIN ROUTES] Bin ${binId} is already registered, updating registration...`);
    }
    
    // Register the bin with location assignment
    const registrationData = {
      binId: binId,
      registeredAt: Date.now(),
      registeredBy: 'system',
      customName: customName || binData.name || binId,
      customLocation: customLocation || binData.mainLocation || binData.location || 'Unknown Location',
      assignedLocation: assignedLocation || 'Central Plaza', // Default to Central Plaza
      isActive: true,
      lastProcessed: Date.now()
    };
    
    await activeBinsRef.child(binId).set(registrationData);
    
    const isUpdate = !!activeBins[binId];
    console.log(`[BIN ROUTES] Successfully ${isUpdate ? 'updated' : 'registered'} bin ${binId} for monitoring at location: ${assignedLocation}`);
    
    res.json({ 
      success: true, 
      message: `Bin ${binId} ${isUpdate ? 'updated' : 'registered'} successfully for monitoring at ${assignedLocation}`,
      binId: binId,
      registrationData: registrationData,
      isUpdate: isUpdate
    });
    
  } catch (err) {
    console.error('[BIN ROUTES] Error registering bin:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to register bin', 
      details: err.message 
    });
  }
});

// Get registered bins by location
router.get("/registered", async (req, res) => {
  console.log('[BIN ROUTES] /registered endpoint called');
  try {
    const db = admin.database();
    
    // Get registered bins
    const activeBinsRef = db.ref('activeBins');
    const activeBinsSnapshot = await activeBinsRef.once('value');
    const activeBins = activeBinsSnapshot.val() || {};
    
    // Get real-time data for each registered bin
    const monitoringRef = db.ref('monitoring');
    const monitoringSnapshot = await monitoringRef.once('value');
    const monitoringData = monitoringSnapshot.val() || {};
    
    // Combine registration data with real-time data
    const registeredBins = [];
    Object.keys(activeBins).forEach(binId => {
      const registration = activeBins[binId];
      const realTimeData = monitoringData[binId];
      
      if (registration.isActive && realTimeData) {
        registeredBins.push({
          binId: binId,
          assignedLocation: registration.assignedLocation || 'Central Plaza', // Default fallback
          customName: registration.customName,
          customLocation: registration.customLocation,
          registeredAt: registration.registeredAt,
          // Real-time data
          bin_level: realTimeData.bin_level || 0,
          weight_percent: realTimeData.weight_percent || 0,
          height_percent: realTimeData.height_percent || 0,
          latitude: realTimeData.latitude || 0,
          longitude: realTimeData.longitude || 0,
          gps_valid: realTimeData.gps_valid || false,
          timestamp: realTimeData.timestamp || Date.now(),
          type: realTimeData.type || 'general'
        });
      }
    });
    
    console.log(`[BIN ROUTES] Found ${registeredBins.length} registered bins`);
    
    res.json({ 
      success: true, 
      message: `Found ${registeredBins.length} registered bins`,
      registeredBins: registeredBins
    });
    
  } catch (err) {
    console.error('[BIN ROUTES] Error getting registered bins:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get registered bins', 
      details: err.message 
    });
  }
});

module.exports = router;
