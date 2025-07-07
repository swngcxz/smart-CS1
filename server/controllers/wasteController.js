const { saveFeedback, getAllFeedbacks, getFeedbacksByStatus } = require("../models/wasteModel");

const submitFeedback = async (req, res, next) => {
  try {
    const { email, message, status, rating } = req.body;

    if (!email || !message || !status || !rating) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["complaint", "suggestion", "compliment"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const feedbackData = {
      email,
      message,
      status,
      rating,
      timestamp: new Date().toISOString()
    };

    await saveFeedback(feedbackData);

    res.status(201).json({
      message: "Feedback submitted successfully",
      data: feedbackData
    });
  } catch (err) {
    next(err);
  }
};

// get all feedback
const getFeedbacks = async (req, res, next) => {
  try {
    const data = await getAllFeedbacks();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

// get by status
const getFeedbacksByStatusController = async (req, res, next) => {
  try {
    const { status } = req.params;
    const data = await getFeedbacksByStatus(status);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitFeedback,
  getFeedbacks,
  getFeedbacksByStatusController
};
