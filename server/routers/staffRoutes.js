const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const validateStaff = require("../middlewares/validateStaff");

router.post("/", validateStaff, staffController.create);
router.get("/", staffController.getAll);
router.get("/janitors", staffController.getJanitors);
router.post("/seed-sample", staffController.seedSampleData);
router.post("/seed-current-user", staffController.seedCurrentUser);
router.put("/:id", staffController.update);
router.delete("/:id", staffController.delete);

router.get("/status-summary", staffController.getStatusSummary);
router.get("/all-with-counts", staffController.getAllStaffWithCounts);

module.exports = router;
