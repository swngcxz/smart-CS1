const { db } = require("./firebase");

async function saveFeedback(data) {
  return await db.collection("feedbacks").add(data);
}

async function getAllFeedbacks() {
  const snapshot = await db.collection("feedbacks").get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function getFeedbacksByStatus(status) {
  const snapshot = await db.collection("feedbacks").where("status", "==", status).get();
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
