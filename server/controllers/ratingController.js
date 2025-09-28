const { db } = require("../models/firebase");

const ratingController = {
  async submitRating(req, res) {
    try {
      const { rating, feedback, userAgent, ipAddress } = req.body;
      
      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      // Get user info if logged in
      const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
      let userId = null;
      let userEmail = null;
      
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET = process.env.TOKEN_SECRET || "your_jwt_secret";
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.id;
          userEmail = decoded.email;
        } catch (err) {
          console.log('Token verification failed for rating submission:', err.message);
        }
      }

      // Prepare rating data
      const ratingData = {
        rating: parseInt(rating),
        feedback: feedback || '',
        userId: userId,
        userEmail: userEmail,
        userAgent: userAgent || req.headers['user-agent'],
        ipAddress: ipAddress || req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Save to Firestore
      const docRef = await db.collection('ratings').add(ratingData);
      
      console.log('Rating submitted:', { id: docRef.id, rating, userId: userId || 'anonymous' });

      res.status(201).json({ 
        message: "Rating submitted successfully", 
        id: docRef.id 
      });
    } catch (error) {
      console.error("Error submitting rating:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getRatings(req, res) {
    try {
      // Get query parameters
      const { limit = 50, offset = 0 } = req.query;
      
      // Get ratings from Firestore with pagination
      let query = db.collection('ratings')
        .orderBy('timestamp', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset));

      const snapshot = await query.get();
      const ratings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get total count
      const totalSnapshot = await db.collection('ratings').get();
      const totalCount = totalSnapshot.size;

      // Calculate average rating
      const avgRating = ratings.length > 0 
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
        : 0;

      res.json({
        ratings,
        totalCount,
        averageRating: parseFloat(avgRating),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + ratings.length) < totalCount
        }
      });
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async getRatingStats(req, res) {
    try {
      const snapshot = await db.collection('ratings').get();
      const allRatings = snapshot.docs.map(doc => doc.data().rating);

      if (allRatings.length === 0) {
        return res.json({
          totalRatings: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }

      // Calculate stats
      const totalRatings = allRatings.length;
      const averageRating = (allRatings.reduce((sum, rating) => sum + rating, 0) / totalRatings).toFixed(1);
      
      // Calculate distribution
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      allRatings.forEach(rating => {
        ratingDistribution[rating]++;
      });

      res.json({
        totalRatings,
        averageRating: parseFloat(averageRating),
        ratingDistribution
      });
    } catch (error) {
      console.error("Error fetching rating stats:", error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = ratingController;
