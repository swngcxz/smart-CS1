/**
 * Hybrid Data Storage Configuration
 * Centralized configuration for the hybrid data storage system
 */

const config = {
  // Data validation thresholds
  validation: {
    MAX_WEIGHT: 1000,           // kg
    MIN_WEIGHT: 0,              // kg
    MAX_BIN_LEVEL: 100,         // percentage
    MIN_BIN_LEVEL: 0,           // percentage
    MIN_SATELLITES: 3,          // GPS satellites
    GPS_ACCURACY_THRESHOLD: 10, // meters
    MAX_DISTANCE: 200,          // cm
    MIN_DISTANCE: 0             // cm
  },

  // Storage intervals (in milliseconds)
  intervals: {
    NORMAL_DATA_INTERVAL: 2 * 60 * 60 * 1000,    // 2 hours
    WARNING_DATA_INTERVAL: 30 * 60 * 1000,       // 30 minutes
    CRITICAL_DATA_INTERVAL: 5 * 60 * 1000,       // 5 minutes
    CLEANUP_INTERVAL: 24 * 60 * 60 * 1000,       // 24 hours
    HEALTH_CHECK_INTERVAL: 5 * 60 * 1000         // 5 minutes
  },

  // Buffer management
  buffer: {
    MAX_BUFFER_SIZE: 1000,      // max records in memory per priority
    MAX_MEMORY_USAGE: 100 * 1024 * 1024, // 100MB max memory usage
    COMPRESSION_THRESHOLD: 500, // compress data when buffer exceeds this
    PERSISTENCE_ENABLED: true,  // enable buffer persistence to disk
    PERSISTENCE_PATH: './data/buffers' // path for buffer persistence
  },

  // Error classification
  errors: {
    CRITICAL_ERRORS: [
      'MALFUNCTION',
      'SENSOR_FAILURE',
      'COMMUNICATION_LOST',
      'POWER_FAILURE',
      'HARDWARE_ERROR',
      'SYSTEM_CRASH'
    ],
    WARNING_ERRORS: [
      'GPS_INVALID',
      'LOW_SATELLITES',
      'HIGH_BIN_LEVEL',
      'WEIGHT_ANOMALY',
      'CONNECTION_SLOW',
      'BATTERY_LOW'
    ],
    INFO_ERRORS: [
      'GPS_WEAK',
      'SIGNAL_WEAK',
      'TEMPERATURE_HIGH',
      'HUMIDITY_HIGH'
    ]
  },

  // Data classification rules
  classification: {
    CRITICAL_BIN_LEVEL: 90,     // percentage
    WARNING_BIN_LEVEL: 70,      // percentage
    CRITICAL_WEIGHT: 800,       // kg
    WARNING_WEIGHT: 600,        // kg
    GPS_TIMEOUT: 30000,         // 30 seconds
    DATA_AGE_LIMIT: 300000      // 5 minutes
  },

  // Performance monitoring
  monitoring: {
    ENABLE_METRICS: true,
    METRICS_RETENTION_DAYS: 30,
    ALERT_THRESHOLDS: {
      HIGH_ERROR_RATE: 0.1,     // 10%
      HIGH_MEMORY_USAGE: 0.8,   // 80%
      HIGH_BUFFER_SIZE: 0.9,    // 90%
      LOW_PROCESSING_RATE: 0.5  // 50%
    },
    LOG_LEVEL: 'INFO' // DEBUG, INFO, WARN, ERROR
  },

  // Database optimization
  database: {
    BATCH_SIZE: 100,            // records per batch
    MAX_RETRIES: 3,             // max retry attempts
    RETRY_DELAY: 1000,          // delay between retries (ms)
    CONNECTION_POOL_SIZE: 10,   // database connection pool size
    QUERY_TIMEOUT: 30000        // query timeout (ms)
  },

  // Notification settings
  notifications: {
    ENABLE_ALERTS: true,
    CRITICAL_ALERT_INTERVAL: 5 * 60 * 1000,  // 5 minutes
    WARNING_ALERT_INTERVAL: 30 * 60 * 1000,  // 30 minutes
    EMAIL_ALERTS: true,
    SMS_ALERTS: false,
    WEBHOOK_ALERTS: true
  },

  // Development and testing
  development: {
    ENABLE_DEBUG_LOGGING: process.env.NODE_ENV === 'development',
    MOCK_DATA_ENABLED: false,
    SIMULATE_ERRORS: false,
    PERFORMANCE_TESTING: false
  }
};

