const { db } = require('../models/firebase');
const binHistoryModel = require('../models/binHistoryModel');

/**
 * Hybrid Data Storage Service
 * Manages intelligent data storage with validation, batching, and buffering
 */
class HybridDataService {
  constructor() {
    this.config = {
      // Storage intervals (in milliseconds)
      NORMAL_DATA_INTERVAL: 2 * 60 * 60 * 1000, // 2 hours
      WARNING_DATA_INTERVAL: 30 * 60 * 1000,    // 30 minutes
      CRITICAL_DATA_INTERVAL: 5 * 60 * 1000,    // 5 minutes
      
      // Data validation thresholds
      MAX_WEIGHT: 1000,           // kg
      MIN_WEIGHT: 0,              // kg
      MAX_BIN_LEVEL: 100,         // percentage
      MIN_BIN_LEVEL: 0,           // percentage
      MIN_SATELLITES: 3,          // GPS satellites
      GPS_ACCURACY_THRESHOLD: 10, // meters
      
      // Buffer limits
      MAX_BUFFER_SIZE: 1000,      // max records in memory
      CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
      
      // Error classification
      CRITICAL_ERRORS: [
        'MALFUNCTION',
        'SENSOR_FAILURE',
        'COMMUNICATION_LOST',
        'POWER_FAILURE'
      ],
      WARNING_ERRORS: [
        'GPS_INVALID',
        'LOW_SATELLITES',
        'HIGH_BIN_LEVEL',
        'WEIGHT_ANOMALY'
      ],
      
      // Duplicate error detection
      DUPLICATE_ERROR_WINDOW: 60 * 60 * 1000, // 1 hour in milliseconds
      MAX_DUPLICATE_ERRORS_PER_DAY: 1, // Max 1 duplicate error per day per bin (generic)
      MAX_OFFLINE_ERRORS_PER_DAY: 2 // Allow up to 2 offline records per day per bin
    };
    
    // In-memory buffers for different data types
    this.buffers = {
      normal: new Map(),      // binId -> latest data
      warning: new Map(),     // binId -> latest data
      critical: new Map()     // binId -> latest data
    };
    
    // Duplicate error tracking
    this.duplicateErrorTracker = new Map(); // binId -> { errorType, lastSeen, count }
    
    // Timers for batch processing
    this.timers = {
      normal: null,
      warning: null,
      critical: null
    };
    
    // Statistics tracking
    this.stats = {
      totalReceived: 0,
      totalSaved: 0,
      totalFiltered: 0,
      criticalSaved: 0,
      lastCleanup: new Date()
    };
    
    this.initializeTimers();
  }

  /**
   * Initialize batch processing timers
   */
  initializeTimers() {
    // Normal data batch processing (every 2 hours)
    this.timers.normal = setInterval(() => {
      this.processBatch('normal');
    }, this.config.NORMAL_DATA_INTERVAL);

    // Warning data batch processing (every 30 minutes)
    this.timers.warning = setInterval(() => {
      this.processBatch('warning');
    }, this.config.WARNING_DATA_INTERVAL);

    // Critical data batch processing (every 5 minutes)
    this.timers.critical = setInterval(() => {
      this.processBatch('critical');
    }, this.config.CRITICAL_DATA_INTERVAL);

    // Cleanup timer (every 24 hours)
    setInterval(() => {
      this.cleanup();
    }, this.config.CLEANUP_INTERVAL);

    console.log('[HYBRID SERVICE] Timers initialized');
  }

  /**
   * Main entry point for processing incoming data
   * @param {Object} data - Raw monitoring data
   * @returns {Object} Processing result
   */
  async processIncomingData(data) {
    try {
      this.stats.totalReceived++;
      
      // Step 1: Validate data
      const validation = this.validateData(data);
      if (!validation.isValid) {
        this.stats.totalFiltered++;
        return {
          success: false,
          reason: 'validation_failed',
          errors: validation.errors,
          action: 'filtered'
        };
      }

      // Step 2: Check for duplicate errors
      const duplicateCheck = this.checkDuplicateError(data);
      if (duplicateCheck.isDuplicate) {
        this.stats.totalFiltered++;
        console.log(`[HYBRID SERVICE] Duplicate error detected for bin ${data.binId}: ${duplicateCheck.errorType}`);
        return {
          success: false,
          reason: 'duplicate_error',
          errorType: duplicateCheck.errorType,
          action: 'filtered'
        };
      }

      // Step 3: Classify data importance
      const classification = this.classifyData(data, validation);
      
      // Step 4: Process based on classification
      const result = await this.processByClassification(data, classification);
      
      // Step 5: Update statistics
      try {
        this.updateStats(result);
      } catch (statsError) {
        console.error('[HYBRID SERVICE] Error updating stats:', statsError);
      }
      
      return result;

    } catch (error) {
      console.error('[HYBRID SERVICE] Error processing data:', error);
      return {
        success: false,
        reason: 'processing_error',
        error: error.message
      };
    }
  }

