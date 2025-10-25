/**
 * Bin Connection Monitor Service
 * Monitors bin connections and logs connection errors to bin history
 */

const { rtdb, db: firestoreDb } = require('../models/firebase');
const binHistoryModel = require('../models/binHistoryModel');
const hybridDataService = require('./hybridDataService');

class BinConnectionMonitor {
  constructor() {
    this.connectionTimeout = 5 * 60 * 1000; // 5 minutes timeout
    this.checkInterval = 2 * 60 * 1000; // Check every 2 minutes
    this.lastSeen = new Map(); // Track last seen time for each bin
    this.connectionStatus = new Map(); // Track connection status
    this.isRunning = false;
    this.timer = null;
    
    // Error types for connection issues
    this.CONNECTION_ERRORS = {
      TIMEOUT: 'CONNECTION_TIMEOUT',
      OFFLINE: 'BIN_OFFLINE', 
      LOST_SIGNAL: 'SIGNAL_LOST',
      POWER_FAILURE: 'POWER_FAILURE',
      COMMUNICATION_ERROR: 'COMMUNICATION_ERROR'
    };

    // Per-bin state machine and historical indicators
    // binId -> { state, lastScore, suspectedCount, offlineCount, lastUptime, lastMsgSeq, lastCheck }
    this.binState = new Map();
  }

