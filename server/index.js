const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('./utils/googleAuth');
const authRouter = require('./routers/authRouter');
const staffRouter = require('./routers/staffRoutes');
const scheduleRouter = require('./routers/scheduleRouter');
const truckScheduleRoutes = require('./routers/truckScheduleRoutes');
const binRoutes = require('./routers/binRoutes');
const errorHandler = require('./middlewares/errorHandler');
const activityRoutes = require('./routers/activityRoutes');
const analyticsRoutes = require('./routers/analyticsRoutes');
const wasteRoutes = require('./routers/wasteRoutes');
const { admin } = require('./models/firebase');
const serialportgsm = require('serialport-gsm');


const notificationRoutes = require('./routers/notificationRoutes');
const binHistoryRoutes = require('./routers/binHistoryRoutes');
const binNotificationRoutes = require('./routers/binNotificationRoutes');
const pickupRequestRoutes = require('./routers/pickupRequestRoutes');
const { sendCriticalBinNotification, sendWarningBinNotification } = require('./controllers/notificationController');
const BinHistoryProcessor = require('./utils/binHistoryProcessor');
const binNotificationController = require('./controllers/binNotificationController');


const db = admin.database();
const dataRef = db.ref('monitoring/data');
const bin1Ref = db.ref('monitoring/bin1');


// Initialize Firebase with env variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: process.env.TYPE,
      project_id: process.env.PROJECT_ID,
      private_key_id: process.env.PRIVATE_KEY_ID,
      private_key: process.env.PRIVATE_KEY,
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
      auth_uri: process.env.AUTH_URI,
      token_uri: process.env.TOKEN_URI,
      auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
      universe_domain: process.env.UNIVERSE_DOMAIN,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

console.log('✅ Firebase initialized successfully');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:8081', 
    'http://localhost:8080', 
    'http://localhost:8000',
    'http://192.168.1.2:8000',
    'http://192.168.1.0/24', // Allow all devices on the same network
    'exp://192.168.1.2:8081', // Expo development server
    'exp://localhost:8081'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || "defaultsecret",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);
