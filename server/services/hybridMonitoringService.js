const { getConfig } = require('../config/hybridConfig');

/**
 * Hybrid System Monitoring Service
 * Monitors system health, performance, and alerts
 */
class HybridMonitoringService {
  constructor() {
    this.metrics = {
      // Performance metrics
      totalDataReceived: 0,
      totalDataProcessed: 0,
      totalDataFiltered: 0,
      totalDataSaved: 0,
      
      // Error metrics
      criticalErrors: 0,
      warningErrors: 0,
      validationErrors: 0,
      
      // Buffer metrics
      bufferUtilization: {
        normal: 0,
        warning: 0,
        critical: 0
      },
      
      // Processing metrics
      averageProcessingTime: 0,
      peakProcessingTime: 0,
      batchProcessingTimes: [],
      
      // Memory metrics
      memoryUsage: 0,
      peakMemoryUsage: 0,
      
      // Timestamps
      lastDataReceived: null,
      lastDataProcessed: null,
      lastError: null,
      systemStartTime: new Date()
    };

    this.alerts = [];
    this.alertHistory = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  /**
   * Start monitoring the hybrid system
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('[MONITORING] Already monitoring');
      return;
    }

    this.isMonitoring = true;
    const interval = getConfig('intervals.HEALTH_CHECK_INTERVAL') || 5 * 60 * 1000;
    
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, interval);

    console.log('[MONITORING] Started hybrid system monitoring');
  }

  /**
   * Stop monitoring the hybrid system
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    console.log('[MONITORING] Stopped hybrid system monitoring');
  }

  /**
   * Record data processing event
   * @param {Object} event - Processing event
   */
  recordEvent(event) {
    this.metrics.totalDataReceived++;
    this.metrics.lastDataReceived = new Date();

    if (event.success) {
      this.metrics.totalDataProcessed++;
      this.metrics.lastDataProcessed = new Date();
      
      if (event.action === 'saved_immediately' || event.action === 'batch_processed') {
        this.metrics.totalDataSaved++;
      }
    } else {
      this.metrics.totalDataFiltered++;
      
      if (event.reason === 'validation_failed') {
        this.metrics.validationErrors++;
      }
    }

    // Record processing time
    if (event.processingTime) {
      this.metrics.batchProcessingTimes.push(event.processingTime);
      this.metrics.averageProcessingTime = this.calculateAverageProcessingTime();
      this.metrics.peakProcessingTime = Math.max(this.metrics.peakProcessingTime, event.processingTime);
    }

    // Record errors
    if (event.priority === 'critical') {
      this.metrics.criticalErrors++;
      this.metrics.lastError = new Date();
    } else if (event.priority === 'warning') {
      this.metrics.warningErrors++;
    }
  }

  /**
   * Update buffer utilization
   * @param {Object} bufferStats - Buffer statistics
   */
  updateBufferStats(bufferStats) {
    this.metrics.bufferUtilization = bufferStats;
  }

  /**
   * Update memory usage
   * @param {number} memoryUsage - Current memory usage in bytes
   */
  updateMemoryUsage(memoryUsage) {
    this.metrics.memoryUsage = memoryUsage;
    this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, memoryUsage);
  }

  /**
   * Perform health check
   */
  performHealthCheck() {
    const healthStatus = this.assessSystemHealth();
    
    if (healthStatus.status !== 'healthy') {
      this.triggerAlert(healthStatus);
    }

    // Log health status
    console.log(`[MONITORING] System health: ${healthStatus.status}`);
    
    // Clean up old metrics
    this.cleanupOldMetrics();
  }

  /**
   * Assess system health
   * @returns {Object} Health assessment
   */
  assessSystemHealth() {
    const issues = [];
    const warnings = [];

    // Check error rates
    const totalEvents = this.metrics.totalDataReceived;
    if (totalEvents > 0) {
      const errorRate = (this.metrics.validationErrors + this.metrics.criticalErrors) / totalEvents;
      const criticalErrorRate = this.metrics.criticalErrors / totalEvents;
      
      if (errorRate > getConfig('monitoring.ALERT_THRESHOLDS.HIGH_ERROR_RATE')) {
        issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
      }
      
      if (criticalErrorRate > 0.05) { // 5% critical error rate
        issues.push(`High critical error rate: ${(criticalErrorRate * 100).toFixed(2)}%`);
      }
    }

    // Check buffer utilization
    const totalBufferSize = Object.values(this.metrics.bufferUtilization).reduce((sum, size) => sum + size, 0);
    const maxBufferSize = getConfig('buffer.MAX_BUFFER_SIZE') * 3; // 3 priority levels
    const bufferUtilization = totalBufferSize / maxBufferSize;
    
    if (bufferUtilization > getConfig('monitoring.ALERT_THRESHOLDS.HIGH_BUFFER_SIZE')) {
      issues.push(`High buffer utilization: ${(bufferUtilization * 100).toFixed(2)}%`);
    }

    // Check memory usage
    if (this.metrics.memoryUsage > 0) {
      const maxMemory = getConfig('buffer.MAX_MEMORY_USAGE');
      const memoryUtilization = this.metrics.memoryUsage / maxMemory;
      
      if (memoryUtilization > getConfig('monitoring.ALERT_THRESHOLDS.HIGH_MEMORY_USAGE')) {
        issues.push(`High memory usage: ${(memoryUtilization * 100).toFixed(2)}%`);
      }
    }

    // Check processing rate
    const processingRate = this.metrics.totalDataProcessed / Math.max(this.metrics.totalDataReceived, 1);
    if (processingRate < getConfig('monitoring.ALERT_THRESHOLDS.LOW_PROCESSING_RATE')) {
      warnings.push(`Low processing rate: ${(processingRate * 100).toFixed(2)}%`);
    }

    // Check for stale data
    const now = new Date();
    if (this.metrics.lastDataReceived && (now - this.metrics.lastDataReceived) > 10 * 60 * 1000) { // 10 minutes
      warnings.push('No data received in the last 10 minutes');
    }

    return {
      status: issues.length > 0 ? 'unhealthy' : warnings.length > 0 ? 'degraded' : 'healthy',
      issues,
      warnings,
      timestamp: now
    };
  }