  /**
   * Start monitoring bin connections
   */
  startMonitoring() {
    if (this.isRunning) {
      console.log('[CONNECTION MONITOR] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[CONNECTION MONITOR] Starting bin connection monitoring...');
    
    // Check connections every 2 minutes
    this.timer = setInterval(() => {
      this.checkAllBinConnections();
    }, this.checkInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[CONNECTION MONITOR] Stopped monitoring');
  }

  /**
   * Check all bin connections
   */
  async checkAllBinConnections() {
    try {
      console.log('[CONNECTION MONITOR] Checking all bin connections...');
      
      // Get all bins from Firebase
      const bins = await this.getAllBins();
      
      for (const binId of bins) {
        await this.checkBinConnection(binId);
      }
      
    } catch (error) {
      console.error('[CONNECTION MONITOR] Error checking connections:', error);
    }
  }

  /**
   * Get all bin IDs from Firebase
   */
  async getAllBins() {
    try {
      const monitoringRef = rtdb.ref('monitoring');
      const snapshot = await monitoringRef.once('value');
      const data = snapshot.val();
      
      if (!data) return [];
      
      return Object.keys(data).filter(key => key !== 'backup');
    } catch (error) {
      console.error('[CONNECTION MONITOR] Error getting bins:', error);
      return [];
    }
  }

  /**
   * Check connection for a specific bin
   */
  async checkBinConnection(binId) {
    try {
      const binRef = rtdb.ref(`monitoring/${binId}`);
      const snapshot = await binRef.once('value');
      const data = snapshot.val();
      
      if (!data) {
        await this.handleBinOffline(binId, 'No data found');
        return;
      }

      const now = new Date();
      const lastUpdate = this.getLastUpdateTime(data);
      const timeSinceUpdate = now.getTime() - lastUpdate.getTime();

      // Compute an online score (0-100) from multiple indicators
      const prev = this.binState.get(binId) || {};
      const score = this.computeOnlineScore(data, timeSinceUpdate, prev);

      // Update state machine with hysteresis
      const nextState = { ...prev };
      nextState.lastScore = score;
      nextState.lastCheck = now;

      // Determine state based on score bands
      // >=60 -> online, 30-59 -> suspected, <30 -> offline candidate
      if (score >= 60) {
        nextState.state = 'online';
        nextState.suspectedCount = 0;
        nextState.offlineCount = 0;
      } else if (score >= 30) {
        nextState.state = nextState.state === 'offline' ? 'offline' : 'suspected';
        nextState.suspectedCount = (nextState.suspectedCount || 0) + 1;
        nextState.offlineCount = 0;
      } else {
        nextState.offlineCount = (nextState.offlineCount || 0) + 1;
        // Require at least 2 consecutive low-score checks to declare offline
        if (nextState.offlineCount >= 2) {
          nextState.state = 'offline';
        } else {
          nextState.state = 'suspected';
        }
      }

      // Maintain auxiliary lastSeen and connectionStatus for backwards compatibility
      if (nextState.state === 'online') {
        this.lastSeen.set(binId, now);
        this.updateConnectionStatus(binId, 'online');
      } else if (nextState.state === 'offline') {
        this.updateConnectionStatus(binId, 'offline');
      } else {
        this.updateConnectionStatus(binId, 'suspected');
      }

      // On transition to offline from not-offline, log once
      const transitionedToOffline = prev.state !== 'offline' && nextState.state === 'offline';
      if (transitionedToOffline) {
        const reason = this.buildOfflineReason(data, timeSinceUpdate, score);
        await this.handleBinOffline(binId, reason);
      }

      // Save rolling indicators
      nextState.lastUptime = this.extractUptime(data) || nextState.lastUptime;
      nextState.lastMsgSeq = this.extractMsgSeq(data) ?? nextState.lastMsgSeq;
      this.binState.set(binId, nextState);
      
    } catch (error) {
      console.error(`[CONNECTION MONITOR] Error checking bin ${binId}:`, error);
      await this.handleBinOffline(binId, `Connection error: ${error.message}`);
    }
  }

  /**
   * Compute an online score 0-100 using multiple indicators
   */
  computeOnlineScore(data, timeSinceUpdate, prev = {}) {
    let score = 0;

    // Heartbeat freshness
    if (timeSinceUpdate <= 2 * 60 * 1000) score += 40; // very fresh
    else if (timeSinceUpdate <= this.connectionTimeout) score += 20; // acceptable

    // GPS/position health (non-critical but supportive)
    const satellites = parseInt(data?.satellites || 0, 10) || 0;
    if (satellites >= 3) score += 10;
    if (data?.gps_valid === true || data?.gpsValid === true) score += 5;

    // Radio metrics (optional fields)
    const csq = parseInt(data?.csq, 10);
    if (!isNaN(csq)) {
      if (csq >= 10) score += 10; else if (csq >= 5) score += 5;
    }

    const reg = parseInt(data?.creg || data?.cereg || data?.cgreg, 10);
    if ([1, 5].includes(reg)) score += 15;

    const pdp = (data?.pdpActive ?? data?.pdp_active ?? data?.pdp) === true;
    if (pdp) score += 10;

    // Uptime progressing implies device alive
    const uptime = this.extractUptime(data);
    if (!isNaN(uptime) && !isNaN(prev.lastUptime)) {
      if (uptime > prev.lastUptime + 60) score += 10; // progressed at least 60s
    }

    // Message sequence monotonicity
    const seq = this.extractMsgSeq(data);
    if (!isNaN(seq) && !isNaN(prev.lastMsgSeq)) {
      if (seq > prev.lastMsgSeq) score += 5; else if (seq === prev.lastMsgSeq) score -= 10;
    }

    // Clamp
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    return score;
  }

  extractUptime(data) {
    const raw = data?.uptimeSec ?? data?.uptime_sec ?? data?.uptime;
    const val = parseInt(raw, 10);
    return isNaN(val) ? NaN : val;
  }

  extractMsgSeq(data) {
    const raw = data?.msgSeq ?? data?.seq ?? data?.message_seq;
    const val = parseInt(raw, 10);
    return isNaN(val) ? NaN : val;
  }

  buildOfflineReason(data, timeSinceUpdate, score) {
    const parts = [];
    parts.push(`No updates for ${Math.round(timeSinceUpdate / 60000)}m`);
    const csq = parseInt(data?.csq, 10);
    if (!isNaN(csq)) parts.push(`CSQ=${csq}`);
    const reg = parseInt(data?.creg || data?.cereg || data?.cgreg, 10);
    if (!isNaN(reg)) parts.push(`REG=${reg}`);
    const sats = parseInt(data?.satellites || 0, 10) || 0;
    parts.push(`SAT=${sats}`);
    parts.push(`SCORE=${score}`);
    return parts.join(', ');
  }

  /**
   * Handle bin going offline
   */
  async handleBinOffline(binId, reason) {
    const now = new Date();
    const lastSeen = this.lastSeen.get(binId);
    
    // Check if this is a new offline event (not already logged)
    const wasOnline = this.connectionStatus.get(binId) === 'online';
    
    if (wasOnline || !this.connectionStatus.has(binId)) {
      console.log(`[CONNECTION MONITOR] Bin ${binId} went offline: ${reason}`);
      
      // Log connection error to bin history
      await this.logConnectionError(binId, this.CONNECTION_ERRORS.OFFLINE, reason);

      // Notify staff users (dedup once per bin per day)
      try {
        const todayKey = new Date().toISOString().slice(0, 10);
        const notifyKey = `${binId}_offline_${todayKey}`;
        this._offlineNotifyCache = this._offlineNotifyCache || new Set();
        if (!this._offlineNotifyCache.has(notifyKey)) {
          await this.notifyStaffOffline(binId, reason);
          this._offlineNotifyCache.add(notifyKey);
        }
      } catch (notifyErr) {
        console.error('[CONNECTION MONITOR] Failed to notify staff of offline bin:', notifyErr);
      }
      
      // Update status
      this.connectionStatus.set(binId, 'offline');
    }
  }

  /**
   * Notify all staff/supervisor users that a bin went offline
   */
  async notifyStaffOffline(binId, reason) {
    try {
      // Fetch staff users from Firestore
      const staffSnapshot = await firestoreDb
        .collection('users')
        .where('role', 'in', ['staff', 'supervisor', 'admin'])
        .get();

      if (staffSnapshot.empty) {
        console.log('[CONNECTION MONITOR] No staff users to notify');
        return;
      }

      const title = 'Bin Offline';
      const message = `Bin ${binId} appears offline: ${reason}`;
      const notificationData = {
        type: 'bin_offline',
        title,
        message,
        severity: 'high',
        binId,
        reason,
        timestamp: Date.now(),
        read: false,
        createdAt: new Date().toISOString()
      };

      const promises = [];
      staffSnapshot.forEach((doc) => {
        promises.push(
          rtdb
            .ref(`notifications/${doc.id}`)
            .push(notificationData)
            .catch((err) => console.error(`[CONNECTION MONITOR] notify push failed for ${doc.id}:`, err))
        );
      });

      await Promise.all(promises);
      console.log(`[CONNECTION MONITOR] Sent offline notifications for ${binId} to ${staffSnapshot.size} staff users`);
    } catch (error) {
      console.error('[CONNECTION MONITOR] Error sending offline notifications:', error);
    }
  }

  /**
   * Log connection error to bin history
   */
  async logConnectionError(binId, errorType, reason) {
    try {
      const errorData = {
        binId,
        weight: 0,
        distance: 0,
        binLevel: 0,
        gps: { lat: 0, lng: 0 },
        gpsValid: false,
        satellites: 0,
        errorMessage: `${errorType}: ${reason}`,
        status: 'CONNECTION_ERROR',
        timestamp: new Date(),
        createdAt: new Date()
      };

      // Process through hybrid data service to respect rate limits
      const result = await hybridDataService.processIncomingData(errorData);
      
      if (result.success) {
        console.log(`[CONNECTION MONITOR] Logged connection error for bin ${binId}: ${errorType}`);
      } else {
        console.log(`[CONNECTION MONITOR] Connection error filtered for bin ${binId}: ${result.reason}`);
      }
      
    } catch (error) {
      console.error(`[CONNECTION MONITOR] Error logging connection error for bin ${binId}:`, error);
    }
  }

  /**
   * Get last update time from bin data
   */
  getLastUpdateTime(data) {
    // Try different timestamp fields
    const timestampFields = ['timestamp', 'last_active', 'gps_timestamp', 'created_at'];
    
    for (const field of timestampFields) {
      if (data[field]) {
        const timestamp = new Date(data[field]);
        if (!isNaN(timestamp.getTime())) {
          return timestamp;
        }
      }
    }
    
    // If no valid timestamp found, assume very old
    return new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  }

  /**
   * Update connection status
   */
  updateConnectionStatus(binId, status) {
    this.connectionStatus.set(binId, status);
  }

  /**
   * Get connection status for a bin
   */
  getConnectionStatus(binId) {
    return {
      status: this.connectionStatus.get(binId) || 'unknown',
      lastSeen: this.lastSeen.get(binId),
      isOnline: this.connectionStatus.get(binId) === 'online',
      state: this.binState.get(binId)?.state,
      score: this.binState.get(binId)?.lastScore
    };
  }

  /**
   * Get all connection statuses
   */
  getAllConnectionStatuses() {
    const statuses = {};
    for (const [binId, status] of this.connectionStatus.entries()) {
      statuses[binId] = {
        status,
        lastSeen: this.lastSeen.get(binId),
        isOnline: status === 'online',
        state: this.binState.get(binId)?.state,
        score: this.binState.get(binId)?.lastScore
      };
    }
    return statuses;
  }

  /**
   * Manually trigger connection check for a specific bin
   */
  async triggerConnectionCheck(binId) {
    console.log(`[CONNECTION MONITOR] Manual connection check for bin ${binId}`);
    await this.checkBinConnection(binId);
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    const totalBins = this.connectionStatus.size;
    const onlineBins = Array.from(this.connectionStatus.values()).filter(status => status === 'online').length;
    const offlineBins = totalBins - onlineBins;
    
    return {
      totalBins,
      onlineBins,
      offlineBins,
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      connectionTimeout: this.connectionTimeout
    };
  }
}

module.exports = new BinConnectionMonitor();