  /**
   * Check for duplicate errors to avoid recording the same error multiple times
   * @param {Object} data - Raw data
   * @returns {Object} Duplicate check result
   */
  checkDuplicateError(data) {
    const binId = data.binId;
    const now = new Date();

    // Determine error type: from message or inferred GPS issue
    let errorType = null;
    if (data.errorMessage) {
      errorType = this.detectErrorType(data.errorMessage);
    } else {
      const satellites = parseInt(data?.satellites || 0, 10) || 0;
      const hasInvalidCoords = data?.gps && (parseFloat(data.gps.lat) === 0 && parseFloat(data.gps.lng) === 0);
      const gpsValidFlag = (data?.gpsValid === true || data?.gps_valid === true);
      if (!gpsValidFlag || satellites < this.config.MIN_SATELLITES || hasInvalidCoords) {
        errorType = 'GPS_INVALID';
      }
    }

    if (!errorType) {
      return { isDuplicate: false };
    }
    const trackerKey = `${binId}_${errorType}`;
    
    // Get existing tracker data
    const existingTracker = this.duplicateErrorTracker.get(trackerKey);
    
    if (existingTracker) {
      const timeSinceLastSeen = now.getTime() - existingTracker.lastSeen.getTime();
      
      // If the same error occurred within the duplicate window, it's a duplicate
      if (timeSinceLastSeen < this.config.DUPLICATE_ERROR_WINDOW) {
        return {
          isDuplicate: true,
          errorType,
          timeSinceLastSeen,
          duplicateCount: existingTracker.count
        };
      }
      
      // If we've exceeded the max duplicate errors per day, filter it out
      const isOffline = errorType === 'MALFUNCTION' || errorType === 'COMMUNICATION_LOST' || errorType === 'POWER_FAILURE' || errorType === 'UNKNOWN_ERROR' || errorType === 'GPS_INVALID' ? false : false;
      const maxPerDay = errorType === 'CONNECTION_ERROR' || errorType === 'COMMUNICATION_LOST' ? this.config.MAX_OFFLINE_ERRORS_PER_DAY : this.config.MAX_DUPLICATE_ERRORS_PER_DAY;
      if (existingTracker.dailyCount >= maxPerDay) {
        const today = new Date().toDateString();
        if (existingTracker.lastDay === today) {
          return {
            isDuplicate: true,
            errorType,
            reason: 'daily_limit_exceeded',
            dailyCount: existingTracker.dailyCount
          };
        }
      }
    }
    
    // Update or create tracker
    const today = new Date().toDateString();
    const isNewDay = !existingTracker || existingTracker.lastDay !== today;
    
    this.duplicateErrorTracker.set(trackerKey, {
      errorType,
      lastSeen: now,
      count: existingTracker ? existingTracker.count + 1 : 1,
      dailyCount: isNewDay ? 1 : (existingTracker ? existingTracker.dailyCount + 1 : 1),
      lastDay: today
    });
    
    return { isDuplicate: false };
  }

