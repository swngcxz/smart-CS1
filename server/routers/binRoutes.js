const express = require("express");
const { saveBinData, getAllBins, assignBinTask  } = require("../controllers/binController");

const router = express.Router();

router.post("/bins", saveBinData);
router.get("/bins", getAllBins);
router.post("/assign-task", assignBinTask);

module.exports = router;