  /**
   * Trigger alert
   * @param {Object} healthStatus - Health status
   */
  triggerAlert(healthStatus) {
    const alert = {
      id: `alert_${Date.now()}`,
      type: healthStatus.status === 'unhealthy' ? 'critical' : 'warning',
      message: healthStatus.issues.length > 0 ? healthStatus.issues.join('; ') : healthStatus.warnings.join('; '),
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);
    this.alertHistory.push(alert);

    // Send notifications if enabled
    if (getConfig('notifications.ENABLE_ALERTS')) {
      this.sendAlertNotification(alert);
    }

    console.log(`[MONITORING] Alert triggered: ${alert.message}`);
  }

  /**
   * Send alert notification
   * @param {Object} alert - Alert object
   */
  sendAlertNotification(alert) {
    // Email alerts
    if (getConfig('notifications.EMAIL_ALERTS')) {
      this.sendEmailAlert(alert);
    }

    // Webhook alerts
    if (getConfig('notifications.WEBHOOK_ALERTS')) {
      this.sendWebhookAlert(alert);
    }

    // SMS alerts for critical issues
    if (getConfig('notifications.SMS_ALERTS') && alert.type === 'critical') {
      this.sendSMSAlert(alert);
    }
  }

  /**
   * Send email alert
   * @param {Object} alert - Alert object
   */
  sendEmailAlert(alert) {
    // Implementation would depend on your email service
    console.log(`[MONITORING] Email alert sent: ${alert.message}`);
  }

  /**
   * Send webhook alert
   * @param {Object} alert - Alert object
   */
  sendWebhookAlert(alert) {
    // Implementation would depend on your webhook service
    console.log(`[MONITORING] Webhook alert sent: ${alert.message}`);
  }

  /**
   * Send SMS alert
   * @param {Object} alert - Alert object
   */
  sendSMSAlert(alert) {
    // Implementation would depend on your SMS service
    console.log(`[MONITORING] SMS alert sent: ${alert.message}`);
  }

  /**
   * Calculate average processing time
   * @returns {number} Average processing time in milliseconds
   */
  calculateAverageProcessingTime() {
    if (this.metrics.batchProcessingTimes.length === 0) return 0;
    
    const sum = this.metrics.batchProcessingTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.metrics.batchProcessingTimes.length;
  }

  /**
   * Get system metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.systemStartTime.getTime(),
      isMonitoring: this.isMonitoring
    };
  }

  /**
   * Get active alerts
   * @returns {Array} Active alerts
   */
  getActiveAlerts() {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve alert
   * @param {string} alertId - Alert ID
   */
  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
    }
  }

  /**
   * Get alert history
   * @param {number} limit - Number of alerts to return
   * @returns {Array} Alert history
   */
  getAlertHistory(limit = 100) {
    return this.alertHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clean up old metrics
   */
  cleanupOldMetrics() {
    const retentionDays = getConfig('monitoring.METRICS_RETENTION_DAYS') || 30;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    // Clean up old alerts
    this.alertHistory = this.alertHistory.filter(alert => alert.timestamp > cutoffDate);
    
    // Clean up old processing times (keep last 1000)
    if (this.metrics.batchProcessingTimes.length > 1000) {
      this.metrics.batchProcessingTimes = this.metrics.batchProcessingTimes.slice(-1000);
    }
  }

  /**
   * Generate system report
   * @returns {Object} System report
   */
  generateReport() {
    const healthStatus = this.assessSystemHealth();
    const activeAlerts = this.getActiveAlerts();
    
    return {
      timestamp: new Date(),
      health: healthStatus,
      metrics: this.getMetrics(),
      activeAlerts: activeAlerts.length,
      alertHistory: this.alertHistory.length,
      recommendations: this.generateRecommendations(healthStatus)
    };
  }

  /**
   * Generate system recommendations
   * @param {Object} healthStatus - Health status
   * @returns {Array} Recommendations
   */
  generateRecommendations(healthStatus) {
    const recommendations = [];

    if (healthStatus.issues.includes('High error rate')) {
      recommendations.push('Review data validation rules and hardware connections');
    }

    if (healthStatus.issues.includes('High buffer utilization')) {
      recommendations.push('Consider increasing buffer size or processing frequency');
    }

    if (healthStatus.issues.includes('High memory usage')) {
      recommendations.push('Optimize data structures or increase memory limits');
    }

    if (healthStatus.warnings.includes('Low processing rate')) {
      recommendations.push('Check system performance and database connections');
    }

    if (healthStatus.warnings.includes('No data received')) {
      recommendations.push('Verify hardware connectivity and data sources');
    }

    return recommendations;
  }
}

module.exports = new HybridMonitoringService();

