const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDsiaFXyzHJ7M8lWIHZuFPVPisupRpg05o",
  authDomain: "smart-9a198.firebaseapp.com",
  projectId: "smart-9a198",
  storageBucket: "smart-9a198.firebasestorage.app",
  messagingSenderId: "520579481612",
  appId: "1:520579481612:web:ecc66c567bad3d08c4ae29",
  measurementId: "G-E0GREV07BW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function saveData(collectionName, data) {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error };
  }
}

module.exports = { saveData, db };
