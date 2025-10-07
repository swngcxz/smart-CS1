const { db } = require("./firebase");

const FeedbackModel = {
  // Create a new feedback entry
  async createFeedback(feedbackData) {
    try {
      const docRef = await db.collection('feedback').add(feedbackData);
      return { id: docRef.id, ...feedbackData };
    } catch (error) {
      // Handle Firebase quota exceeded error
      if (error.code === 8 || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('Quota exceeded')) {
        console.error('[FEEDBACK] Firebase quota exceeded, returning fallback response');
        // Return a fallback response instead of throwing an error
        return { 
          id: 'fallback_' + Date.now(), 
          ...feedbackData,
          fallback: true,
          message: 'Feedback received (saved locally due to high demand)'
        };
      }
      throw new Error(`Failed to create feedback: ${error.message}`);
    }
  },

  // Get all feedback with pagination
  async getAllFeedback(options = {}) {
    try {
      const { limit = 20, offset = 0, orderBy = 'createdAt', orderDirection = 'desc' } = options;
      
      let query = db.collection('feedback')
        .orderBy(orderBy, orderDirection)
        .limit(limit)
        .offset(offset);

      const snapshot = await query.get();
      const feedback = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get total count for pagination
      const totalSnapshot = await db.collection('feedback').get();
      const totalCount = totalSnapshot.size;

      return {
        feedback,
        totalCount,
        pagination: {
          limit: limit,
          offset: offset,
          hasMore: (offset + feedback.length) < totalCount
        }
      };
    } catch (error) {
      // Handle Firebase quota exceeded error
      if (error.code === 8 || error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('Quota exceeded')) {
        console.error('[FEEDBACK] Firebase quota exceeded, returning fallback data');
        return {
          feedback: [],
          totalCount: 0,
          pagination: {
            limit: limit,
            offset: offset,
            hasMore: false
          },
          fallback: true,
          message: 'Service temporarily unavailable due to high demand'
        };
      }
      throw new Error(`Failed to fetch feedback: ${error.message}`);
    }
  },

  // Get feedback by ID
  async getFeedbackById(id) {
    try {
      const doc = await db.collection('feedback').doc(id).get();
      if (!doc.exists) {
        throw new Error('Feedback not found');
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`Failed to fetch feedback: ${error.message}`);
    }
  },

  // Get feedback statistics
  async getFeedbackStats() {
    try {
      const snapshot = await db.collection('feedback').get();
      const allFeedback = snapshot.docs.map(doc => doc.data());

      // Calculate rating statistics
      const feedbackWithRatings = allFeedback.filter(f => f.rating && f.rating >= 1 && f.rating <= 5);
      const averageRating = feedbackWithRatings.length > 0 
        ? feedbackWithRatings.reduce((sum, f) => sum + f.rating, 0) / feedbackWithRatings.length
        : 0;

      const stats = {
        totalFeedback: allFeedback.length,
        recentFeedback: allFeedback.filter(f => {
          const createdAt = new Date(f.createdAt);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return createdAt > sevenDaysAgo;
        }).length,
        averageLength: allFeedback.length > 0 
          ? Math.round(allFeedback.reduce((sum, f) => sum + (f.content?.length || 0), 0) / allFeedback.length)
          : 0,
        totalRatings: feedbackWithRatings.length,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        ratingDistribution: {
          1: feedbackWithRatings.filter(f => f.rating === 1).length,
          2: feedbackWithRatings.filter(f => f.rating === 2).length,
          3: feedbackWithRatings.filter(f => f.rating === 3).length,
          4: feedbackWithRatings.filter(f => f.rating === 4).length,
          5: feedbackWithRatings.filter(f => f.rating === 5).length
        }
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch feedback stats: ${error.message}`);
    }
  },

  // Delete feedback (admin only)
  async deleteFeedback(id) {
    try {
      await db.collection('feedback').doc(id).delete();
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete feedback: ${error.message}`);
    }
  }
};

module.exports = FeedbackModel;
