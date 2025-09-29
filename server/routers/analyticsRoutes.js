const express = require("express");
const router = express.Router();
const {
  getCollectionCounts,
  getAverageFillLevel,
  getCriticalBins,
  getRouteEfficiency
} = require("../controllers/analyticsController");

router.get("/collection-counts", getCollectionCounts);
router.get("/average-fill-level", getAverageFillLevel);
router.get("/critical-bins", getCriticalBins);
router.get("/route-efficiency", getRouteEfficiency);

module.exports = router;
