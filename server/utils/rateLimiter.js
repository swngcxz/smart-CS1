class RateLimiter {
  constructor() {
    this.limits = new Map();
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  // Check if action is allowed within rate limit
  isAllowed(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.limits.has(key)) {
      this.limits.set(key, []);
    }

    const requests = this.limits.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    this.limits.set(key, validRequests);

    // Check if under limit
    if (validRequests.length < maxRequests) {
      validRequests.push(now);
      return true;
    }

    return false;
  }

  // Get remaining requests for a key
  getRemaining(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.limits.has(key)) {
      return maxRequests;
    }

    const requests = this.limits.get(key);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, maxRequests - validRequests.length);
  }

  // Get time until reset
  getResetTime(key, windowMs = 60000) {
    if (!this.limits.has(key) || this.limits.get(key).length === 0) {
      return 0;
    }

    const requests = this.limits.get(key);
    const oldestRequest = Math.min(...requests);
    const resetTime = oldestRequest + windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }

  // Clean up old entries
  cleanup() {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes

    for (const [key, requests] of this.limits.entries()) {
      const validRequests = requests.filter(timestamp => now - timestamp < maxAge);
      
      if (validRequests.length === 0) {
        this.limits.delete(key);
      } else {
        this.limits.set(key, validRequests);
      }
    }
  }

  // Destroy the rate limiter
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

module.exports = rateLimiter;
