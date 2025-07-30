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


const db = admin.database();
const dataRef = db.ref('monitoring/data');

const app = express();
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
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

app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('API is running');
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

let smsSent = false; // For the automatic threshold check

modem.on('error', error => {
  console.error('Modem error:', error);
});

modem.open('COM12', options, (error) => {
  if (error) {
    console.error('Error opening port:', error);
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
    // Automatic SMS on threshold
    const binLevelRef = db.ref('monitoring/data/bin_level');
    binLevelRef.on('value', (snapshot) => {
      const binLevel = snapshot.val();
      console.log(`[SERIAL MONITOR] Current bin level from Firebase: ${binLevel}`);
      if (binLevel > 85 && !smsSent) {
        console.log('[SERIAL MONITOR] Bin level exceeded threshold, preparing to send SMS...');
        sendSMS('+639686043229', `Alert: Bin S1Bin3 is at ${binLevel}% capacity.`);
        smsSent = true;
      } else if (binLevel <= 85) {
        smsSent = false; // Reset flag if bin level drops
      }
    });
  });
});

app.get('/api/bin', async (req, res) => {
  try {
    const snapshot = await dataRef.once('value');
    const data = snapshot.val();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bin data', details: err.message });
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
