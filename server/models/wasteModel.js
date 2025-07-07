const { db, collection, addDoc, getDocs, query, where } = require("./firebase");

async function saveFeedback(data) {
  return await addDoc(collection(db, "feedbacks"), data);
}

async function getAllFeedbacks() {
  const snapshot = await getDocs(collection(db, "feedbacks"));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function getFeedbacksByStatus(status) {
  const q = query(collection(db, "feedbacks"), where("status", "==", status));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

module.exports = {
  saveFeedback,
  getAllFeedbacks,
  getFeedbacksByStatus
};
