/**
 * Enhanced GSM Service for COM12 GPRS 800C Module
 * Handles real SMS sending via GSM module with improved error handling
 */

const serialportgsm = require('serialport-gsm');

class GSMService {
  constructor() {
    this.modem = null;
    this.isConnected = false;
    this.isInitialized = false;
    this.port = 'COM12';
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    this.lastError = null;
    this.simStatus = 'unknown';
    this.signalStrength = 0;
    this.options = {
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      rtscts: false,
      xon: false,
      xoff: false,
      xany: false,
      autoDeleteOnReceive: true,
      enableConcatenation: false, // DISABLED - Multi-part SMS fails with Error 325 on this network
      incomingCallIndication: true,
      incomingSMSIndication: true,
      pin: '', // Add SIM PIN here if needed
      customInitCommand: 'AT+CSCA="+639180000101",145', // Globe/TM SMSC (works for roaming Smart SIMs)
      cnmiCommand: 'AT+CNMI=2,1,0,2,1',
      logger: {
        info: (msg) => console.log('[GSM INFO]', msg),
        error: (msg) => console.error('[GSM ERROR]', msg),
        warn: (msg) => console.warn('[GSM WARN]', msg),
        debug: (msg) => console.log('[GSM DEBUG]', msg)
      }
    };
  }

  /**
   * Initialize GSM service with enhanced error handling
   */
  async initialize() {
    try {
      console.log('[GSM SERVICE] Initializing GSM service...');
      
      this.modem = serialportgsm.Modem();
      
      // Set up comprehensive event handlers
      this.modem.on('error', (error) => {
        console.error('[GSM SERVICE] Modem error:', error);
        this.isConnected = false;
        this.lastError = error.message;
        this.connectionAttempts++;
      });

      this.modem.on('open', (data) => {
        console.log('[GSM SERVICE] Port opened successfully');
        this.isConnected = true;
        this.connectionAttempts = 0;
        this.lastError = null;
        // Initialize modem asynchronously to prevent blocking
        setTimeout(() => this.initializeModem(), 2000);
      });

      this.modem.on('close', () => {
        console.log('[GSM SERVICE] Port closed');
        this.isConnected = false;
        this.isInitialized = false;
      });

      // Connect to COM12 with retry mechanism
      await this.connectWithRetry();
      
      console.log('[GSM SERVICE] GSM service initialized');
    } catch (error) {
      console.error('[GSM SERVICE] Failed to initialize GSM service:', error);
      this.lastError = error.message;
      console.log('[GSM SERVICE] ⚠️ GSM module not available - SMS will use fallback mode');
      // Don't throw error to prevent server crash
    }
  }

