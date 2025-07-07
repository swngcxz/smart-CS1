const express = require("express");
const router = express.Router();
const {
  submitFeedback,
  getFeedbacks,
  getFeedbacksByStatusController
} = require("../controllers/wasteController");

// submit feedback
router.post("/feedback", submitFeedback);

// get all feedback
router.get("/feedback", getFeedbacks);

// get feedback by status
router.get("/feedback/:status", getFeedbacksByStatusController);

module.exports = router;
