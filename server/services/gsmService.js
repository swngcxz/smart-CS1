/**
 * GSM Service for COM12 GPRS 800C Module
 * Handles real SMS sending via GSM module
 */

const serialportgsm = require('serialport-gsm');

class GSMService {
  constructor() {
    this.modem = null;
    this.isConnected = false;
    this.isInitialized = false;
    this.port = 'COM12';
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
      enableConcatenation: true,
      incomingCallIndication: true,
      incomingSMSIndication: true,
      pin: '', // Add SIM PIN here if needed
      customInitCommand: '',
      cnmiCommand: 'AT+CNMI=2,1,0,2,1',
      logger: {
        info: () => {}, // Disable verbose logging
        error: (msg) => console.error('[GSM]', msg),
        warn: (msg) => console.warn('[GSM]', msg),
        debug: () => {} // Disable debug logging
      }
    };
  }

  /**
   * Initialize GSM service
   */
  async initialize() {
    try {
      console.log('[GSM SERVICE] Initializing GSM service...');
      
      this.modem = serialportgsm.Modem();
      
      // Set up event handlers
      this.modem.on('error', (error) => {
        console.error('[GSM SERVICE] Modem error:', error);
        this.isConnected = false;
      });

      this.modem.on('open', (data) => {
        console.log('[GSM SERVICE] Port opened successfully');
        this.isConnected = true;
        // Initialize modem asynchronously to prevent blocking
        setTimeout(() => this.initializeModem(), 1000);
      });

      // Connect to COM12 (non-blocking)
      this.connect().catch(error => {
        console.error('[GSM SERVICE] Connection failed:', error);
        console.log('[GSM SERVICE] ⚠️ GSM module not available - SMS will use fallback mode');
      });
      
      console.log('[GSM SERVICE] ✅ GSM service initialized (async)');
    } catch (error) {
      console.error('[GSM SERVICE] ❌ Failed to initialize GSM service:', error);
      // Don't throw error to prevent server crash
      console.log('[GSM SERVICE] ⚠️ Continuing without GSM module');
    }
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
          reject(error);
        } else {
          console.log(`[GSM SERVICE] ✅ Successfully connected to ${this.port}`);
          this.isConnected = true;
          resolve();
        }
      });
    });
  }

  /**
   * Initialize the modem
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
        console.log('[GSM SERVICE] ⚠️ Check SIM card insertion and network signal');
        this.isInitialized = false;
        return;
      }
      
      console.log('[GSM SERVICE] ✅ Modem initialized successfully');
      this.isInitialized = true;
      
      // Test SIM card status
      this.checkSIMStatus();
    });
  }

  /**
   * Check SIM card status
   */
  checkSIMStatus() {
    if (!this.modem) return;
    
    console.log('[GSM SERVICE] Checking SIM card status...');
    this.modem.executeCommand('AT+CPIN?', (result) => {
      if (result && result.status === 'success') {
        console.log('[GSM SERVICE] ✅ SIM card is ready');
      } else {
        console.error('[GSM SERVICE] ❌ SIM card issue - check insertion and PIN');
        console.log('[GSM SERVICE] 💡 Make sure SIM card is properly inserted and has credit');
      }
    });
  }

  /**
   * Send SMS via GSM module
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

      console.log(`[GSM SERVICE] Sending SMS to ${phoneNumber}...`);
      console.log(`[GSM SERVICE] Message: ${message}`);

      this.modem.sendSMS(phoneNumber, message, true, (result) => {
        console.log('[GSM SERVICE] SMS send result:', result);
        
        if (result && result.status === 'success') {
          console.log('[GSM SERVICE] ✅ SMS sent successfully via GSM module');
          resolve({
            success: true,
            status: 'success',
            method: 'gsm_module',
            messageId: result.messageId || `gsm_${Date.now()}`,
            timestamp: new Date().toISOString(),
            phoneNumber: phoneNumber
          });
        } else {
          const error = new Error(result.message || 'SMS sending failed');
          console.error('[GSM SERVICE] ❌ SMS failed:', error.message);
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
   * Get GSM service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      serviceName: 'GSM Service',
      port: this.port,
      isConnected: this.isConnected,
      isInitialized: this.isInitialized,
      modemExists: !!this.modem,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test GSM connection
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      const status = this.getStatus();
      
      if (!status.isConnected) {
        return {
          success: false,
          message: 'GSM module not connected',
          status: status
        };
      }
      
      if (!status.isInitialized) {
        return {
          success: false,
          message: 'GSM module not initialized',
          status: status
        };
      }
      
      return {
        success: true,
        message: 'GSM module is ready',
        status: status
      };
      
    } catch (error) {
      return {
        success: false,
        message: error.message,
        status: this.getStatus()
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
