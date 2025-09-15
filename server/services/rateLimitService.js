/**
 * Rate Limiting Service for Database Operations
 * Manages daily upload limits to prevent exceeding Firestore quotas
 */

const rateLimitConfig = require('../config/rateLimitConfig');

class RateLimitService {
  constructor() {
    // In-memory storage for rate limiting (resets on server restart)
    this.dailyCounts = new Map();
    this.dailyNotificationCounts = new Map();
    this.globalCounts = new Map();
    
    // Load configuration
    this.config = {
      maxBinHistoryUploads: rateLimitConfig.limits.maxBinHistoryUploads,
      maxNotificationUploads: rateLimitConfig.limits.maxNotificationUploads,
      maxGlobalBinHistoryUploads: rateLimitConfig.limits.maxGlobalBinHistoryUploads,
      maxGlobalNotificationUploads: rateLimitConfig.limits.maxGlobalNotificationUploads,
      resetHour: rateLimitConfig.reset.resetHour,
      blockOnExceed: rateLimitConfig.behavior.blockOnExceed,
      logViolations: rateLimitConfig.behavior.logViolations,
      includeRateLimitInfo: rateLimitConfig.behavior.includeRateLimitInfo
    };
    
    // Initialize cleanup interval
    this.initializeCleanup();
  }

