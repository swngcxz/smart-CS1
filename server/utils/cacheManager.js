const NodeCache = require('node-cache');

// Create cache instances with different TTLs
const cache = new NodeCache({ 
  stdTTL: 120, // 2 minutes default
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Don't clone objects for better performance
});

// Specialized caches for different data types
const binCache = new NodeCache({ stdTTL: 60 }); // 1 minute for bin data
const userCache = new NodeCache({ stdTTL: 120 }); // 2 minutes for user data
const analyticsCache = new NodeCache({ stdTTL: 180 }); // 3 minutes for analytics

class CacheManager {
  // Generic cache methods
  static set(key, value, ttl = 120) {
    return cache.set(key, value, ttl);
  }

  static get(key) {
    return cache.get(key);
  }

  static del(key) {
    return cache.del(key);
  }

  static has(key) {
    return cache.has(key);
  }

  // Bin-specific caching
  static setBinData(key, value, ttl = 60) {
    return binCache.set(key, value, ttl);
  }

  static getBinData(key) {
    return binCache.get(key);
  }

  static delBinData(key) {
    return binCache.del(key);
  }

  // User-specific caching
  static setUserData(key, value, ttl = 120) {
    return userCache.set(key, value, ttl);
  }

  static getUserData(key) {
    return userCache.get(key);
  }

  static delUserData(key) {
    return userCache.del(key);
  }

  // Analytics caching
  static setAnalytics(key, value, ttl = 180) {
    return analyticsCache.set(key, value, ttl);
  }

  static getAnalytics(key) {
    return analyticsCache.get(key);
  }

  // Cache statistics
  static getStats() {
    return {
      general: cache.getStats(),
      bins: binCache.getStats(),
      users: userCache.getStats(),
      analytics: analyticsCache.getStats()
    };
  }

  // Clear all caches
  static flushAll() {
    cache.flushAll();
    binCache.flushAll();
    userCache.flushAll();
    analyticsCache.flushAll();
  }

  // Generate cache key helpers
  static generateKey(prefix, ...params) {
    return `${prefix}:${params.join(':')}`;
  }

  // Cache with fallback function
  static async getOrSet(key, fallbackFn, ttl = 120) {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fallbackFn();
    this.set(key, result, ttl);
    return result;
  }
}

module.exports = CacheManager;
