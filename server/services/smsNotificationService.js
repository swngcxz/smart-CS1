/**
 * SMS Notification Service
 * Handles SMS notifications for manual task assignments and other notifications
 */

const { db } = require('../models/firebase');
const gsmService = require('./gsmService');

class SMSNotificationService {
  constructor() {
    this.serviceName = 'SMS Notification Service';
    this.isInitialized = false;
    this.healthStatus = {
      isHealthy: false,
      lastHealthCheck: null,
      consecutiveFailures: 0,
      totalSmsSent: 0,
      totalSmsFailed: 0,
      lastError: null
    };
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 2000, // 2 seconds
      backoffMultiplier: 2
    };
  }

  /**
   * Initialize the SMS notification service
   */
  async initialize() {
    try {
      console.log(`[${this.serviceName}] Initializing SMS notification service...`);
      
      // Initialize GSM service
      await gsmService.initialize();
      console.log(`[${this.serviceName}] GSM service initialized`);
      
      this.isInitialized = true;
      this.healthStatus.isHealthy = true;
      this.healthStatus.lastHealthCheck = new Date().toISOString();
      
      console.log(`[${this.serviceName}] ✅ SMS notification service initialized successfully`);
    } catch (error) {
      console.error(`[${this.serviceName}] ❌ Failed to initialize SMS notification service:`, error);
      this.healthStatus.isHealthy = false;
      this.healthStatus.lastError = error.message;
      throw error;
    }
  }

  /**
   * Get service health status
   * @returns {Object} Health status information
   */
  getHealthStatus() {
    return {
      ...this.healthStatus,
      isInitialized: this.isInitialized,
      gsmStatus: gsmService.getStatus()
    };
  }

  /**
   * Perform health check
   * @returns {Object} Health check result
   */
  async performHealthCheck() {
    try {
      const gsmStatus = gsmService.getStatus();
      const isHealthy = this.isInitialized && gsmStatus.isConnected;
      
      this.healthStatus.isHealthy = isHealthy;
      this.healthStatus.lastHealthCheck = new Date().toISOString();
      
      if (!isHealthy) {
        this.healthStatus.consecutiveFailures++;
        this.healthStatus.lastError = gsmStatus.lastError || 'GSM module not connected';
      } else {
        this.healthStatus.consecutiveFailures = 0;
        this.healthStatus.lastError = null;
      }
      
      return {
        isHealthy,
        gsmStatus,
        consecutiveFailures: this.healthStatus.consecutiveFailures,
        lastError: this.healthStatus.lastError
      };
    } catch (error) {
      this.healthStatus.isHealthy = false;
      this.healthStatus.lastError = error.message;
      this.healthStatus.consecutiveFailures++;
      return {
        isHealthy: false,
        error: error.message
      };
    }
  }

  /**
   * Retry mechanism for SMS sending
   * @param {Function} smsFunction - Function to retry
   * @param {Array} args - Arguments for the function
   * @returns {Object} Result of SMS sending
   */
  async retrySMS(smsFunction, args) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`[${this.serviceName}] SMS attempt ${attempt}/${this.retryConfig.maxRetries}`);
        const result = await smsFunction(...args);
        
        if (result.success) {
          this.healthStatus.totalSmsSent++;
          this.healthStatus.consecutiveFailures = 0;
          return result;
        } else {
          lastError = new Error(result.error || 'SMS sending failed');
        }
      } catch (error) {
        lastError = error;
        console.error(`[${this.serviceName}] SMS attempt ${attempt} failed:`, error.message);
      }
      
      if (attempt < this.retryConfig.maxRetries) {
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        console.log(`[${this.serviceName}] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    this.healthStatus.totalSmsFailed++;
    this.healthStatus.consecutiveFailures++;
    this.healthStatus.lastError = lastError.message;
    
    return {
      success: false,
      error: lastError.message,
      attempts: this.retryConfig.maxRetries
    };
  }

  /**
   * Get janitor details by ID
   * @param {string} janitorId - The janitor's document ID
   * @returns {Object} Janitor details including contact number
   */
  async getJanitorDetails(janitorId) {
    try {
      if (!janitorId) {
        throw new Error('Janitor ID is required');
      }

      const janitorRef = db.collection('users').doc(janitorId);
      const janitorDoc = await janitorRef.get();

      if (!janitorDoc.exists) {
        throw new Error('Janitor not found');
      }

      const janitorData = janitorDoc.data();
      
      // Verify the user is a janitor
      if (janitorData.role !== 'janitor') {
        throw new Error('User is not a janitor');
      }

      // Check if contact number exists
      if (!janitorData.contactNumber) {
        throw new Error('Janitor contact number not found');
      }

      return {
        id: janitorDoc.id,
        fullName: janitorData.fullName,
        contactNumber: janitorData.contactNumber,
        email: janitorData.email,
        location: janitorData.location,
        status: janitorData.status
      };
    } catch (error) {
      console.error(`[${this.serviceName}] Error fetching janitor details:`, error);
      throw error;
    }
  }

  /**
   * Format coordinates for SMS display
   * @param {Object} coordinates - GPS coordinates
   * @returns {string} Formatted coordinates string
   */
  formatCoordinates(coordinates) {
    if (!coordinates || (!coordinates.latitude && !coordinates.longitude)) {
      return 'GPS: Not available';
    }
    
    const lat = coordinates.latitude || 0;
    const lng = coordinates.longitude || 0;
    return `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  /**
   * Format bin level status for SMS
   * @param {number} binLevel - Bin fill level percentage
   * @returns {string} Formatted status string
   */
  formatBinStatus(binLevel) {
    if (binLevel >= 90) return 'CRITICAL';
    if (binLevel >= 70) return 'WARNING';
    if (binLevel >= 50) return 'MODERATE';
    return 'NORMAL';
  }

  /**
   * Create SMS message for manual task assignment
   * @param {Object} taskData - Task assignment data
   * @returns {string} Formatted SMS message
   */
  createManualTaskSMSMessage(taskData) {
    const {
      binName,
      binLocation,
      binLevel,
      weight,
      height,
      coordinates,
      taskNotes,
      assignedBy,
      assignmentType
    } = taskData;

    const status = this.formatBinStatus(binLevel);
    const time = new Date().toLocaleString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // SINGLE-LINE FORMAT - Newlines cause multi-part SMS which fails with Error 325
    // MUST stay under 160 characters
    const isManualAssignment = assignmentType === 'manual';
    const taskType = isManualAssignment ? 'MANUAL' : 'AUTO';
    
    // Build message with separators instead of newlines
    let message = `${taskType} TASK: ${binName} @ ${binLocation}. `;
    message += `Level:${binLevel}% (${status}). `;
    message += `W:${weight}kg H:${height}%. `;
    
    // Add task notes if they fit
    if (taskNotes && taskNotes.trim()) {
      const notes = taskNotes.trim().replace(/\n/g, ' '); // Remove any newlines from notes
      const availableSpace = 150 - message.length - 20; // Reserve for ending
      
      if (notes.length <= availableSpace) {
        message += `Note: ${notes}. `;
      } else if (availableSpace > 10) {
        message += `Note: ${notes.substring(0, availableSpace - 4)}... `;
      }
    }
    
    message += `By ${assignedBy || 'Staff'} ${time}. Empty now`;

    // Safety check - if over 160, rebuild without notes
    if (message.length > 160) {
      message = `${taskType} TASK: ${binName} @ ${binLocation}. Level:${binLevel}% (${status}). W:${weight}kg H:${height}%. By ${assignedBy || 'Staff'} ${time}. Empty now`;
    }

    // Final safety - truncate if still over 160
    if (message.length > 160) {
      message = message.substring(0, 157) + '...';
    }

    return message;
  }

  /**
   * Send SMS notification for manual task assignment
   * @param {Object} taskData - Task assignment data
   * @param {string} janitorId - Janitor's document ID
   * @returns {Object} SMS send result
   */
  async sendManualTaskSMS(taskData, janitorId) {
    try {
      console.log(`[${this.serviceName}] Preparing manual task SMS for janitor: ${janitorId}`);

      // Perform health check first
      const healthCheck = await this.performHealthCheck();
      if (!healthCheck.isHealthy) {
        console.warn(`[${this.serviceName}] SMS service not healthy, using fallback mode`);
      }

      // Get janitor details
      const janitor = await this.getJanitorDetails(janitorId);
      
      if (!janitor.contactNumber) {
        throw new Error('Janitor contact number not available');
      }

      // Create SMS message
      const smsMessage = this.createManualTaskSMSMessage({
        ...taskData,
        assignedBy: janitor.fullName // Use janitor's name as assigned by for now
      });

      console.log(`[${this.serviceName}] SMS Message prepared:`, {
        to: janitor.contactNumber,
        janitorName: janitor.fullName,
        binName: taskData.binName,
        binLevel: taskData.binLevel,
        weight: taskData.weight,
        height: taskData.height,
        dataSource: taskData.dataSource || 'unknown'
      });

      // Send SMS with retry mechanism
      const smsResult = await this.retrySMS(
        this.sendRealSMS.bind(this),
        [janitor.contactNumber, smsMessage]
      );

      if (smsResult.success) {
        console.log(`[${this.serviceName}] Manual task SMS sent successfully to ${janitor.fullName} (${janitor.contactNumber})`);
      } else {
        console.error(`[${this.serviceName}] Manual task SMS failed after ${smsResult.attempts} attempts: ${smsResult.error}`);
      }

      return {
        success: smsResult.success,
        message: smsResult.success ? 'SMS sent successfully' : 'Failed to send SMS notification',
        janitor: {
          id: janitor.id,
          name: janitor.fullName,
          contactNumber: janitor.contactNumber
        },
        smsResult: smsResult,
        healthStatus: healthCheck
      };

    } catch (error) {
      console.error(`[${this.serviceName}] Failed to send manual task SMS:`, error);
      this.healthStatus.totalSmsFailed++;
      this.healthStatus.consecutiveFailures++;
      this.healthStatus.lastError = error.message;
      
      return {
        success: false,
        error: error.message,
        message: 'Failed to send SMS notification'
      };
    }
  }

  /**
   * Send real SMS via GSM module
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message content
   * @returns {Object} SMS send result
   */
  async sendRealSMS(phoneNumber, message) {
    try {
      console.log(`[${this.serviceName}] Sending real SMS via GSM module...`);
      
      // Check if GSM service is available
      const gsmStatus = gsmService.getStatus();
      if (!gsmStatus.isConnected || !gsmStatus.isInitialized) {
        console.log(`[${this.serviceName}] GSM module not ready, using fallback mode`);
        return await this.sendFallbackSMS(phoneNumber, message);
      }
      
      // Format phone number (ensure it starts with +)
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      // Send SMS via GSM service with fallback
      const result = await gsmService.sendSMSWithFallback(formattedNumber, message);
      
      if (result.success) {
        console.log(`[${this.serviceName}] Real SMS sent successfully via GSM module`);
      } else {
        console.error(`[${this.serviceName}] Real SMS failed: ${result.error}`);
        console.log(`[${this.serviceName}] Trying fallback mode...`);
        return await this.sendFallbackSMS(phoneNumber, message);
      }
      
      return result;

    } catch (error) {
      console.error(`[${this.serviceName}] Real SMS error:`, error);
      console.log(`[${this.serviceName}] Trying fallback mode...`);
      return await this.sendFallbackSMS(phoneNumber, message);
    }
  }

  /**
   * Send fallback SMS (console logging)
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message content
   * @returns {Object} SMS send result
   */
  async sendFallbackSMS(phoneNumber, message) {
    try {
      console.log('='.repeat(80));
      console.log(' SMS NOTIFICATION (FALLBACK MODE)');
      console.log('='.repeat(80));
      console.log(` To: ${phoneNumber}`);
      console.log(` Message: ${message}`);
      console.log(` Time: ${new Date().toLocaleString()}`);
      console.log('='.repeat(80));

      return {
        success: true,
        status: 'success',
        method: 'fallback_console',
        messageId: `fallback_${Date.now()}`,
        timestamp: new Date().toISOString(),
        phoneNumber: phoneNumber
      };

    } catch (error) {
      console.error(`[${this.serviceName}] Fallback SMS error:`, error);
      return {
        success: false,
        error: error.message,
        status: 'failed',
        method: 'fallback_console',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Send SMS notification for automatic bin alerts
   * @param {Object} alertData - Alert data
   * @param {string} janitorId - Janitor's document ID
   * @returns {Object} SMS send result
   */
  async sendAutomaticAlertSMS(alertData, janitorId) {
    try {
      console.log(`[${this.serviceName}] Preparing automatic alert SMS for janitor: ${janitorId}`);

      const janitor = await this.getJanitorDetails(janitorId);
      
      if (!janitor.contactNumber) {
        throw new Error('Janitor contact number not available');
      }

      // Create alert SMS message
      const smsMessage = this.createAutomaticAlertSMSMessage(alertData);

      const smsResult = await this.sendRealSMS(janitor.contactNumber, smsMessage);

      console.log(`[${this.serviceName}] Automatic alert SMS sent successfully to ${janitor.fullName}`);

      return {
        success: true,
        message: 'Alert SMS sent successfully',
        janitor: {
          id: janitor.id,
          name: janitor.fullName,
          contactNumber: janitor.contactNumber
        },
        smsResult: smsResult
      };

    } catch (error) {
      console.error(`[${this.serviceName}] Failed to send automatic alert SMS:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to send alert SMS'
      };
    }
  }

  /**
   * Create SMS message for automatic bin alerts
   * @param {Object} alertData - Alert data
   * @returns {string} Formatted SMS message
   */
  createAutomaticAlertSMSMessage(alertData) {
    const {
      binName,
      binLocation,
      binLevel,
      alertType,
      coordinates
    } = alertData;

    const status = this.formatBinStatus(binLevel);
    const coordinatesStr = this.formatCoordinates(coordinates);
    const timestamp = new Date().toLocaleString();

    let message = `AUTOMATIC BIN ALERT \n\n`;
    message += ` Bin: ${binName}\n`;
    message += ` Location: ${binLocation}\n`;
    message += ` Fill Level: ${binLevel}% (${status})\n`;
    message += ` Alert Type: ${alertType.toUpperCase()}\n`;
    message += `${coordinatesStr}\n\n`;
    message += ` Time: ${timestamp}\n\n`;
    message += `Please check and empty the bin as soon as possible.`;

    return message;
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      serviceName: this.serviceName,
      isInitialized: this.isInitialized,
      timestamp: new Date().toISOString(),
      features: [
        'Manual task assignment SMS',
        'Automatic bin alert SMS',
        'Janitor contact management',
        'SMS message formatting'
      ]
    };
  }
}

// Export singleton instance
module.exports = new SMSNotificationService();
