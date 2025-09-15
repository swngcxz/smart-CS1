/**
 * Rate Limiting Configuration
 * Controls daily upload limits for Firestore operations
 */

module.exports = {
  // Daily upload limits
  limits: {
    // Maximum bin history uploads per day per bin
    maxBinHistoryUploads: 5,
    
    // Maximum notification uploads per day per user
    maxNotificationUploads: 5,
    
    // Global limits (across all bins/users)
    maxGlobalBinHistoryUploads: 50,
    maxGlobalNotificationUploads: 50
  },
  
  // Reset configuration
  reset: {
    // Hour to reset daily counts (0 = midnight, 12 = noon)
    resetHour: 0,
    
    // Timezone for reset (optional, defaults to server timezone)
    timezone: 'UTC'
  },
  
  // Rate limiting behavior
  behavior: {
    // Whether to block requests when limit is exceeded
    blockOnExceed: true,
    
    // Whether to log rate limit violations
    logViolations: true,
    
    // Whether to include rate limit info in responses
    includeRateLimitInfo: true
  },
  
  // Emergency overrides
  emergency: {
    // Allow emergency overrides (for critical situations)
    allowEmergencyOverride: true,
    
    // Emergency override key (should be kept secret)
    emergencyKey: process.env.EMERGENCY_OVERRIDE_KEY || 'emergency_override_2024'
  }
};

