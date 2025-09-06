const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

// Use service account file directly
const serviceAccount = require(path.join(__dirname, '..', 'smartbin-841a3-firebase-adminsdk-fbsvc-da8726c0ab.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'smartbin-841a3.appspot.com',
    databaseURL: 'https://smartbin-841a3-default-rtdb.firebaseio.com/'
  });
  console.log('🔥 Firebase initialized with service account file');
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = {
  db,
  bucket,
  admin
};
