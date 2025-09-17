const { db } = require("../models/firebase");
const { sendSMS } = require("../index"); // Import SMS function from main server file

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

      // Send static SMS notification (for now)
      try {
        const staticPhoneNumber = '+639309096606'; // Static phone number
        const smsMessage = `🚨 PICKUP REQUEST 🚨\n\nBin: ${pickupRequestData.binName}\nLocation: ${pickupRequestData.binLocation}\nLevel: ${pickupRequestData.binLevel}%\nPriority: ${pickupRequestData.priority.toUpperCase()}\n\nPlease check the staff dashboard for assignment.\n\nTime: ${new Date().toLocaleString()}`;
        
        await sendSMS(staticPhoneNumber, smsMessage);
        console.log(`[PICKUP REQUEST] Static SMS sent to ${staticPhoneNumber}`);
      } catch (notifyError) {
        console.error('[PICKUP REQUEST] Failed to send static SMS:', notifyError);
        // Don't fail the request creation if notification fails
      }

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
      const { janitorId, janitorName, janitorPhone } = req.body;

      if (!requestId || !janitorId) {
        return res.status(400).json({
          success: false,
          message: 'Request ID and janitor ID are required'
        });
      }

      // Update pickup request
      const requestRef = db.collection('pickupRequests').doc(requestId);
      const updateData = {
        assignedJanitor: janitorId,
        assignedJanitorName: janitorName || 'Unknown Janitor',
        assignedAt: new Date().toISOString(),
        status: 'assigned',
        updatedAt: new Date().toISOString()
      };

      await requestRef.update(updateData);

      // Get the updated request data
      const requestDoc = await requestRef.get();
      const requestData = requestDoc.data();

      // Send static SMS notification (for now)
      try {
        const staticPhoneNumber = '+639309096606'; // Static phone number
        const smsMessage = `🚨 PICKUP REQUEST ASSIGNED 🚨\n\nBin: ${requestData.binName}\nLocation: ${requestData.binLocation}\nLevel: ${requestData.binLevel}%\nPriority: ${requestData.priority.toUpperCase()}\n\nAssigned to: ${janitorName || 'Unknown Janitor'}\n\nPlease proceed to empty the bin immediately.\n\nTime: ${new Date().toLocaleString()}`;
        
        await sendSMS(staticPhoneNumber, smsMessage);
        console.log(`[PICKUP REQUEST] Static SMS sent to ${staticPhoneNumber} for assignment to ${janitorName}`);
      } catch (smsError) {
        console.error('[PICKUP REQUEST] Failed to send static SMS:', smsError);
      }

      res.json({
        success: true,
        message: 'Janitor assigned successfully',
        data: {
          id: requestId,
          ...requestData,
          ...updateData
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

  // Static SMS notification function (simplified for now)
  async sendStaticSMS(message) {
    try {
      const staticPhoneNumber = '+639309096606'; // Static phone number
      await sendSMS(staticPhoneNumber, message);
      console.log(`[PICKUP REQUEST] Static SMS sent to ${staticPhoneNumber}`);
    } catch (error) {
      console.error('[PICKUP REQUEST] Failed to send static SMS:', error);
      throw error;
    }
  }
};

module.exports = pickupRequestController;
