const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const validateStaff = require("../middlewares/validateStaff");

router.post("/", validateStaff, staffController.create);
router.get("/", staffController.getAll);
router.put("/:id", staffController.update);
router.delete("/:id", staffController.delete);

module.exports = router;
