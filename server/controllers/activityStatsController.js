const { db } = require("../models/firebase");

// Get activity statistics for overview cards
const getActivityStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`[ACTIVITY STATS] Fetching activity statistics for ${today}`);
    
    // Get all activities for today
    const snapshot = await db.collection("activitylogs")
      .where("date", "==", today)
      .get();

    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`[ACTIVITY STATS] Found ${activities.length} activities for today`);

    // Calculate statistics based on status
    const alerts = activities.filter(activity => 
      activity.status === 'pending'
    ).length;

    const inProgress = activities.filter(activity => 
      activity.status === 'in_progress'
    ).length;

    const collections = activities.filter(activity => 
      activity.status === 'done' && (
        activity.activity_type === 'collection' || 
        activity.activity_type === 'task_assignment' ||
        activity.activity_type === 'bin_collection' ||
        activity.activity_type === 'bin_emptied'
      )
    ).length;

    const maintenance = activities.filter(activity => 
      activity.activity_type === 'maintenance' || 
      activity.activity_type === 'repair' ||
      activity.activity_type === 'cleaning'
    ).length;

    const routeChanges = activities.filter(activity => 
      activity.activity_type === 'route_change' || 
      activity.activity_type === 'schedule_update' ||
      activity.activity_type === 'route_update'
    ).length;

    const stats = {
      collections,
      alerts,
      maintenance,
      routeChanges,
      inProgress,
      totalActivities: activities.length,
      date: today,
      lastUpdated: new Date().toISOString()
    };

    console.log(`[ACTIVITY STATS] Calculated stats:`, stats);

    res.status(200).json({
      success: true,
      stats,
      activities: activities.slice(0, 10) // Return first 10 activities for debugging
    });

  } catch (err) {
    console.error('[ACTIVITY STATS] Error fetching activity statistics:', err);
    next(err);
  }
};

// Get activity statistics with date range
const getActivityStatsWithRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: "startDate and endDate are required",
        example: "?startDate=2024-01-01&endDate=2024-01-31"
      });
    }

    console.log(`[ACTIVITY STATS] Fetching activity statistics from ${startDate} to ${endDate}`);
    
    // Get all activities in date range
    const snapshot = await db.collection("activitylogs")
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .orderBy("date", "desc")
      .get();

    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`[ACTIVITY STATS] Found ${activities.length} activities in date range`);

    // Calculate statistics
    const collections = activities.filter(activity => 
      activity.activity_type === 'collection' || 
      activity.activity_type === 'task_assignment' ||
      activity.activity_type === 'bin_collection' ||
      activity.activity_type === 'bin_emptied'
    ).length;

    const alerts = activities.filter(activity => 
      activity.activity_type === 'bin_alert' || 
      activity.activity_type === 'alert' ||
      activity.bin_status === 'critical' ||
      activity.bin_status === 'warning' ||
      activity.priority === 'high' ||
      activity.priority === 'urgent'
    ).length;

    const maintenance = activities.filter(activity => 
      activity.activity_type === 'maintenance' || 
      activity.activity_type === 'repair' ||
      activity.activity_type === 'cleaning'
    ).length;

    const routeChanges = activities.filter(activity => 
      activity.activity_type === 'route_change' || 
      activity.activity_type === 'schedule_update' ||
      activity.activity_type === 'route_update'
    ).length;

    const stats = {
      collections,
      alerts,
      maintenance,
      routeChanges,
      totalActivities: activities.length,
      dateRange: { startDate, endDate },
      lastUpdated: new Date().toISOString()
    };

    console.log(`[ACTIVITY STATS] Calculated stats for range:`, stats);

    res.status(200).json({
      success: true,
      stats,
      activities: activities.slice(0, 20) // Return first 20 activities for debugging
    });

  } catch (err) {
    console.error('[ACTIVITY STATS] Error fetching activity statistics with range:', err);
    next(err);
  }
};

module.exports = {
  getActivityStats,
  getActivityStatsWithRange
};
