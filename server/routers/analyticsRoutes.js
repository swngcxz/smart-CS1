const express = require("express");
const router = express.Router();
const {
  getCollectionCounts,
  getAverageFillLevel,
  getCriticalBins,
  getRouteEfficiency
} = require("../controllers/analyticsController");

router.get("/counts", getCollectionCounts);
router.get("/average-fill", getAverageFillLevel);
router.get("/critical", getCriticalBins);
router.get("/route-efficiency", getRouteEfficiency);

module.exports = router;
