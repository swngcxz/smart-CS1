const { db } = require('../models/firebase');

// Get automatic tasks since a specific timestamp
const getAutomaticTasksSince = async (req, res, next) => {
  try {
    const { since, limit = 10 } = req.query;
    
    console.log(`[AUTOMATIC TASK CONTROLLER] Fetching automatic tasks since: ${since}`);
    
    let query = db.collection('activitylogs')
      .where('source', '==', 'automatic_monitoring')
      .orderBy('created_at', 'desc');
    
    if (since) {
      const sinceDate = new Date(parseInt(since));
      query = query.where('created_at', '>', sinceDate.toISOString());
    }
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const snapshot = await query.get();
    
    const activities = [];
    snapshot.forEach(doc => {
      activities.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`[AUTOMATIC TASK CONTROLLER] Found ${activities.length} automatic tasks`);
    
    res.status(200).json({
      success: true,
      activities,
      count: activities.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('[AUTOMATIC TASK CONTROLLER] Error fetching automatic tasks:', err);
    next(err);
  }
};

module.exports = {
  getAutomaticTasksSince
};