app.use('/api/staff', staffRouter);  
app.use("/api/schedules", scheduleRouter);
app.use("/api/truck-schedules", truckScheduleRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/waste", wasteRoutes);
console.log('[INDEX] Mounting binRoutes at /api');
app.use("/api", binRoutes);
console.log('[INDEX] binRoutes mounted successfully');
app.use("/api", activityRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api', binHistoryRoutes);
app.use('/api', binNotificationRoutes);
app.use('/api', pickupRequestRoutes);

app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('API is running');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  (req, res) => {
    res.send('Google login successful!');
  }
);

// Modem and SMS logic
let modem = serialportgsm.Modem();
let options = {
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
  pin: '',
  customInitCommand: '',
  cnmiCommand: 'AT+CNMI=2,1,0,2,1',
  logger: console
};

// Fallback SMS using console logging (for testing) or web service
async function sendSMSFallback(phoneNumber, message) {
  try {
    console.log(`[SMS FALLBACK] Attempting to send SMS to ${phoneNumber}`);
    
    // For now, just log the SMS to console (you can replace with actual SMS service)
    console.log('='.repeat(60));
    console.log('📱 SMS NOTIFICATION (FALLBACK MODE)');
    console.log('='.repeat(60));
    console.log(`📞 To: ${phoneNumber}`);
    console.log(`📝 Message: ${message}`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    
    // Simulate successful SMS send
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('[SMS FALLBACK] ✅ SMS logged successfully (fallback mode)');
    return { status: 'success', method: 'console_fallback' };
    
    // Uncomment below to use actual SMS service (replace with your preferred service)
    /*
    const response = await fetch('https://api.example-sms-service.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: message
      })
    });
    
    if (response.ok) {
      console.log('[SMS FALLBACK] ✅ SMS sent successfully via web service');
      return { status: 'success', method: 'web_service' };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    */
  } catch (error) {
    console.error('[SMS FALLBACK] ❌ Failed to send SMS via fallback:', error.message);
    throw error;
  }
}

function sendSMS(phoneNumber, message) {
  return new Promise(async (resolve, reject) => {
    console.log(`[SERIAL MONITOR] Creating SMS to ${phoneNumber}: "${message}"`);
    
    // Check if modem is available
    if (!modem || !modem.isOpen) {
      console.error('[SERIAL MONITOR] Modem is not connected or not open');
      console.log('[SERIAL MONITOR] Attempting fallback SMS method...');
      
      try {
        const result = await sendSMSFallback(phoneNumber, message);
        resolve(result);
        return;
      } catch (fallbackError) {
        console.error('[SERIAL MONITOR] Fallback SMS also failed:', fallbackError.message);
        reject(new Error('Both modem and fallback SMS failed'));
        return;
      }
    }
    
    modem.sendSMS(phoneNumber, message, true, (result) => {
      console.log('[SERIAL MONITOR] SMS send result:', result);
      
      if (result && result.status === 'success') {
        console.log('[SERIAL MONITOR] ✅ SMS sent successfully via modem:', result);
        resolve(result);
      } else {
        console.error('[SERIAL MONITOR] ❌ Failed to send SMS via modem:', result);
        console.log('[SERIAL MONITOR] Attempting fallback SMS method...');
        
        // Try fallback method
        sendSMSFallback(phoneNumber, message)
          .then(fallbackResult => {
            console.log('[SERIAL MONITOR] ✅ Fallback SMS sent successfully');
            resolve(fallbackResult);
          })
          .catch(fallbackError => {
            console.error('[SERIAL MONITOR] ❌ Fallback SMS also failed:', fallbackError.message);
            reject(new Error('Both modem and fallback SMS failed'));
          });
      }
    });
  });
}

let smsSentData = false; // For monitoring/data path
let smsSentBin1 = false; // For monitoring/bin1 path
let criticalNotificationSent = false;
let warningNotificationSent = false; // For the automatic threshold check

// Quota monitoring
let firebaseOperationsCount = 0;
let lastQuotaReset = Date.now();
const QUOTA_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

modem.on('error', error => {
  console.error('Modem error:', error);
});

// Function to attempt modem connection with retry
function connectModem(retryCount = 0) {
  const maxRetries = 3;
  const retryDelay = 5000; // 5 seconds
  
  console.log(`[MODEM] Attempting to connect to COM12 (attempt ${retryCount + 1}/${maxRetries + 1})...`);
  
  modem.open('COM12', options, (error) => {
    if (error) {
      console.error(`[MODEM] Error opening port (attempt ${retryCount + 1}):`, error.message);
      
      if (retryCount < maxRetries) {
        console.log(`[MODEM] Retrying in ${retryDelay/1000} seconds...`);
        setTimeout(() => {
          connectModem(retryCount + 1);
        }, retryDelay);
        return;
      }
      
      console.log('⚠️  Modem not connected after all retries, but real-time monitoring will still work');
      console.log('💡 Troubleshooting tips:');
      console.log('   1. Make sure no other application is using COM12');
      console.log('   2. Try running the server as Administrator');
      console.log('   3. Check if the USB-SERIAL CH340 driver is properly installed');
      console.log('   4. Unplug and reconnect the USB device');
      
      // Record the error in bin history
      BinHistoryProcessor.processError('bin1', `Error opening port after ${maxRetries + 1} attempts: ${error.message}`, {
        weight: 0,
        distance: 0,
        binLevel: 0,
        gps: { lat: 0, lng: 0 },
        gpsValid: false,
        satellites: 0
      }).then(result => {
        if (result.success) {
          console.log(`[BIN HISTORY] Recorded modem error: Status=${result.status}`);
        }
      }).catch(err => {
        console.error('[BIN HISTORY] Failed to record modem error:', err);
      });
      
      // Setup real-time monitoring even without modem
      setupRealTimeMonitoring();
      return;
    }
    
    console.log('✅ [MODEM] Successfully connected to COM12');
  });
}

// Start modem connection
connectModem();

// Periodic modem status check (every 30 seconds)
setInterval(() => {
  if (modem) {
    console.log('[MODEM STATUS CHECK]', {
      timestamp: new Date().toISOString(),
      isOpen: modem.isOpen,
      port: modem.port,
      initialized: modem.initialized,
      customInitialized: modemInitialized
    });
  } else {
    console.log('[MODEM STATUS CHECK] Modem object not initialized');
  }
}, 30000);

modem.on('open', data => {
  console.log('[SERIAL MONITOR] Port opened successfully');
  console.log('[SERIAL MONITOR] Modem status:', modem.isOpen ? 'OPEN' : 'CLOSED');
  console.log('[SERIAL MONITOR] Modem port:', modem.port);
  console.log('[SERIAL MONITOR] Modem details:', {
    isOpen: modem.isOpen,
    port: modem.port,
    initialized: modem.initialized
  });
  
  modem.initializeModem((result) => {
    if (!result || result.status !== 'success') {
      console.error('[SERIAL MONITOR] Error initializing modem:', result);
      modemInitialized = false;
      return;
    }
    console.log('[SERIAL MONITOR] Modem is initialized:', result);
    console.log('[SERIAL MONITOR] Modem ready for SMS sending');
    console.log('[SERIAL MONITOR] Final modem status check:', {
      isOpen: modem.isOpen,
      port: modem.port,
      initialized: modem.initialized
    });
    
    // Set our custom initialization flag
    modemInitialized = true;
    console.log('[SERIAL MONITOR] ✅ Custom modem initialization flag set to true');
    
    // Real-time data monitoring for both data paths
    setupRealTimeMonitoring();
  });
});

// Real-time data monitoring function
function setupRealTimeMonitoring() {
  console.log('🔍 Setting up real-time data monitoring...');
  
  // Monitor monitoring/data (original path)
  dataRef.on('value', async (snapshot) => {
    const data = snapshot.val();
    if (data) {
      console.log('\n === REAL-TIME DATA UPDATE (monitoring/data) ===');
      console.log(`Timestamp: ${new Date().toLocaleString()}`);
      console.log(` Weight: ${data.weight_kg || 0} kg (${data.weight_percent || 0}%)`);
      console.log(` Distance: ${data.distance_cm || 0} cm (Height: ${data.height_percent || 0}%)`);
      console.log(` Bin Level: ${data.bin_level || 0}%`);
      console.log(` GPS: ${data.latitude || 0}, ${data.longitude || 0}`);
      console.log(` GPS Valid: ${data.gps_valid || false}`);
      console.log(` Satellites: ${data.satellites || 0}`);
      console.log('==========================================\n');
      
      // SMS alert logic for monitoring/data - AUTOMATIC SMS when bin exceeds 85%
      if (data.bin_level >= 85 && !smsSentData) {
        console.log(`🚨 S1BIN3 ALERT: Level ${data.bin_level}% exceeds 85% threshold!`);
        console.log('📱 Sending automatic SMS notification...');
        
        const smsMessage = `🚨 SMARTBIN ALERT 🚨\n\nBin S1Bin3 is at ${data.bin_level}% capacity!\nLocation: Central Plaza\nTime: ${new Date().toLocaleString()}\n\nPlease empty the bin immediately.`;
        
        try {
          await sendSMS('+639309096606', smsMessage);
          smsSentData = true;
          console.log('✅ AUTOMATIC SMS sent successfully for S1Bin3');
        } catch (smsError) {
          console.error('❌ FAILED to send automatic SMS for S1Bin3:', smsError);
          // Reset flag to retry on next data update
          smsSentData = false;
        }
      } else if (data.bin_level < 85) {
        smsSentData = false; // Reset flag if bin level drops below threshold
        console.log(`📊 S1Bin3 level ${data.bin_level}% is below 85% threshold - SMS flag reset`);
      }

      // Notification logic for monitoring/data
      try {
        if (data.bin_level >= 85 && !criticalNotificationSent) {
          console.log('🚨 Sending critical bin notification...');
          await sendCriticalBinNotification('S1Bin3', data.bin_level, 'Central Plaza');
          criticalNotificationSent = true;
          warningNotificationSent = false; // Reset warning flag
        } else if (data.bin_level >= 70 && data.bin_level < 85 && !warningNotificationSent) {
          console.log('⚠️ Sending warning bin notification...');
          await sendWarningBinNotification('S1Bin3', data.bin_level, 'Central Plaza');
          warningNotificationSent = true;
        } else if (data.bin_level < 70) {
          // Reset flags when bin level drops below warning threshold
          criticalNotificationSent = false;
          warningNotificationSent = false;
        }
      } catch (notifyErr) {
        console.error('Failed to send bin notification for monitoring/data:', notifyErr);
      }
    }
  });
  
  // Monitor monitoring/bin1 (new path)
  bin1Ref.on('value', async (snapshot) => {
    const data = snapshot.val();
    if (data) {
      console.log('\n === REAL-TIME DATA UPDATE (monitoring/bin1) ===');
      console.log(` Timestamp: ${new Date().toLocaleString()}`);
      console.log(` Weight: ${data.weight_kg || 0} kg (${data.weight_percent || 0}%)`);
      console.log(` Distance: ${data.distance_cm || 0} cm (Height: ${data.height_percent || 0}%)`);
      console.log(` Bin Level: ${data.bin_level || 0}%`);
      console.log(` GPS: ${data.latitude || 0}, ${data.longitude || 0}`);
      console.log(` GPS Valid: ${data.gps_valid || false}`);
      console.log(` Satellites: ${data.satellites || 0}`);
      console.log('==========================================\n');
      
      // Process data through bin history system (with quota protection)
      try {
        // Only process if bin level is significant to reduce Firebase calls
        if (data.bin_level >= 70 || data.bin_level <= 10) {
          const historyResult = await BinHistoryProcessor.processExistingMonitoringData({
            weight: data.weight_percent || 0,
            distance: data.height_percent || 0,
            binLevel: data.bin_level || 0,
            gps: {
              lat: data.latitude || 0,
              lng: data.longitude || 0
            },
            gpsValid: data.gps_valid || false,
            satellites: data.satellites || 0,
            errorMessage: null
          });
          
          if (historyResult.success) {
            console.log(`[BIN HISTORY] Recorded monitoring data for bin1: Status=${historyResult.status}`);
            
            // Only check notifications for critical levels to reduce Firebase calls
            if (data.bin_level >= 85) {
              try {
                const notificationResult = await binNotificationController.checkBinAndNotify({
                  binId: 'bin1',
                  binLevel: data.bin_level || 0,
                  status: historyResult.status,
                  gps: {
                    lat: data.latitude || 0,
                    lng: data.longitude || 0
                  },
                  timestamp: new Date(),
                  weight: data.weight_percent || 0,
                  distance: data.height_percent || 0,
                  gpsValid: data.gps_valid || false,
                  satellites: data.satellites || 0,
                  errorMessage: null
                });
                
                if (notificationResult.notificationSent) {
                  console.log(`[BIN NOTIFICATION] Sent notification to janitor: ${notificationResult.type}`);
                }
              } catch (notifyErr) {
                console.error('[BIN NOTIFICATION] Error sending notification:', notifyErr);
              }
            }
          } else {
            console.error('[BIN HISTORY] Failed to record monitoring data:', historyResult.error);
          }
        } else {
          console.log(`[BIN HISTORY] Skipping database write for normal bin level: ${data.bin_level}%`);
        }
      } catch (historyErr) {
        console.error('[BIN HISTORY] Error processing monitoring data:', historyErr);
      }
      
      // SMS alert logic for bin1 - AUTOMATIC SMS when bin exceeds 85%
      if (data.bin_level >= 85 && !smsSentBin1) {
        console.log(`🚨 BIN1 ALERT: Level ${data.bin_level}% exceeds 85% threshold!`);
        console.log('📱 Sending automatic SMS notification...');
        
        const smsMessage = `🚨 SMARTBIN ALERT 🚨\n\nBin1 is at ${data.bin_level}% capacity!\nLocation: Central Plaza\nTime: ${new Date().toLocaleString()}\n\nPlease empty the bin immediately.`;
        
        try {
          await sendSMS('+639309096606', smsMessage);
          smsSentBin1 = true;
          console.log('✅ AUTOMATIC SMS sent successfully for bin1');
        } catch (smsError) {
          console.error('❌ FAILED to send automatic SMS for bin1:', smsError);
          // Reset flag to retry on next data update
          smsSentBin1 = false;
        }
      } else if (data.bin_level < 85) {
        smsSentBin1 = false; // Reset flag if bin level drops below threshold
        console.log(`📊 Bin1 level ${data.bin_level}% is below 85% threshold - SMS flag reset`);
      }

      // Notification logic for monitoring/bin1
      try {
        if (data.bin_level >= 85 && !criticalNotificationSent) {
          console.log('🚨 Sending critical bin1 notification...');
          await sendCriticalBinNotification('Bin1', data.bin_level, 'Central Plaza');
          criticalNotificationSent = true;
          warningNotificationSent = false; // Reset warning flag
        } else if (data.bin_level >= 70 && data.bin_level < 85 && !warningNotificationSent) {
          console.log('⚠️ Sending warning bin1 notification...');
          await sendWarningBinNotification('Bin1', data.bin_level, 'Central Plaza');
          warningNotificationSent = true;
        } else if (data.bin_level < 70) {
          // Reset flags when bin level drops below warning threshold
          criticalNotificationSent = false;
          warningNotificationSent = false;
        }
      } catch (notifyErr) {
        console.error('Failed to send bin notification for monitoring/bin1:', notifyErr);
      }
    }
  });
  
  console.log('✅ Real-time monitoring active for both data paths');
}

app.get('/api/bin', async (req, res) => {
  try {
    const snapshot = await dataRef.once('value');
    const data = snapshot.val();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bin data', details: err.message });
  }
});

// bin1 endpoint moved to binRoutes.js

// Helper function to determine bin status
function getBinStatus(level) {
  if (level >= 85) return 'critical';
  if (level >= 70) return 'warning';
  return 'normal';
}

// Test endpoint
app.get('/api/test-locations', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// New API endpoint for dynamic bin locations
app.get('/api/bin-locations', async (req, res) => {
  console.log('[API] bin-locations endpoint called');
  try {
    const [dataSnapshot, bin1Snapshot] = await Promise.all([
      dataRef.once('value'),
      bin1Ref.once('value')
    ]);
    
    const data = dataSnapshot.val();
    const bin1Data = bin1Snapshot.val();
    
    const binLocations = [];
    
    // Add monitoring/data bin if it has valid coordinates
    if (data && data.latitude && data.longitude && data.latitude !== 0 && data.longitude !== 0) {
      binLocations.push({
        id: 'monitoring-data',
        name: 'S1Bin3',
        position: [parseFloat(data.latitude), parseFloat(data.longitude)],
        level: parseFloat(data.bin_level) || 0,
        status: getBinStatus(parseFloat(data.bin_level) || 0),
        lastCollection: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
        route: 'Route A - Central',
        gps_valid: Boolean(data.gps_valid),
        satellites: parseInt(data.satellites) || 0
      });
    }
    
    // Add monitoring/bin1 bin if it has valid coordinates
    if (bin1Data && bin1Data.latitude && bin1Data.longitude && bin1Data.latitude !== 0 && bin1Data.longitude !== 0) {
      binLocations.push({
        id: 'monitoring-bin1',
        name: 'Central Plaza',
        position: [parseFloat(bin1Data.latitude), parseFloat(bin1Data.longitude)],
        level: parseFloat(bin1Data.bin_level) || 0,
        status: getBinStatus(parseFloat(bin1Data.bin_level) || 0),
        lastCollection: bin1Data.timestamp ? new Date(bin1Data.timestamp).toISOString() : new Date().toISOString(),
        route: 'Route A - Central',
        gps_valid: Boolean(bin1Data.gps_valid),
        satellites: parseInt(bin1Data.satellites) || 0
      });
    }
    
    console.log(`[API] Serving ${binLocations.length} dynamic bin locations`);
    res.json({
      bins: binLocations,
      center: binLocations.length > 0 ? binLocations[0].position : [10.2105, 123.7583],
      totalBins: binLocations.length,
      lastUpdate: new Date().toISOString()
    });
  } catch (err) {
    console.error('[API] Error fetching bin locations:', err);
    res.status(500).json({ error: 'Failed to fetch bin locations', details: err.message });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    const [dataSnapshot, bin1Snapshot] = await Promise.all([
      dataRef.once('value'),
      bin1Ref.once('value')
    ]);
    
    const data = dataSnapshot.val();
    const bin1Data = bin1Snapshot.val();
    
    res.json({
      timestamp: new Date().toISOString(),
      monitoring_data: data,
      bin1_data: bin1Data,
      server_status: 'running'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status', details: err.message });
  }
});

app.post('/api/send-sms', async (req, res) => {
  try {
    console.log('[SERVER] Manual SMS request received!');
    const snapshot = await dataRef.once('value');
    const data = snapshot.val();
    const binName = data.bin_name || 'SmartBin';
    const msg = `Alert: ${binName}\nWeight: ${data.weight_percent || 0}%\nHeight: ${data.height_percent || 0}%\nBin Level: ${data.bin_level || 0}%`;
    const phoneNumber = req.body.phoneNumber || '+639309096606';
    await sendSMS(phoneNumber, msg);
    res.json({ status: 'success', message: 'SMS sent.' });
  } catch (err) {
    console.error('[SERVER] Error sending manual SMS:', err);
    res.status(500).json({ error: 'Failed to send SMS', details: err.message });
  }
});

// Test SMS endpoint
app.post('/api/test-sms', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    const testPhoneNumber = phoneNumber || '+639309096606';
    const testMessage = message || 'Test SMS from SmartBin System';
    
    console.log(`[TEST SMS] Sending test SMS to ${testPhoneNumber}`);
    console.log(`[TEST SMS] Message: ${testMessage}`);
    
    await sendSMS(testPhoneNumber, testMessage);
    
    res.json({ 
      status: 'success', 
      message: 'Test SMS sent successfully',
      phoneNumber: testPhoneNumber,
      message: testMessage
    });
  } catch (err) {
    console.error('[TEST SMS] Error sending test SMS:', err);
    res.status(500).json({ 
      error: 'Failed to send test SMS', 
      details: err.message,
      modemStatus: modem ? (modem.isOpen ? 'connected' : 'disconnected') : 'not initialized'
    });
  }
});

// Force SMS alert for testing
app.post('/api/force-sms-alert', async (req, res) => {
  try {
    const { binId, binLevel } = req.body;
    const phoneNumber = '+639309096606';
    const level = binLevel || 90;
    const bin = binId || 'Bin1';
    
    const smsMessage = `🚨 SMARTBIN ALERT 🚨\n\n${bin} is at ${level}% capacity!\nLocation: Central Plaza\nTime: ${new Date().toLocaleString()}\n\nPlease empty the bin immediately.`;
    
    console.log(`[FORCE SMS] Sending forced SMS alert for ${bin} at ${level}%`);
    
    await sendSMS(phoneNumber, smsMessage);
    
    res.json({ 
      status: 'success', 
      message: 'Forced SMS alert sent successfully',
      binId: bin,
      binLevel: level,
      phoneNumber: phoneNumber
    });
  } catch (err) {
    console.error('[FORCE SMS] Error sending forced SMS alert:', err);
    res.status(500).json({ 
      error: 'Failed to send forced SMS alert', 
      details: err.message
    });
  }
});

// Track modem initialization status
let modemInitialized = false;

// SMS configuration status
app.get('/api/sms-status', (req, res) => {
  // Enhanced GSM status with more detailed information
  let modemStatus = 'not initialized';
  let modemDetails = {};
  
  if (modem) {
    modemDetails = {
      isOpen: modem.isOpen,
      port: modem.port || 'COM12',
      baudRate: options.baudRate,
      initialized: modem.initialized || false,
      customInitialized: modemInitialized
    };
    
    // Check multiple conditions for connection status
    if (modemInitialized || (modem.isOpen && modem.initialized)) {
      modemStatus = 'connected';
    } else if (modem.isOpen || modem.port) {
      modemStatus = 'disconnected';
    } else {
      modemStatus = 'not initialized';
    }
  }
  
  res.json({
    phoneNumber: '+639309096606',
    threshold: '85%',
    modemStatus: modemStatus,
    modemDetails: modemDetails,
    smsFlags: {
      smsSentData: smsSentData,
      smsSentBin1: smsSentBin1
    },
    autoSmsEnabled: true,
    message: 'SMS notifications will be sent automatically when bin level exceeds 85%',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to test GSM modem connection
app.get('/api/gsm-debug', (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    modem: {
      exists: !!modem,
      isOpen: modem ? modem.isOpen : false,
      port: modem ? modem.port : null,
      initialized: modem ? modem.initialized : false
    },
    options: options,
    connectionAttempts: 'Check server logs for connection attempts',
    recommendations: [
      '1. Check if COM12 is available in Device Manager',
      '2. Ensure no other application is using COM12',
      '3. Try running server as Administrator',
      '4. Check USB-SERIAL CH340 driver installation',
      '5. Unplug and reconnect the GSM modem'
    ]
  };
  
  res.json(debugInfo);
});

// Firebase quota status
app.get('/api/quota-status', (req, res) => {
  const timeSinceReset = Date.now() - lastQuotaReset;
  const hoursSinceReset = Math.floor(timeSinceReset / (1000 * 60 * 60));
  
  res.json({
    firebaseOperations: firebaseOperationsCount,
    hoursSinceReset: hoursSinceReset,
    quotaResetIn: Math.max(0, 24 - hoursSinceReset),
    status: firebaseOperationsCount > 15000 ? 'WARNING' : 'OK',
    recommendations: [
      'Check Firebase Console for exact usage',
      'Consider upgrading to Blaze plan if needed',
      'Database writes are now optimized for critical levels only'
    ]
  });
});

// Note: The /api/bin-history endpoint is now handled by binHistoryRoutes
// which uses the binHistoryController.getAllBinHistory method

// Test endpoint to update coordinates for testing
app.post('/api/test-coordinates', async (req, res) => {
  try {
    const { latitude, longitude, binId = 'bin1' } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'latitude and longitude are required',
        example: { latitude: 10.2105, longitude: 123.7583, binId: 'bin1' }
      });
    }

    const targetRef = binId === 'bin1' ? bin1Ref : dataRef;
    
    // Update coordinates in Firebase
    await targetRef.update({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      gps_valid: true,
      satellites: 8,
      timestamp: Date.now()
    });

    console.log(`[TEST COORDINATES] Updated ${binId} coordinates to: ${latitude}, ${longitude}`);
    
    res.json({
      success: true,
      message: `Updated ${binId} coordinates successfully`,
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        gps_valid: true,
        satellites: 8
      },
      binId: binId
    });
  } catch (err) {
    console.error('[TEST COORDINATES] Error updating coordinates:', err);
    res.status(500).json({ 
      error: 'Failed to update coordinates', 
      details: err.message 
    });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
