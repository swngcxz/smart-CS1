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
const { sendCriticalBinNotification, sendWarningBinNotification } = require('./controllers/notificationController');
const BinHistoryProcessor = require('./utils/binHistoryProcessor');
const binNotificationController = require('./controllers/binNotificationController');


const db = admin.database();
const dataRef = db.ref('monitoring/data');
const bin1Ref = db.ref('monitoring/bin1');

const app = express();
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:8080', 'http://localhost:8000'],
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
app.use("/api", binRoutes);
app.use("/api", activityRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api', binHistoryRoutes);
app.use('/api', binNotificationRoutes);

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

function sendSMS(phoneNumber, message) {
  return new Promise((resolve, reject) => {
    console.log(`[SERIAL MONITOR] Creating SMS to ${phoneNumber}: "${message}"`);
    modem.sendSMS(phoneNumber, message, true, (result => {
      if (result.status !== 'success') {
        console.error('[SERIAL MONITOR] Failed to send SMS:', result);
        reject(result);
        return;
      }
      console.log('[SERIAL MONITOR] SMS sent successfully:', result);
      resolve(result);
    }));
  });
}

let smsSent = false;
let criticalNotificationSent = false;
let warningNotificationSent = false; // For the automatic threshold check

modem.on('error', error => {
  console.error('Modem error:', error);
});

modem.open('COM12', options, (error) => {
  if (error) {
    console.error('Error opening port:', error);
    console.log('⚠️  Modem not connected, but real-time monitoring will still work');
    
    // Record the error in bin history
    BinHistoryProcessor.processError('bin1', `Error opening port: ${error.message}`, {
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
});

modem.on('open', data => {
  console.log('[SERIAL MONITOR] Port opened successfully');
  modem.initializeModem((result) => {
    if (!result || result.status !== 'success') {
      console.error('[SERIAL MONITOR] Error initializing modem:', result);
      return;
    }
    console.log('[SERIAL MONITOR] Modem is initialized:', result);
    
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
      
      // SMS alert logic
      if (data.bin_level > 85 && !smsSent) {
        console.log('🚨 Bin level exceeded threshold, preparing to send SMS...');
        sendSMS('+639686043229', `Alert: Bin S1Bin3 is at ${data.bin_level}% capacity.`);
        smsSent = true;
      } else if (data.bin_level <= 85) {
        smsSent = false; // Reset flag if bin level drops
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
      
      // Process data through bin history system
      try {
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
           
           // Check if notification should be sent
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
         } else {
           console.error('[BIN HISTORY] Failed to record monitoring data:', historyResult.error);
         }
       } catch (historyErr) {
         console.error('[BIN HISTORY] Error processing monitoring data:', historyErr);
       }
      
      // SMS alert logic for bin1
      if (data.bin_level > 85 && !smsSent) {
        console.log('🚨 Bin1 level exceeded threshold, preparing to send SMS...');
        sendSMS('+639686043229', `Alert: Bin1 is at ${data.bin_level}% capacity.`);
        smsSent = true;
      } else if (data.bin_level <= 85) {
        smsSent = false; // Reset flag if bin level drops
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

app.get('/api/bin1', async (req, res) => {
  try {
    const snapshot = await bin1Ref.once('value');
    const data = snapshot.val();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bin1 data', details: err.message });
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
    const phoneNumber = req.body.phoneNumber || '+639686043229';
    await sendSMS(phoneNumber, msg);
    res.json({ status: 'success', message: 'SMS sent.' });
  } catch (err) {
    console.error('[SERVER] Error sending manual SMS:', err);
    res.status(500).json({ error: 'Failed to send SMS', details: err.message });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