  /**
   * Initialize cleanup interval to reset daily counts
   */
  initializeCleanup() {
    // Check every hour if we need to reset counts
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === this.config.resetHour) {
        this.resetDailyCounts();
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Get today's date key for rate limiting
   * @returns {string} Date key in YYYY-MM-DD format
   */
  getTodayKey() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Check if bin history upload is allowed
   * @param {string} binId - Bin ID (optional, for per-bin limiting)
   * @returns {Object} Rate limit status
   */
  checkBinHistoryUploadLimit(binId = 'global') {
    const todayKey = this.getTodayKey();
    const key = `${todayKey}_${binId}`;
    const globalKey = `${todayKey}_global_bin_history`;
    
    const currentCount = this.dailyCounts.get(key) || 0;
    const globalCount = this.globalCounts.get(globalKey) || 0;
    
    const isAllowed = currentCount < this.config.maxBinHistoryUploads && 
                     globalCount < this.config.maxGlobalBinHistoryUploads;
    
    return {
      allowed: isAllowed,
      currentCount: currentCount,
      maxCount: this.config.maxBinHistoryUploads,
      remaining: Math.max(0, this.config.maxBinHistoryUploads - currentCount),
      globalCount: globalCount,
      globalMaxCount: this.config.maxGlobalBinHistoryUploads,
      globalRemaining: Math.max(0, this.config.maxGlobalBinHistoryUploads - globalCount),
      resetTime: this.getNextResetTime()
    };
  }

  /**
   * Check if notification upload is allowed
   * @param {string} userId - User ID (optional, for per-user limiting)
   * @returns {Object} Rate limit status
   */
  checkNotificationUploadLimit(userId = 'global') {
    const todayKey = this.getTodayKey();
    const key = `${todayKey}_${userId}`;
    const globalKey = `${todayKey}_global_notifications`;
    
    const currentCount = this.dailyNotificationCounts.get(key) || 0;
    const globalCount = this.globalCounts.get(globalKey) || 0;
    
    const isAllowed = currentCount < this.config.maxNotificationUploads && 
                     globalCount < this.config.maxGlobalNotificationUploads;
    
    return {
      allowed: isAllowed,
      currentCount: currentCount,
      maxCount: this.config.maxNotificationUploads,
      remaining: Math.max(0, this.config.maxNotificationUploads - currentCount),
      globalCount: globalCount,
      globalMaxCount: this.config.maxGlobalNotificationUploads,
      globalRemaining: Math.max(0, this.config.maxGlobalNotificationUploads - globalCount),
      resetTime: this.getNextResetTime()
    };
  }

  /**
   * Record a bin history upload
   * @param {string} binId - Bin ID
   * @returns {boolean} Success status
   */
  recordBinHistoryUpload(binId = 'global') {
    const todayKey = this.getTodayKey();
    const key = `${todayKey}_${binId}`;
    const globalKey = `${todayKey}_global_bin_history`;
    
    const currentCount = this.dailyCounts.get(key) || 0;
    const globalCount = this.globalCounts.get(globalKey) || 0;
    
    this.dailyCounts.set(key, currentCount + 1);
    this.globalCounts.set(globalKey, globalCount + 1);
    
    console.log(`[RATE LIMIT] Bin history upload recorded for ${binId}. Count: ${currentCount + 1}/${this.config.maxBinHistoryUploads}, Global: ${globalCount + 1}/${this.config.maxGlobalBinHistoryUploads}`);
    return true;
  }

  /**
   * Record a notification upload
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  recordNotificationUpload(userId = 'global') {
    const todayKey = this.getTodayKey();
    const key = `${todayKey}_${userId}`;
    const globalKey = `${todayKey}_global_notifications`;
    
    const currentCount = this.dailyNotificationCounts.get(key) || 0;
    const globalCount = this.globalCounts.get(globalKey) || 0;
    
    this.dailyNotificationCounts.set(key, currentCount + 1);
    this.globalCounts.set(globalKey, globalCount + 1);
    
    console.log(`[RATE LIMIT] Notification upload recorded for ${userId}. Count: ${currentCount + 1}/${this.config.maxNotificationUploads}, Global: ${globalCount + 1}/${this.config.maxGlobalNotificationUploads}`);
    return true;
  }

  /**
   * Get next reset time
   * @returns {Date} Next reset time
   */
  getNextResetTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(this.config.resetHour, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Reset daily counts (called at midnight)
   */
  resetDailyCounts() {
    const todayKey = this.getTodayKey();
    
    // Remove old entries (not from today)
    for (const [key] of this.dailyCounts) {
      if (!key.startsWith(todayKey)) {
        this.dailyCounts.delete(key);
      }
    }
    
    for (const [key] of this.dailyNotificationCounts) {
      if (!key.startsWith(todayKey)) {
        this.dailyNotificationCounts.delete(key);
      }
    }
    
    for (const [key] of this.globalCounts) {
      if (!key.startsWith(todayKey)) {
        this.globalCounts.delete(key);
      }
    }
    
    console.log('[RATE LIMIT] Daily counts reset');
  }

  /**
   * Get current rate limit statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const todayKey = this.getTodayKey();
    let totalBinHistoryUploads = 0;
    let totalNotificationUploads = 0;
    let globalBinHistoryUploads = 0;
    let globalNotificationUploads = 0;
    
    // Count today's uploads
    for (const [key, count] of this.dailyCounts) {
      if (key.startsWith(todayKey)) {
        totalBinHistoryUploads += count;
      }
    }
    
    for (const [key, count] of this.dailyNotificationCounts) {
      if (key.startsWith(todayKey)) {
        totalNotificationUploads += count;
      }
    }
    
    // Get global counts
    globalBinHistoryUploads = this.globalCounts.get(`${todayKey}_global_bin_history`) || 0;
    globalNotificationUploads = this.globalCounts.get(`${todayKey}_global_notifications`) || 0;
    
    return {
      today: todayKey,
      binHistoryUploads: {
        total: totalBinHistoryUploads,
        maxAllowed: this.config.maxBinHistoryUploads,
        remaining: Math.max(0, this.config.maxBinHistoryUploads - totalBinHistoryUploads),
        globalTotal: globalBinHistoryUploads,
        globalMaxAllowed: this.config.maxGlobalBinHistoryUploads,
        globalRemaining: Math.max(0, this.config.maxGlobalBinHistoryUploads - globalBinHistoryUploads)
      },
      notificationUploads: {
        total: totalNotificationUploads,
        maxAllowed: this.config.maxNotificationUploads,
        remaining: Math.max(0, this.config.maxNotificationUploads - totalNotificationUploads),
        globalTotal: globalNotificationUploads,
        globalMaxAllowed: this.config.maxGlobalNotificationUploads,
        globalRemaining: Math.max(0, this.config.maxGlobalNotificationUploads - globalNotificationUploads)
      },
      resetTime: this.getNextResetTime(),
      config: this.config
    };
  }

  /**
   * Update rate limit configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[RATE LIMIT] Configuration updated:', this.config);
  }

  /**
   * Force reset all counts (for testing or emergency)
   */
  forceReset() {
    this.dailyCounts.clear();
    this.dailyNotificationCounts.clear();
    this.globalCounts.clear();
    console.log('[RATE LIMIT] All counts force reset');
  }
}

module.exports = new RateLimitService();
