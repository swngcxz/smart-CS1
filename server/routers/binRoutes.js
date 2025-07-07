const express = require("express");
const { saveBinData, getAllBins, assignBinTask  } = require("../controllers/binController");
const { getBinCollectionSummary } = require("../controllers/getBinCollectionSummary");
const router = express.Router();

router.post("/bins", saveBinData);
router.get("/bins", getAllBins);
router.post("/assign-task", assignBinTask);

router.get("/collection-summary", getBinCollectionSummary);

module.exports = router;
