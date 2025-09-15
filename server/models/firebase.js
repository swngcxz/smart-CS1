const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();

let credential;

if (!admin.apps.length) {
  try {
    credential = admin.credential.cert({
      type: process.env.TYPE,
      project_id: process.env.PROJECT_ID,
      private_key_id: process.env.PRIVATE_KEY_ID,
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'), // handle newlines
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
      auth_uri: process.env.AUTH_URI,
      token_uri: process.env.TOKEN_URI,
      auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
      universe_domain: process.env.UNIVERSE_DOMAIN,
    });

    admin.initializeApp({
      credential: credential,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      databaseURL: `https://${process.env.PROJECT_ID}-default-rtdb.firebaseio.com/`
    });

    console.log('✅ Firebase initialized with .env variables');
  } catch (error) {
    console.error('❌ Error initializing Firebase with .env:', error.message);
  }
}

let db = null, bucket = null;

if (admin.apps.length > 0) {
  db = admin.firestore();
  bucket = admin.storage().bucket();
  console.log('✅ Firebase services ready');
} else {
  console.error('❌ Firebase services not available - app not initialized');
}

module.exports = {
  db,
  bucket,
  admin
};
