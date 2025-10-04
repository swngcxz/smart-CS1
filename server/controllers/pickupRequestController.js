const { db } = require("../models/firebase");
const smsNotificationService = require("../services/smsNotificationService");

const pickupRequestController = {
  // Create a new pickup request
  async createPickupRequest(req, res) {
    try {
      const {
        binId,
        binName,
        binLevel,
        binLocation,
        binStatus,
        coordinates,
        weight,
        height,
        gpsValid,
        satellites,
        timestamp,
        status = 'pending',
        priority = 'high'
      } = req.body;

      // Validate required fields
      if (!binId || !binName || binLevel === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Bin ID, name, and level are required'
        });
      }

      const pickupRequestData = {
        binId,
        binName,
        binLevel: parseFloat(binLevel),
        binLocation: binLocation || 'Unknown Location',
        binStatus: binStatus || 'critical',
        coordinates: coordinates || [0, 0],
        weight: parseFloat(weight) || 0,
        height: parseFloat(height) || 0,
        gpsValid: Boolean(gpsValid),
        satellites: parseInt(satellites) || 0,
        timestamp: timestamp || new Date().toISOString(),
        status,
        priority: binLevel >= 90 ? 'critical' : binLevel >= 85 ? 'high' : 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedJanitor: null,
        assignedAt: null,
        completedAt: null,
        notes: ''
      };

      // Save pickup request to Firestore
      const docRef = await db.collection('pickupRequests').add(pickupRequestData);
      
      console.log(`[PICKUP REQUEST] Created pickup request ${docRef.id} for bin ${binName} (${binLevel}%)`);


      res.status(201).json({
        success: true,
        message: 'Pickup request created successfully',
        requestId: docRef.id,
        data: pickupRequestData
      });

    } catch (error) {
      console.error('[PICKUP REQUEST] Error creating pickup request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create pickup request',
        error: error.message
      });
    }
  },

  // Get all pickup requests
  async getPickupRequests(req, res) {
    try {
      const { status, priority, assignedJanitor } = req.query;
      
      let query = db.collection('pickupRequests');
      
      // Apply filters
      if (status) {
        query = query.where('status', '==', status);
      }
      if (priority) {
        query = query.where('priority', '==', priority);
      }
      if (assignedJanitor) {
        query = query.where('assignedJanitor', '==', assignedJanitor);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const pickupRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: pickupRequests,
        count: pickupRequests.length
      });

    } catch (error) {
      console.error('[PICKUP REQUEST] Error fetching pickup requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pickup requests',
        error: error.message
      });
    }
  },

  // Assign janitor to pickup request
  async assignJanitor(req, res) {
    try {
      const { requestId } = req.params;
      const { janitorId, janitorName, janitorPhone, taskNotes } = req.body;

      if (!requestId || !janitorId) {
        return res.status(400).json({
          success: false,
          message: 'Request ID and janitor ID are required'
        });
      }

      // Get the current request data first
      const requestRef = db.collection('pickupRequests').doc(requestId);
      const requestDoc = await requestRef.get();
      
      if (!requestDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Pickup request not found'
        });
      }

      const requestData = requestDoc.data();

      // Update pickup request
      const updateData = {
        assignedJanitor: janitorId,
        assignedJanitorName: janitorName || 'Unknown Janitor',
        assignedAt: new Date().toISOString(),
        status: 'assigned',
        updatedAt: new Date().toISOString()
      };

      // Add task notes if provided
      if (taskNotes && taskNotes.trim()) {
        updateData.taskNotes = taskNotes.trim();
      }

      await requestRef.update(updateData);

      // Send SMS notification to the assigned janitor
      try {
        console.log(`[PICKUP REQUEST] Sending SMS notification to janitor: ${janitorId}`);
        
        const smsResult = await smsNotificationService.sendManualTaskSMS({
          binName: requestData.binName,
          binLocation: requestData.binLocation,
          binLevel: requestData.binLevel,
          weight: requestData.weight,
          height: requestData.height,
          coordinates: {
            latitude: requestData.coordinates[0] || 0,
            longitude: requestData.coordinates[1] || 0
          },
          taskNotes: taskNotes || '',
          assignedBy: janitorName || 'Staff'
        }, janitorId);

        if (smsResult.success) {
          console.log(`[PICKUP REQUEST] ✅ SMS sent successfully to ${smsResult.janitor.name}`);
        } else {
          console.error(`[PICKUP REQUEST] ❌ SMS failed: ${smsResult.error}`);
        }

        // Update the response to include SMS status
        updateData.smsNotification = {
          sent: smsResult.success,
          error: smsResult.error || null,
          timestamp: new Date().toISOString()
        };

      } catch (smsError) {
        console.error('[PICKUP REQUEST] SMS notification error:', smsError);
        // Don't fail the assignment if SMS fails
        updateData.smsNotification = {
          sent: false,
          error: smsError.message,
          timestamp: new Date().toISOString()
        };
      }

      // Get the final updated request data
      const finalRequestDoc = await requestRef.get();
      const finalRequestData = finalRequestDoc.data();

      res.json({
        success: true,
        message: 'Janitor assigned successfully',
        data: {
          id: requestId,
          ...finalRequestData
        }
      });

    } catch (error) {
      console.error('[PICKUP REQUEST] Error assigning janitor:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign janitor',
        error: error.message
      });
    }
  },

  // Update pickup request status
  async updateStatus(req, res) {
    try {
      const { requestId } = req.params;
      const { status, notes } = req.body;

      if (!requestId || !status) {
        return res.status(400).json({
          success: false,
          message: 'Request ID and status are required'
        });
      }

      const updateData = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      if (status === 'completed') {
        updateData.completedAt = new Date().toISOString();
      }

      const requestRef = db.collection('pickupRequests').doc(requestId);
      await requestRef.update(updateData);

      const requestDoc = await requestRef.get();
      const requestData = requestDoc.data();

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: {
          id: requestId,
          ...requestData
        }
      });

    } catch (error) {
      console.error('[PICKUP REQUEST] Error updating status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update status',
        error: error.message
      });
    }
  },

};

module.exports = pickupRequestController;
