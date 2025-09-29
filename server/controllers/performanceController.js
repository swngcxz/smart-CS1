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
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59); // Last day of the month
      
      console.log(`Fetching performance data for ${yearNum}-${monthNum}`);
      console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Query activity logs for the specified month
      // Note: This query requires a composite index in Firestore
      // If the index doesn't exist, we'll use a fallback approach
      let activityLogsSnapshot;
      
      try {
        activityLogsSnapshot = await db.collection('activitylogs')
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .where('userRole', 'in', ['janitor', 'driver', 'maintenance']) // Include all cleaning staff
          .get();
      } catch (indexError) {
        if (indexError.code === 9) { // FAILED_PRECONDITION - missing index
          console.log('⚠️ Composite index missing, using fallback query approach');
          
          // Fallback: Get all activity logs for the date range, then filter by role
          const allLogsSnapshot = await db.collection('activitylogs')
            .where('timestamp', '>=', startDate)
            .where('timestamp', '<=', endDate)
            .get();
          
          // Filter by role in memory
          const filteredDocs = [];
          allLogsSnapshot.forEach(doc => {
            const data = doc.data();
            if (['janitor', 'driver', 'maintenance'].includes(data.userRole)) {
              filteredDocs.push({
                id: doc.id,
                data: () => data
              });
            }
          });
          
          // Create a mock snapshot-like object
          activityLogsSnapshot = {
            forEach: (callback) => filteredDocs.forEach(callback),
            size: filteredDocs.length
          };
        } else {
          throw indexError; // Re-throw if it's a different error
        }
      }

      const activityLogs = [];
      
      activityLogsSnapshot.forEach(doc => {
        const data = typeof doc.data === 'function' ? doc.data() : doc.data;
        activityLogs.push({
          id: doc.id,
          ...data
        });
      });

      console.log(`Found ${activityLogs.length} activity logs`);

      // Count activities per user
      const userActivityCounts = {};
      const userDetails = {};

      activityLogs.forEach(log => {
        const userId = log.userId;
        const userRole = log.userRole;
        
        // Only count janitors, drivers, and maintenance staff
        if (['janitor', 'driver', 'maintenance'].includes(userRole)) {
          if (!userActivityCounts[userId]) {
            userActivityCounts[userId] = 0;
            userDetails[userId] = {
              id: userId,
              fullName: log.userFirstName ? 
                `${log.userFirstName} ${log.userLastName || ''}`.trim() : 
                'Unknown User',
              email: log.userEmail || '',
              role: userRole,
              status: 'active',
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

      // Get additional user details from users collection
      const usersSnapshot = await db.collection('users').get();
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const userId = doc.id;
        
        if (userDetails[userId]) {
          // Update with more complete user information
          userDetails[userId] = {
            ...userDetails[userId],
            fullName: userData.fullName || userData.firstName || userDetails[userId].fullName,
            email: userData.email || userDetails[userId].email,
            avatarUrl: userData.avatarUrl || '',
            status: userData.status || 'active'
          };
        }
      });

      // Convert to array and sort by activity count
      const janitorPerformance = Object.keys(userActivityCounts).map(userId => ({
        ...userDetails[userId],
        activityCount: userActivityCounts[userId]
      })).sort((a, b) => b.activityCount - a.activityCount);

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

      let activityLogsSnapshot;
      
      try {
        activityLogsSnapshot = await db.collection('activitylogs')
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .where('userRole', 'in', ['janitor', 'driver', 'maintenance'])
          .get();
      } catch (indexError) {
        if (indexError.code === 9) { // FAILED_PRECONDITION - missing index
          console.log('⚠️ Composite index missing, using fallback query approach for summary');
          
          // Fallback: Get all activity logs for the date range, then filter by role
          const allLogsSnapshot = await db.collection('activitylogs')
            .where('timestamp', '>=', startDate)
            .where('timestamp', '<=', endDate)
            .get();
          
          // Filter by role in memory
          const filteredDocs = [];
          allLogsSnapshot.forEach(doc => {
            const data = doc.data();
            if (['janitor', 'driver', 'maintenance'].includes(data.userRole)) {
              filteredDocs.push({
                id: doc.id,
                data: () => data
              });
            }
          });
          
          // Create a mock snapshot-like object
          activityLogsSnapshot = {
            forEach: (callback) => filteredDocs.forEach(callback),
            size: filteredDocs.length
          };
        } else {
          throw indexError; // Re-throw if it's a different error
        }
      }

      const activityLogs = [];
      
      activityLogsSnapshot.forEach(doc => {
        const data = typeof doc.data === 'function' ? doc.data() : doc.data;
        activityLogs.push(data);
      });

      // Count activities per user
      const userActivityCounts = {};
      activityLogs.forEach(log => {
        const userId = log.userId;
        const userRole = log.userRole;
        
        if (['janitor', 'driver', 'maintenance'].includes(userRole)) {
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
