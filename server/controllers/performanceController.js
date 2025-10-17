const { db } = require('../models/firebase');

class PerformanceController {
  // Get janitor performance data for a specific month/year
  async getJanitorPerformance(req, res) {
    try {
      const { month, year } = req.query;
      
      if (!month || !year) {
        return res.status(400).json({
          success: false,
          error: 'Month and year parameters are required'
        });
      }

      // Handle both "YYYY-MM" format and separate month/year parameters
      let monthNum, yearNum;
      
      if (month.includes('-')) {
        // Format: "YYYY-MM"
        const [yearStr, monthStr] = month.split('-');
        yearNum = parseInt(yearStr);
        monthNum = parseInt(monthStr);
      } else {
        // Separate parameters
        yearNum = parseInt(year);
        monthNum = parseInt(month);
      }

      // Create date range for the specified month
      const startDate = new Date(yearNum, monthNum - 1, 1); // month is 0-indexed
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999); // Last day of the month with milliseconds
      
      console.log(`Fetching performance data for ${yearNum}-${monthNum}`);

      // Get all activity logs and filter by date in memory
      const activityLogsSnapshot = await db.collection('activitylogs').get();

      const activityLogs = [];
      
      activityLogsSnapshot.forEach(doc => {
        const data = doc.data();
        const logDate = new Date(data.timestamp);
        
        // Filter by month and year
        if (logDate.getFullYear() === yearNum && logDate.getMonth() === (monthNum - 1)) {
          activityLogs.push({
            id: doc.id,
            ...data
          });
        }
      });

      console.log(`Found ${activityLogs.length} activity logs for ${yearNum}-${monthNum}`);
      
      // Get all users to map user IDs to roles and details
      const usersSnapshot = await db.collection('users').get();
      const usersMap = {};
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        usersMap[doc.id] = {
          id: doc.id,
          fullName: userData.fullName || 'Unknown User',
          email: userData.email || '',
          role: userData.role || 'unknown',
          status: userData.status || 'active',
          avatarUrl: userData.avatarUrl || ''
        };
      });

      // Count activities per user
      const userActivityCounts = {};
      const userDetails = {};

      activityLogs.forEach(log => {
        // For task assignments, prioritize the assigned janitor over the creator
        let userId = log.user_id;
        let user = usersMap[userId];
        
        // If the creator is not a valid user or not a janitor/driver/maintenance,
        // but there's an assigned janitor, use the assigned janitor instead
        if ((!user || !['janitor', 'driver', 'maintenance'].includes(user.role)) && 
            log.assigned_janitor_id && usersMap[log.assigned_janitor_id]) {
          userId = log.assigned_janitor_id;
          user = usersMap[userId];
        }
        
        
        // Only count janitors, drivers, and maintenance staff
        if (user && ['janitor', 'driver', 'maintenance'].includes(user.role)) {
          if (!userActivityCounts[userId]) {
            userActivityCounts[userId] = 0;
            userDetails[userId] = {
              ...user,
              lastActivity: log.timestamp
            };
          }
          userActivityCounts[userId]++;
          
          // Update last activity if this is more recent
          if (new Date(log.timestamp) > new Date(userDetails[userId].lastActivity)) {
            userDetails[userId].lastActivity = log.timestamp;
          }
        }
      });

      // Convert to array and sort by activity count
      const janitorPerformance = Object.keys(userActivityCounts).map(userId => ({
        ...userDetails[userId],
        activityCount: userActivityCounts[userId]
      })).sort((a, b) => b.activityCount - a.activityCount);

      // Add performance percentile for each janitor
      const activityCounts = janitorPerformance.map(j => j.activityCount);
      janitorPerformance.forEach((janitor, index) => {
        const percentile = activityCounts.length > 1 ? 
          ((activityCounts.length - index - 1) / (activityCounts.length - 1)) * 100 : 50;
        
        janitor.performancePercentile = Math.round(percentile);
        
        // Add performance level based on percentile
        if (percentile >= 80) {
          janitor.performanceLevel = 'Excellent';
        } else if (percentile >= 60) {
          janitor.performanceLevel = 'Good';
        } else if (percentile >= 30) {
          janitor.performanceLevel = 'Average';
        } else {
          janitor.performanceLevel = 'Needs Improvement';
        }
      });

      // Calculate statistics
      const totalActivities = activityLogs.length;
      const topPerformer = janitorPerformance.length > 0 ? janitorPerformance[0] : null;
      const averageActivities = janitorPerformance.length > 0 ? 
        Math.round(totalActivities / janitorPerformance.length) : 0;

      console.log(`Performance data calculated:`, {
        totalJanitors: janitorPerformance.length,
        totalActivities,
        topPerformer: topPerformer?.fullName,
        averageActivities
      });

      res.json({
        success: true,
        data: {
          janitors: janitorPerformance,
          totalActivities,
          topPerformer,
          averageActivities,
          month: monthNum,
          year: yearNum,
          period: `${yearNum}-${monthNum.toString().padStart(2, '0')}`
        }
      });

    } catch (error) {
      console.error('Error fetching janitor performance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch performance data',
        details: error.message
      });
    }
  }

  // Get performance summary for dashboard
  async getPerformanceSummary(req, res) {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Get current month performance
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

      // Get all activity logs for the date range
      const activityLogsSnapshot = await db.collection('activitylogs')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();

      const activityLogs = [];
      
      activityLogsSnapshot.forEach(doc => {
        const data = doc.data();
        activityLogs.push(data);
      });

      // Get all users to map user IDs to roles
      const usersSnapshot = await db.collection('users').get();
      const usersMap = {};
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        usersMap[doc.id] = {
          role: userData.role || 'unknown'
        };
      });

      // Count activities per user
      const userActivityCounts = {};
      activityLogs.forEach(log => {
        const userId = log.user_id; // Use the correct field name
        const user = usersMap[userId];
        
        if (user && ['janitor', 'driver', 'maintenance'].includes(user.role)) {
          userActivityCounts[userId] = (userActivityCounts[userId] || 0) + 1;
        }
      });

      const topPerformers = Object.entries(userActivityCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      res.json({
        success: true,
        data: {
          totalActivities: activityLogs.length,
          activeJanitors: Object.keys(userActivityCounts).length,
          topPerformers,
          month: currentMonth,
          year: currentYear
        }
      });

    } catch (error) {
      console.error('Error fetching performance summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch performance summary',
        details: error.message
      });
    }
  }
}

module.exports = new PerformanceController();