  /**
   * Connect to GSM module with retry mechanism
   */
  async connectWithRetry() {
    for (let attempt = 1; attempt <= this.maxConnectionAttempts; attempt++) {
      try {
        console.log(`[GSM SERVICE] Connection attempt ${attempt}/${this.maxConnectionAttempts} to ${this.port}...`);
        await this.connect();
        return; // Success
      } catch (error) {
        console.error(`[GSM SERVICE] Connection attempt ${attempt} failed:`, error.message);
        this.connectionAttempts = attempt;
        this.lastError = error.message;
        
        if (attempt < this.maxConnectionAttempts) {
          console.log(`[GSM SERVICE] Retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    
    console.log(`[GSM SERVICE] All connection attempts failed. GSM module not available.`);
    throw new Error(`Failed to connect to GSM module after ${this.maxConnectionAttempts} attempts`);
  }

  /**
   * Connect to GSM module
   */
  async connect() {
    return new Promise((resolve, reject) => {
      console.log(`[GSM SERVICE] Attempting to connect to ${this.port}...`);
      
      this.modem.open(this.port, this.options, (error) => {
        if (error) {
          console.error(`[GSM SERVICE] Connection failed:`, error);
          this.isConnected = false;
          this.lastError = error.message;
          reject(error);
        } else {
          console.log(`[GSM SERVICE] Successfully connected to ${this.port}`);
          this.isConnected = true;
          this.lastError = null;
          resolve();
        }
      });
    });
  }

  /**
   * Initialize the modem with enhanced error handling
   */
  initializeModem() {
    if (!this.modem) {
      console.error('[GSM SERVICE] Modem not available');
      return;
    }

    console.log('[GSM SERVICE] Initializing modem...');
    this.modem.initializeModem((result) => {
      if (!result || result.status !== 'success') {
        console.error('[GSM SERVICE] Error initializing modem:', result);
        console.log('[GSM SERVICE] Check SIM card insertion and network signal');
        this.isInitialized = false;
        this.lastError = result.message || 'Modem initialization failed';
        return;
      }
      
      console.log('[GSM SERVICE] Modem initialized successfully');
      this.isInitialized = true;
      this.lastError = null;
      
      // Test SIM card status and signal strength
      this.checkSIMStatus();
      this.checkSignalStrength();
    });
  }

  /**
   * Check SIM card status with enhanced reporting
   */
  checkSIMStatus() {
    if (!this.modem) return;
    
    console.log('[GSM SERVICE] Checking SIM card status...');
    this.modem.executeCommand('AT+CPIN?', (result) => {
      if (result && result.status === 'success') {
        console.log('[GSM SERVICE] SIM card is ready');
        this.simStatus = 'ready';
      } else {
        console.error('[GSM SERVICE] SIM card issue - check insertion and PIN');
        console.log('[GSM SERVICE] Make sure SIM card is properly inserted and has credit');
        this.simStatus = 'error';
        this.lastError = 'SIM card not ready';
      }
    });
  }

  /**
   * Check signal strength
   */
  checkSignalStrength() {
    if (!this.modem) return;
    
    console.log('[GSM SERVICE] Checking signal strength...');
    this.modem.executeCommand('AT+CSQ', (result) => {
      if (result && result.status === 'success') {
        // Parse signal strength from result
        const resultData = result.data || result.message || '';
        const dataStr = typeof resultData === 'string' ? resultData : JSON.stringify(resultData);
        const signalMatch = dataStr.match(/(\d+),/);
        if (signalMatch) {
          this.signalStrength = parseInt(signalMatch[1]);
          console.log(`[GSM SERVICE] Signal strength: ${this.signalStrength}/31 (0-31 scale)`);
        }
      } else {
        console.warn('[GSM SERVICE] Could not get signal strength');
        this.signalStrength = 0;
      }
    });
  }

  /**
   * Format phone number for international SMS
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming Philippines +63)
    if (cleaned.length === 10 && cleaned.startsWith('9')) {
      cleaned = '63' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('09')) {
      cleaned = '63' + cleaned.substring(1);
    }
    
    // Ensure it starts with +
    return '+' + cleaned;
  }

  /**
   * Send SMS via GSM module with enhanced error handling
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message content
   * @returns {Promise<Object>} SMS send result
   */
  async sendSMS(phoneNumber, message) {
    return new Promise((resolve, reject) => {
      if (!this.modem || !this.isConnected || !this.isInitialized) {
        const error = new Error('GSM module not connected or initialized');
        console.error('[GSM SERVICE]', error.message);
        reject(error);
        return;
      }

      // Format phone number
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      console.log(`[GSM SERVICE] Sending SMS to ${formattedNumber} (original: ${phoneNumber})...`);
      console.log(`[GSM SERVICE] Message: ${message}`);

      // Check message length (SMS limit is 160 characters for single SMS)
      if (message.length > 160) {
        console.warn(`[GSM SERVICE] Message length (${message.length}) exceeds single SMS limit (160)`);
      }

      this.modem.sendSMS(formattedNumber, message, true, (result) => {
        console.log('[GSM SERVICE] SMS send result:', result);
        
        if (result && result.status === 'success') {
          console.log('[GSM SERVICE] SMS sent successfully via GSM module');
          resolve({
            success: true,
            status: 'success',
            method: 'gsm_module',
            messageId: result.messageId || `gsm_${Date.now()}`,
            timestamp: new Date().toISOString(),
            phoneNumber: formattedNumber,
            originalNumber: phoneNumber,
            messageLength: message.length
          });
        } else {
          const error = new Error(result.message || 'SMS sending failed');
          console.error('[GSM SERVICE] SMS failed:', error.message);
          this.lastError = error.message;
          reject(error);
        }
      });
    });
  }

  /**
   * Send SMS with fallback (retry mechanism)
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message content
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise<Object>} SMS send result
   */
  async sendSMSWithFallback(phoneNumber, message, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[GSM SERVICE] SMS attempt ${attempt}/${maxRetries}`);
        
        // Try to reconnect if not connected
        if (!this.isConnected) {
          console.log('[GSM SERVICE] Reconnecting to GSM module...');
          await this.connect();
          await this.waitForInitialization();
        }
        
        const result = await this.sendSMS(phoneNumber, message);
        return result;
        
      } catch (error) {
        lastError = error;
        console.error(`[GSM SERVICE] Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          console.log(`[GSM SERVICE] Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // All attempts failed, return error
    return {
      success: false,
      error: lastError.message,
      status: 'failed',
      method: 'gsm_module_fallback',
      timestamp: new Date().toISOString(),
      phoneNumber: phoneNumber
    };
  }

  /**
   * Wait for modem initialization
   */
  async waitForInitialization(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkInitialization = () => {
        if (this.isInitialized) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Modem initialization timeout'));
        } else {
          setTimeout(checkInitialization, 100);
        }
      };
      
      checkInitialization();
    });
  }

  /**
   * Get GSM service status with enhanced information
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      serviceName: 'GSM Service',
      port: this.port,
      isConnected: this.isConnected,
      isInitialized: this.isInitialized,
      modemExists: !!this.modem,
      simStatus: this.simStatus,
      signalStrength: this.signalStrength,
      connectionAttempts: this.connectionAttempts,
      maxConnectionAttempts: this.maxConnectionAttempts,
      lastError: this.lastError,
      timestamp: new Date().toISOString(),
      healthStatus: this.isConnected && this.isInitialized && this.simStatus === 'ready' ? 'healthy' : 'unhealthy'
    };
  }

  /**
   * Test GSM connection with comprehensive checks
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      const status = this.getStatus();
      
      if (!status.isConnected) {
        return {
          success: false,
          message: 'GSM module not connected',
          status: status,
          recommendations: [
            'Check if GSM module is connected to COM12',
            'Verify GSM module is powered on',
            'Check USB/Serial cable connection'
          ]
        };
      }
      
      if (!status.isInitialized) {
        return {
          success: false,
          message: 'GSM module not initialized',
          status: status,
          recommendations: [
            'Wait for modem initialization to complete',
            'Check if SIM card is properly inserted',
            'Verify SIM card has network signal'
          ]
        };
      }

      if (status.simStatus !== 'ready') {
        return {
          success: false,
          message: 'SIM card not ready',
          status: status,
          recommendations: [
            'Check SIM card insertion',
            'Verify SIM card has credit',
            'Check if SIM card is locked with PIN'
          ]
        };
      }

      if (status.signalStrength < 5) {
        return {
          success: true,
          message: 'GSM module is ready but signal is weak',
          status: status,
          warnings: [
            'Signal strength is low - SMS may fail',
            'Try moving GSM module to a location with better signal'
          ]
        };
      }
      
      return {
        success: true,
        message: 'GSM module is ready and healthy',
        status: status,
        signalQuality: status.signalStrength > 15 ? 'excellent' : status.signalStrength > 10 ? 'good' : 'fair'
      };
      
    } catch (error) {
      return {
        success: false,
        message: error.message,
        status: this.getStatus(),
        recommendations: [
          'Check GSM module connection',
          'Restart the GSM test server',
          'Verify COM12 port is available'
        ]
      };
    }
  }

  /**
   * Close GSM connection
   */
  close() {
    if (this.modem && this.isConnected) {
      this.modem.close();
      this.isConnected = false;
      this.isInitialized = false;
      console.log('[GSM SERVICE] GSM connection closed');
    }
  }
}

// Export singleton instance
module.exports = new GSMService();
