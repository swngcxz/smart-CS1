const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query,          // ADD THIS
  where           // ADD THIS
} = require('firebase/firestore');

// your Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function saveData(collectionName, data) {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return { success: true, id: docRef.id };
  } catch (err) {
    console.error('Error saving data:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query,     // export
  where,     // export
  saveData 
};
