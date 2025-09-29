const FeedbackModel = require("../models/feedbackModel");

const feedbackController = {
  // Submit new feedback
  async submitFeedback(req, res) {
    try {
      const { content, name, email } = req.body;
      
      // Validate required fields
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Feedback content is required" });
      }

      // Validate content (minimum 10 words, maximum 500 characters)
      const trimmedContent = content.trim();
      
      // Count words
      const words = trimmedContent.split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      
      if (wordCount < 10) {
        return res.status(400).json({ 
          error: "Feedback must contain at least 10 words",
          minWords: 10,
          currentWordCount: wordCount,
          currentLength: trimmedContent.length
        });
      }

      if (trimmedContent.length > 500) {
        return res.status(400).json({ 
          error: "Feedback must not exceed 500 characters",
          maxLength: 500,
          currentLength: trimmedContent.length
        });
      }

      // Get user info if logged in
      const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
      let userId = null;
      let userEmail = null;
      let userName = null;
      
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET = process.env.TOKEN_SECRET || "your_jwt_secret";
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.id;
          userEmail = decoded.email;
          userName = decoded.fullName;
        } catch (err) {
          console.log('Token verification failed for feedback submission:', err.message);
        }
      }

      // Prepare feedback data
      const feedbackData = {
        content: trimmedContent,
        name: name || userName || 'Anonymous',
        email: email || userEmail || '',
        userId: userId,
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || req.connection.remoteAddress || '',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'pending', // pending, reviewed, resolved
        category: 'general' // general, bug, feature, complaint, praise
      };

      // Save to database
      const result = await FeedbackModel.createFeedback(feedbackData);
      
      console.log('Feedback submitted:', { 
        id: result.id, 
        userId: userId || 'anonymous',
        length: trimmedContent.length 
      });

      res.status(201).json({ 
        message: "Feedback submitted successfully", 
        feedback: result,
        characterCount: trimmedContent.length
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get all feedback (with pagination)
  async getAllFeedback(req, res) {
    try {
      const { limit = 20, offset = 0, status, category } = req.query;
      
      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        orderBy: 'createdAt',
        orderDirection: 'desc'
      };

      const result = await FeedbackModel.getAllFeedback(options);
      
      // Filter by status if provided
      let filteredFeedback = result.feedback;
      if (status) {
        filteredFeedback = filteredFeedback.filter(f => f.status === status);
      }
      
      // Filter by category if provided
      if (category) {
        filteredFeedback = filteredFeedback.filter(f => f.category === category);
      }

      res.json({
        ...result,
        feedback: filteredFeedback
      });
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get feedback by ID
  async getFeedbackById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Feedback ID is required" });
      }

      const feedback = await FeedbackModel.getFeedbackById(id);
      res.json({ feedback });
    } catch (error) {
      console.error("Error fetching feedback:", error);
      if (error.message === 'Feedback not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },

  // Get feedback statistics
  async getFeedbackStats(req, res) {
    try {
      const stats = await FeedbackModel.getFeedbackStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching feedback stats:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update feedback status (admin only)
  async updateFeedbackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, category } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "Feedback ID is required" });
      }

      // Validate status
      const validStatuses = ['pending', 'reviewed', 'resolved'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: "Invalid status", 
          validStatuses 
        });
      }

      // Validate category
      const validCategories = ['general', 'bug', 'feature', 'complaint', 'praise'];
      if (category && !validCategories.includes(category)) {
        return res.status(400).json({ 
          error: "Invalid category", 
          validCategories 
        });
      }

      const { db } = require('../models/firebase');
      const updateData = {
        updatedAt: new Date().toISOString()
      };

      if (status) updateData.status = status;
      if (category) updateData.category = category;

      await db.collection('feedback').doc(id).update(updateData);
      
      console.log('Feedback updated:', { id, status, category });

      res.json({ 
        message: "Feedback updated successfully",
        id,
        ...updateData
      });
    } catch (error) {
      console.error("Error updating feedback:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete feedback (admin only)
  async deleteFeedback(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Feedback ID is required" });
      }

      await FeedbackModel.deleteFeedback(id);
      
      console.log('Feedback deleted:', id);

      res.json({ 
        message: "Feedback deleted successfully",
        id
      });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = feedbackController;