/**
 * Get configuration value by path
 * @param {string} path - Dot notation path (e.g., 'validation.MAX_WEIGHT')
 * @returns {any} Configuration value
 */
function getConfig(path) {
  return path.split('.').reduce((obj, key) => obj?.[key], config);
}

/**
 * Update configuration value by path
 * @param {string} path - Dot notation path
 * @param {any} value - New value
 */
function updateConfig(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, config);
  target[lastKey] = value;
}

/**
 * Reset configuration to defaults
 */
function resetConfig() {
  // This would reset to the original config
  // Implementation depends on how you want to handle this
  console.log('[CONFIG] Configuration reset to defaults');
}

/**
 * Validate configuration
 * @returns {Object} Validation result
 */
function validateConfig() {
  const errors = [];
  const warnings = [];

  // Validate intervals
  if (config.intervals.NORMAL_DATA_INTERVAL <= 0) {
    errors.push('NORMAL_DATA_INTERVAL must be positive');
  }

  if (config.intervals.WARNING_DATA_INTERVAL >= config.intervals.NORMAL_DATA_INTERVAL) {
    warnings.push('WARNING_DATA_INTERVAL should be less than NORMAL_DATA_INTERVAL');
  }

  // Validate thresholds
  if (config.validation.MAX_WEIGHT <= config.validation.MIN_WEIGHT) {
    errors.push('MAX_WEIGHT must be greater than MIN_WEIGHT');
  }

  if (config.validation.MAX_BIN_LEVEL <= config.validation.MIN_BIN_LEVEL) {
    errors.push('MAX_BIN_LEVEL must be greater than MIN_BIN_LEVEL');
  }

  // Validate buffer settings
  if (config.buffer.MAX_BUFFER_SIZE <= 0) {
    errors.push('MAX_BUFFER_SIZE must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get environment-specific configuration
 * @param {string} environment - Environment name
 * @returns {Object} Environment-specific config
 */
function getEnvironmentConfig(environment) {
  const baseConfig = { ...config };

  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        intervals: {
          ...baseConfig.intervals,
          NORMAL_DATA_INTERVAL: 1 * 60 * 1000,    // 1 minute for testing
          WARNING_DATA_INTERVAL: 30 * 1000,       // 30 seconds
          CRITICAL_DATA_INTERVAL: 10 * 1000       // 10 seconds
        },
        buffer: {
          ...baseConfig.buffer,
          MAX_BUFFER_SIZE: 100
        },
        development: {
          ...baseConfig.development,
          ENABLE_DEBUG_LOGGING: true
        }
      };

    case 'production':
      return {
        ...baseConfig,
        monitoring: {
          ...baseConfig.monitoring,
          ENABLE_METRICS: true,
          LOG_LEVEL: 'WARN'
        },
        development: {
          ...baseConfig.development,
          ENABLE_DEBUG_LOGGING: false
        }
      };

    case 'testing':
      return {
        ...baseConfig,
        intervals: {
          ...baseConfig.intervals,
          NORMAL_DATA_INTERVAL: 5 * 1000,         // 5 seconds
          WARNING_DATA_INTERVAL: 2 * 1000,        // 2 seconds
          CRITICAL_DATA_INTERVAL: 1 * 1000        // 1 second
        },
        buffer: {
          ...baseConfig.buffer,
          MAX_BUFFER_SIZE: 50
        },
        development: {
          ...baseConfig.development,
          MOCK_DATA_ENABLED: true
        }
      };

    default:
      return baseConfig;
  }
}

module.exports = {
  config,
  getConfig,
  updateConfig,
  resetConfig,
  validateConfig,
  getEnvironmentConfig
};

