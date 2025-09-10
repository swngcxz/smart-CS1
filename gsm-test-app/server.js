const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const serialportgsm = require('serialport-gsm');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize Firebase Admin
let db;
try {
  const serviceAccount = require('./smartbin-841a3-firebase-adminsdk-fbsvc-da8726c0ab.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'smartbin-841a3.appspot.com',
    databaseURL: 'https://smartbin-841a3-default-rtdb.firebaseio.com/'
  });
  db = admin.firestore();
  console.log('🔥 Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  db = null;
}

// GSM Module Configuration
let modem;
let modemInitialized = false;
const PHONE_NUMBER = '+639953207865';

// Initialize GSM Modem with COM13
function initializeGSM() {
  try {
    console.log('🔧 Initializing GSM Modem on COM13...');
    
    modem = serialportgsm.Modem();
    let options = {
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      rtscts: false,
      xon: false,
      xoff: false,
      xany: false,
      flowControl: 'none',
      port: 'COM13'
    };

    modem.open('COM13', options, (error) => {
      if (error) {
        console.error('❌ GSM Modem connection failed on COM13:', error);
        console.log('💡 Trying alternative ports...');
        
        // Try alternative ports
        tryAlternativePorts();
      } else {
        console.log('✅ GSM Modem connected successfully on COM13!');
        modemInitialized = true;
      }
    });

    modem.on('error', (err) => {
      console.error('❌ GSM Modem error:', err);
      modemInitialized = false;
    });

  } catch (error) {
    console.error('❌ Failed to initialize GSM Modem:', error);
    tryAlternativePorts();
  }
}

// Try alternative COM ports
function tryAlternativePorts() {
  const alternativePorts = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5'];
  let currentIndex = 0;
  
  function tryNextPort() {
    if (currentIndex >= alternativePorts.length) {
      console.error('❌ All COM ports failed. Please check your GSM module connection.');
      return;
    }
    
    const port = alternativePorts[currentIndex];
    console.log(`🔄 Trying port ${port}...`);
    
    try {
      modem = serialportgsm.Modem();
      let options = {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        rtscts: false,
        xon: false,
        xoff: false,
        xany: false,
        flowControl: 'none',
        port: port
      };

      modem.open(port, options, (error) => {
        if (error) {
          console.error(`❌ Port ${port} failed:`, error.message);
          currentIndex++;
          setTimeout(tryNextPort, 1000);
        } else {
          console.log(`✅ GSM Modem connected successfully on ${port}!`);
          modemInitialized = true;
        }
      });

      modem.on('error', (err) => {
        console.error(`❌ Port ${port} error:`, err);
        modemInitialized = false;
        currentIndex++;
        setTimeout(tryNextPort, 1000);
      });
      
    } catch (error) {
      console.error(`❌ Port ${port} initialization failed:`, error);
      currentIndex++;
      setTimeout(tryNextPort, 1000);
    }
  }
  
  tryNextPort();
}

