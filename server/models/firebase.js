const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config();

let credential;

// Try to use environment variables first (recommended for production)
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const serviceAccountKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    credential = admin.credential.cert(serviceAccountKey);
    console.log('🔥 Firebase initialized with environment variable credentials');
  } catch (error) {
    console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error.message);
  }
}

// Fallback to service account file (for development)
if (!credential) {
  const serviceAccountPath = path.join(__dirname, '..', 'smartbin-841a3-firebase-adminsdk-fbsvc-da8726c0ab.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = require(serviceAccountPath);
      credential = admin.credential.cert(serviceAccount);
      console.log('🔥 Firebase initialized with service account file');
    } catch (error) {
      console.error('❌ Error loading service account file:', error.message);
    }
  } else {
    console.error('❌ Firebase service account file not found at:', serviceAccountPath);
    console.log('📝 Please either:');
    console.log('   1. Download the service account key file and place it in the server directory');
    console.log('   2. Set the FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
  }
}

if (!admin.apps.length && credential) {
  admin.initializeApp({
    credential: credential,
    storageBucket: 'smartbin-841a3.appspot.com',
    databaseURL: 'https://smartbin-841a3-default-rtdb.firebaseio.com/'
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} else if (!credential) {
  console.error('❌ Firebase initialization failed - no valid credentials found');
}

let db, bucket;

if (admin.apps.length > 0) {
  db = admin.firestore();
  bucket = admin.storage().bucket();
  console.log('✅ Firebase services initialized');
} else {
  console.error('❌ Firebase services not available - app not initialized');
  // Create mock objects to prevent crashes
  db = null;
  bucket = null;
}

module.exports = {
  db,
  bucket,
  admin,
  isInitialized: admin.apps.length > 0
};
