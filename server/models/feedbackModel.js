const { db } = require("./firebase");

const FeedbackModel = {
  // Create a new feedback entry
  async createFeedback(feedbackData) {
    try {
      const docRef = await db.collection('feedback').add(feedbackData);
      return { id: docRef.id, ...feedbackData };
    } catch (error) {
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
          limit,
          offset,
          hasMore: (offset + feedback.length) < totalCount
        }
      };
    } catch (error) {
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

      const stats = {
        totalFeedback: allFeedback.length,
        recentFeedback: allFeedback.filter(f => {
          const createdAt = new Date(f.createdAt);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return createdAt > sevenDaysAgo;
        }).length,
        averageLength: allFeedback.length > 0 
          ? Math.round(allFeedback.reduce((sum, f) => sum + (f.content?.length || 0), 0) / allFeedback.length)
          : 0
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