  /**
   * Validate incoming data
   * @param {Object} data - Raw data
   * @returns {Object} Validation result
   */
  validateData(data) {
    const errors = [];
    const warnings = [];

    // Required fields check
    if (!data.binId) {
      errors.push('binId is required');
    }

    // Weight validation
    if (data.weight !== undefined) {
      if (data.weight < this.config.MIN_WEIGHT || data.weight > this.config.MAX_WEIGHT) {
        errors.push(`Weight out of range: ${data.weight}kg`);
      }
    }

    // Bin level validation
    if (data.binLevel !== undefined) {
      if (data.binLevel < this.config.MIN_BIN_LEVEL || data.binLevel > this.config.MAX_BIN_LEVEL) {
        errors.push(`Bin level out of range: ${data.binLevel}%`);
      }
    }

    // GPS validation
    if (data.gps) {
      if (data.gps.lat === 0 && data.gps.lng === 0) {
        warnings.push('GPS coordinates invalid (0,0)');
      }
    }

    // Satellite count validation
    if (data.satellites !== undefined && data.satellites < this.config.MIN_SATELLITES) {
      warnings.push(`Low satellite count: ${data.satellites}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      hasWarnings: warnings.length > 0
    };
  }

  /**
   * Classify data based on content and validation results
   * @param {Object} data - Raw data
   * @param {Object} validation - Validation result
   * @returns {Object} Classification result
   */
  classifyData(data, validation) {
    let priority = 'normal';
    let reasons = [];

    // Check for critical errors first (highest priority)
    if (data.errorMessage) {
      const errorType = this.detectErrorType(data.errorMessage);
      if (this.config.CRITICAL_ERRORS.includes(errorType)) {
        priority = 'critical';
        reasons.push('critical_error');
      } else if (this.config.WARNING_ERRORS.includes(errorType)) {
        priority = 'warning';
        reasons.push('warning_error');
      }
    }

    // Check for critical bin levels (very high levels need immediate attention)
    if (data.binLevel >= 95) {
      priority = 'critical';
      reasons.push('critical_bin_level');
    } else if (data.binLevel >= 85) {
      priority = 'warning';
      reasons.push('warning_bin_level');
    }

    // Check for critical weight levels (very heavy bins)
    if (data.weight >= 900) {
      priority = 'critical';
      reasons.push('critical_weight');
    } else if (data.weight >= 700) {
      priority = 'warning';
      reasons.push('warning_weight');
    }

    // Check for sensor failures (no data or invalid readings)
    if (data.weight === 0 && data.binLevel === 0 && data.distance === 0) {
      priority = 'critical';
      reasons.push('sensor_failure');
    }

    // Check for data anomalies
    if (validation.hasWarnings) {
      if (priority === 'normal') {
        priority = 'warning';
        reasons.push('data_warnings');
      }
    }

    // Check for GPS issues (only warning, not critical)
    if (!data.gpsValid || data.satellites < this.config.MIN_SATELLITES) {
      if (priority === 'normal') {
        priority = 'warning';
        reasons.push('gps_issues');
      }
    }

    return {
      priority,
      reasons,
      shouldSaveImmediately: priority === 'critical',
      shouldBuffer: priority !== 'critical'
    };
  }

  /**
   * Process data based on classification
   * @param {Object} data - Raw data
   * @param {Object} classification - Classification result
   * @returns {Object} Processing result
   */
  async processByClassification(data, classification) {
    const binId = data.binId;
    const timestamp = new Date();

    if (classification.shouldSaveImmediately) {
      // Save critical data immediately
      return await this.saveImmediately(data, 'critical');
    } else if (classification.shouldBuffer) {
      // Buffer non-critical data
      return this.bufferData(data, classification.priority);
    } else {
      // Filter out invalid data
      return {
        success: false,
        reason: 'filtered',
        action: 'discarded'
      };
    }
  }

  /**
   * Save data immediately to database
   * @param {Object} data - Data to save
   * @param {string} priority - Data priority
   * @returns {Object} Save result
   */
  async saveImmediately(data, priority) {
    try {
      const processedData = this.prepareDataForStorage(data, priority);
      const record = await binHistoryModel.createBinHistoryRecord(processedData);
      
      this.stats.totalSaved++;
      if (priority === 'critical') {
        this.stats.criticalSaved++;
      }

      console.log(`[HYBRID SERVICE] Saved ${priority} data immediately for bin ${data.binId}`);
      
      return {
        success: true,
        action: 'saved_immediately',
        priority,
        recordId: record.id
      };
    } catch (error) {
      console.error('[HYBRID SERVICE] Error saving immediately:', error);
      return {
        success: false,
        reason: 'save_error',
        error: error.message
      };
    }
  }

  /**
   * Buffer data in memory for batch processing
   * @param {Object} data - Data to buffer
   * @param {string} priority - Data priority
   * @returns {Object} Buffer result
   */
  bufferData(data, priority) {
    const binId = data.binId;
    const timestamp = new Date();
    
    // Prepare data for buffering
    const bufferedData = {
      ...data,
      priority,
      bufferedAt: timestamp,
      bufferId: `${binId}_${timestamp.getTime()}`,
      isLatest: true // Mark as latest data
    };

    // Store in appropriate buffer (this will overwrite previous data for the same bin)
    this.buffers[priority].set(binId, bufferedData);

    // Also store in a separate "latest" buffer for quick access
    this.buffers.latest = this.buffers.latest || new Map();
    this.buffers.latest.set(binId, {
      ...bufferedData,
      source: 'buffer',
      lastUpdated: timestamp
    });

    // Check buffer size limits and process if needed
    if (this.buffers[priority].size > this.config.MAX_BUFFER_SIZE) {
      console.log(`[HYBRID SERVICE] Buffer size limit reached for ${priority}, processing batch...`);
      this.processBatch(priority);
    }

    console.log(`[HYBRID SERVICE] Buffered ${priority} data for bin ${binId} (Buffer size: ${this.buffers[priority].size})`);
    
    return {
      success: true,
      action: 'buffered',
      priority,
      bufferSize: this.buffers[priority].size,
      isLatest: true
    };
  }

  /**
   * Process buffered data in batches
   * @param {string} priority - Priority level to process
   * @returns {Object} Processing result
   */
  async processBatch(priority) {
    try {
      const buffer = this.buffers[priority];
      if (buffer.size === 0) {
        return { success: true, action: 'no_data_to_process' };
      }

      const records = Array.from(buffer.values());
      const batchSize = Math.min(records.length, 100); // Process in batches of 100
      const batch = records.slice(0, batchSize);

      // Prepare batch data
      const batchData = batch.map(record => this.prepareDataForStorage(record, priority));

      // Save batch to database
      const savedRecords = [];
      for (const data of batchData) {
        try {
          const record = await binHistoryModel.createBinHistoryRecord(data);
          savedRecords.push(record);
        } catch (error) {
          console.error(`[HYBRID SERVICE] Error saving batch record:`, error);
        }
      }

      // Remove processed records from priority buffer (but keep in latest buffer)
      batch.forEach(record => {
        buffer.delete(record.binId);
        // Note: We keep the data in the latest buffer for real-time access
      });

      this.stats.totalSaved += savedRecords.length;

      console.log(`[HYBRID SERVICE] Processed ${savedRecords.length} ${priority} records in batch`);
      
      return {
        success: true,
        action: 'batch_processed',
        priority,
        recordsProcessed: savedRecords.length,
        remainingInBuffer: buffer.size
      };

    } catch (error) {
      console.error(`[HYBRID SERVICE] Error processing ${priority} batch:`, error);
      return {
        success: false,
        reason: 'batch_error',
        error: error.message
      };
    }
  }

  /**
   * Prepare data for storage
   * @param {Object} data - Raw data
   * @param {string} priority - Data priority
   * @returns {Object} Prepared data
   */
  prepareDataForStorage(data, priority) {
    return {
      binId: data.binId,
      weight: parseFloat(data.weight) || 0,
      distance: parseFloat(data.distance) || 0,
      binLevel: parseFloat(data.binLevel) || 0,
      gps: {
        lat: parseFloat(data.gps?.lat) || 0,
        lng: parseFloat(data.gps?.lng) || 0
      },
      gpsValid: Boolean(data.gpsValid),
      satellites: parseInt(data.satellites) || 0,
      status: this.determineStatus(data, priority),
      // include normalized error type for downstream logic/export
      errorType: data.errorMessage ? this.detectErrorType(data.errorMessage) : (Boolean(data.gpsValid) ? null : 'GPS_INVALID'),
      errorMessage: data.errorMessage || null,
      priority,
      timestamp: new Date(),
      createdAt: new Date()
    };
  }

  /**
   * Determine data status based on content and priority
   * @param {Object} data - Raw data
   * @param {string} priority - Data priority
   * @returns {string} Status
   */
  determineStatus(data, priority) {
    if (data.errorMessage) {
      const errorType = this.detectErrorType(data.errorMessage);
      if (this.config.CRITICAL_ERRORS.includes(errorType)) {
        return 'CRITICAL_ERROR';
      } else if (this.config.WARNING_ERRORS.includes(errorType)) {
        return 'WARNING';
      }
    }

    if (priority === 'critical') {
      return 'CRITICAL';
    } else if (priority === 'warning') {
      return 'WARNING';
    } else {
      return 'OK';
    }
  }

  /**
   * Detect error type from error message
   * @param {string} errorMessage - Error message
   * @returns {string} Error type
   */
  detectErrorType(errorMessage) {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('malfunction') || message.includes('sensor failure')) {
      return 'MALFUNCTION';
    } else if (message.includes('communication') || message.includes('connection')) {
      return 'COMMUNICATION_LOST';
    } else if (message.includes('power') || message.includes('battery')) {
      return 'POWER_FAILURE';
    } else if (message.includes('gps') || message.includes('satellite')) {
      return 'GPS_INVALID';
    } else if (message.includes('weight') || message.includes('level')) {
      return 'WEIGHT_ANOMALY';
    } else {
      return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Get latest data for a bin (from memory buffer)
   * @param {string} binId - Bin identifier
   * @returns {Object|null} Latest data or null
   */
  getLatestData(binId) {
    // First check the latest buffer for quick access
    if (this.buffers.latest && this.buffers.latest.has(binId)) {
      return this.buffers.latest.get(binId);
    }

    // Fallback: Check all priority buffers for latest data
    for (const priority of ['critical', 'warning', 'normal']) {
      const data = this.buffers[priority].get(binId);
      if (data) {
        return {
          ...data,
          source: 'buffer',
          priority
        };
      }
    }
    return null;
  }

  /**
   * Get all latest data from memory buffer
   * @returns {Array} Array of latest data for all bins
   */
  getAllLatestData() {
    if (!this.buffers.latest) {
      return [];
    }

    return Array.from(this.buffers.latest.values()).map(data => ({
      ...data,
      source: 'buffer'
    }));
  }

  /**
   * Get system statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const bufferStats = {};
    for (const [priority, buffer] of Object.entries(this.buffers)) {
      if (priority !== 'latest') { // Don't include latest buffer in priority stats
        bufferStats[priority] = buffer.size;
      }
    }

    // Add latest buffer stats separately
    const latestBufferSize = this.buffers.latest ? this.buffers.latest.size : 0;

    return {
      ...this.stats,
      bufferStats,
      latestBufferSize,
      uptime: Date.now() - this.stats.lastCleanup.getTime()
    };
  }

  /**
   * Update statistics based on processing result
   * @param {Object} result - Processing result
   */
  updateStats(result) {
    if (result.success) {
      this.stats.totalSaved++;
      
      if (result.priority === 'critical') {
        this.stats.criticalSaved++;
      }
    } else {
      this.stats.totalFiltered++;
    }
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart timers with new intervals
    this.clearTimers();
    this.initializeTimers();
    
    console.log('[HYBRID SERVICE] Configuration updated');
  }

  /**
   * Clear all timers
   */
  clearTimers() {
    Object.values(this.timers).forEach(timer => {
      if (timer) clearInterval(timer);
    });
  }

  /**
   * Cleanup old data and reset statistics
   */
  cleanup() {
    // Clear old buffered data (older than 24 hours)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [priority, buffer] of Object.entries(this.buffers)) {
      for (const [binId, data] of buffer.entries()) {
        if (data.bufferedAt < cutoffTime) {
          buffer.delete(binId);
        }
      }
    }

    // Clean up old duplicate error tracking data (older than 24 hours)
    const today = new Date().toDateString();
    for (const [trackerKey, trackerData] of this.duplicateErrorTracker.entries()) {
      if (trackerData.lastDay !== today) {
        this.duplicateErrorTracker.delete(trackerKey);
      }
    }

    // Reset statistics
    this.stats.lastCleanup = new Date();
    
    console.log('[HYBRID SERVICE] Cleanup completed');
  }

  /**
   * Force process all buffered data
   * @returns {Object} Processing result
   */
  async forceProcessAll() {
    const results = {};
    
    for (const priority of ['critical', 'warning', 'normal']) {
      results[priority] = await this.processBatch(priority);
    }
    
    return results;
  }

  /**
   * Shutdown service gracefully
   */
  async shutdown() {
    console.log('[HYBRID SERVICE] Shutting down...');
    
    // Process all remaining buffered data
    await this.forceProcessAll();
    
    // Clear timers
    this.clearTimers();
    
    console.log('[HYBRID SERVICE] Shutdown complete');
  }
}

module.exports = new HybridDataService();
