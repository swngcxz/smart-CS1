const FeedbackModel = require("../models/feedbackModel");
const { categorizeFeedback, analyzeSentiment, extractTopics } = require("../utils/sentimentAnalysis");

const feedbackController = {
  // Submit new feedback
  async submitFeedback(req, res) {
    try {
      const { content, name, email, rating } = req.body;
      
      
      // Validate required fields
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Feedback content is required" });
      }

      // Validate rating if provided
      if (rating !== undefined && rating !== null) {
        const ratingNum = typeof rating === 'string' ? parseInt(rating) : rating;
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
          return res.status(400).json({ 
            error: "Rating must be a number between 1 and 5",
            validRange: "1-5"
          });
        }
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

      // Analyze sentiment and categorize feedback
      const finalRating = rating ? (typeof rating === 'string' ? parseInt(rating) : rating) : null;
      const categorization = categorizeFeedback(trimmedContent, finalRating || 0);
      const sentiment = analyzeSentiment(trimmedContent);
      const topics = extractTopics(trimmedContent);

      // Prepare feedback data
      const feedbackData = {
        content: trimmedContent,
        name: name || userName || 'Anonymous',
        email: email || userEmail || '',
        rating: finalRating, // Store rating as integer or null
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || req.connection.remoteAddress || '',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'pending', // pending, reviewed, resolved
        category: categorization.category, // Auto-categorized: general, bug, feature, complaint, praise
        subcategory: categorization.subcategory, // More specific: compliment, suggestion, negative_feedback, etc.
        sentiment: categorization.sentiment, // positive, negative, suggestion, neutral
        sentimentConfidence: categorization.confidence, // 0-1 confidence score
        topics: topics, // Array of detected topics
        analysis: {
          sentiment: sentiment,
          categorization: categorization
        }
      };

      // Only add userId if it exists (user is logged in)
      if (userId) {
        feedbackData.userId = userId;
      }

      // Ensure no undefined values are passed to Firestore
      Object.keys(feedbackData).forEach(key => {
        if (feedbackData[key] === undefined) {
          delete feedbackData[key];
        }
      });

      // Save to database
      const result = await FeedbackModel.createFeedback(feedbackData);
      
      console.log('Feedback submitted:', { 
        id: result.id, 
        userId: userId || 'anonymous',
        length: trimmedContent.length,
        rating: finalRating || 'no rating',
        category: categorization.category,
        subcategory: categorization.subcategory,
        sentiment: categorization.sentiment,
        confidence: categorization.confidence,
        topics: topics
      });

      res.status(201).json({ 
        message: "Feedback submitted successfully", 
        feedback: result,
        characterCount: trimmedContent.length,
        rating: finalRating,
        categorization: {
          category: categorization.category,
          subcategory: categorization.subcategory,
          sentiment: categorization.sentiment,
          confidence: categorization.confidence,
          topics: topics
        }
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      
      // Provide more user-friendly error messages
      let errorMessage = error.message;
      if (error.message.includes('Firestore')) {
        errorMessage = "There was an issue saving your feedback. Please try again.";
      } else if (error.message.includes('validation')) {
        errorMessage = error.message;
      }
      
      res.status(500).json({ error: errorMessage });
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

  // Get feedback analytics with categorization
  async getFeedbackAnalytics(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      
      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        orderBy: 'createdAt',
        orderDirection: 'desc'
      };

      const result = await FeedbackModel.getAllFeedback(options);
      
      // Analyze all feedback for analytics
      const analytics = {
        total: result.feedback.length,
        categories: {},
        sentiments: {},
        subcategories: {},
        topics: {},
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentTrends: []
      };

      result.feedback.forEach(feedback => {
        // Count categories
        const category = feedback.category || 'general';
        analytics.categories[category] = (analytics.categories[category] || 0) + 1;

        // Count sentiments
        const sentiment = feedback.sentiment || 'neutral';
        analytics.sentiments[sentiment] = (analytics.sentiments[sentiment] || 0) + 1;

        // Count subcategories
        const subcategory = feedback.subcategory || 'general';
        analytics.subcategories[subcategory] = (analytics.subcategories[subcategory] || 0) + 1;

        // Count topics
        if (feedback.topics && Array.isArray(feedback.topics)) {
          feedback.topics.forEach(topic => {
            analytics.topics[topic] = (analytics.topics[topic] || 0) + 1;
          });
        }

        // Count ratings
        if (feedback.rating && feedback.rating >= 1 && feedback.rating <= 5) {
          analytics.ratingDistribution[feedback.rating]++;
        }
      });

      res.json({
        analytics,
        feedback: result.feedback,
        pagination: result.pagination
      });
    } catch (error) {
      console.error("Error fetching feedback analytics:", error);
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