// Firebase Functions
async function getJanitors() {
  if (!db) {
    throw new Error('Firebase not initialized');
  }
  
  try {
    const janitorsRef = db.collection('janitor');
    const snapshot = await janitorsRef.where('status', '==', 'active').get();
    
    const janitors = [];
    snapshot.forEach(doc => {
      janitors.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📋 Found ${janitors.length} active janitors`);
    return janitors;
  } catch (error) {
    console.error('❌ Error fetching janitors:', error);
    throw error;
  }
}

async function getJanitorById(janitorId) {
  if (!db) {
    throw new Error('Firebase not initialized');
  }
  
  try {
    const janitorRef = db.collection('janitor').doc(janitorId);
    const doc = await janitorRef.get();
    
    if (!doc.exists) {
      throw new Error('Janitor not found');
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('❌ Error fetching janitor:', error);
    throw error;
  }
}

// Send SMS Function
function sendSMS(phoneNumber, message) {
  return new Promise((resolve, reject) => {
    if (!modemInitialized || !modem) {
      reject(new Error('GSM Modem not initialized'));
      return;
    }

    console.log(`📱 Sending SMS to ${phoneNumber}: ${message}`);
    
    modem.sendSMS(phoneNumber, message, true, (result) => {
      console.log('📱 SMS send result:', result);
      
      if (result && result.status === 'success') {
        console.log('✅ SMS sent successfully!');
        resolve(result);
      } else {
        console.error('❌ SMS sending failed:', result);
        reject(new Error(result.message || 'SMS sending failed'));
      }
    });
  });
}

// API Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/status', (req, res) => {
  res.json({
    modemConnected: !!modem,
    modemInitialized: modemInitialized,
    port: 'COM13 (with fallback)',
    phoneNumber: PHONE_NUMBER,
    firebaseConnected: !!db,
    timestamp: new Date().toISOString()
  });
});

// Get all active janitors
app.get('/api/janitors', async (req, res) => {
  try {
    const janitors = await getJanitors();
    res.json({
      success: true,
      janitors: janitors,
      count: janitors.length
    });
  } catch (error) {
    console.error('Janitors API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch janitors',
      details: error.message
    });
  }
});

// Get specific janitor by ID
app.get('/api/janitors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const janitor = await getJanitorById(id);
    res.json({
      success: true,
      janitor: janitor
    });
  } catch (error) {
    console.error('Janitor API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch janitor',
      details: error.message
    });
  }
});

app.post('/api/send-sms', async (req, res) => {
  try {
    const { phoneNumber, janitorId, message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let targetPhoneNumber = phoneNumber;
    let janitorInfo = null;

    // If janitorId is provided, fetch janitor details
    if (janitorId) {
      try {
        janitorInfo = await getJanitorById(janitorId);
        targetPhoneNumber = janitorInfo.contactNumber;
        console.log(`📱 Sending SMS to janitor: ${janitorInfo.fullName} (${targetPhoneNumber})`);
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid janitor ID', 
          details: error.message 
        });
      }
    } else if (!phoneNumber) {
      return res.status(400).json({ 
        error: 'Either phoneNumber or janitorId is required' 
      });
    }

    const result = await sendSMS(targetPhoneNumber, message);
    res.json({ 
      success: true, 
      message: 'SMS sent successfully',
      recipient: janitorInfo ? {
        name: janitorInfo.fullName,
        phone: targetPhoneNumber,
        location: janitorInfo.location
      } : {
        phone: targetPhoneNumber
      },
      result: result 
    });
  } catch (error) {
    console.error('SMS API Error:', error);
    res.status(500).json({ 
      error: 'Failed to send SMS', 
      details: error.message 
    });
  }
});

app.post('/api/test-sms', async (req, res) => {
  try {
    const testMessage = `Test SMS from GSM Debug App - ${new Date().toLocaleString()}`;
    const result = await sendSMS(PHONE_NUMBER, testMessage);
    res.json({ 
      success: true, 
      message: 'Test SMS sent successfully',
      result: result 
    });
  } catch (error) {
    console.error('Test SMS Error:', error);
    res.status(500).json({ 
      error: 'Failed to send test SMS', 
      details: error.message 
    });
  }
});

// Send SMS to specific janitor
app.post('/api/send-sms-to-janitor', async (req, res) => {
  try {
    const { janitorId, message } = req.body;
    
    if (!janitorId) {
      return res.status(400).json({ error: 'Janitor ID is required' });
    }
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch janitor details
    const janitorInfo = await getJanitorById(janitorId);
    const targetPhoneNumber = janitorInfo.contactNumber;
    
    console.log(`📱 Sending SMS to janitor: ${janitorInfo.fullName} (${targetPhoneNumber})`);
    
    const result = await sendSMS(targetPhoneNumber, message);
    res.json({ 
      success: true, 
      message: 'SMS sent successfully to janitor',
      recipient: {
        id: janitorInfo.id,
        name: janitorInfo.fullName,
        phone: targetPhoneNumber,
        location: janitorInfo.location,
        email: janitorInfo.email
      },
      result: result 
    });
  } catch (error) {
    console.error('Janitor SMS Error:', error);
    res.status(500).json({ 
      error: 'Failed to send SMS to janitor', 
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GSM Test Server running on http://localhost:${PORT}`);
  console.log(`📱 Phone number configured: ${PHONE_NUMBER}`);
  initializeGSM();
});