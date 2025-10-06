const admin = require('firebase-admin');
const serviceAccount = require('./config/firebase-service-account.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://smartwaste-b3f0f-default-rtdb.firebaseio.com/"
  });
}

const db = admin.firestore();

async function fixArchivedTasks() {
  try {
    console.log('🔧 Fixing archived automatic tasks...');
    
    // Find all archived automatic tasks
    const snapshot = await db.collection('activitylogs')
      .where('status', '==', 'archived')
      .where('activity_type', '==', 'task_assignment')
      .where('source', '==', 'automatic_monitoring')
      .get();
    
    if (snapshot.empty) {
      console.log('✅ No archived automatic tasks found');
      return;
    }
    
    console.log(`📋 Found ${snapshot.size} archived automatic tasks to fix`);
    
    const batch = db.batch();
    let fixedCount = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Update to pending status
      batch.update(doc.ref, {
        status: 'pending',
        bin_status: 'pending',
        updated_at: new Date().toISOString(),
        fixed_at: new Date().toISOString(),
        fixed_reason: 'Converted from archived to pending for manual assignment'
      });
      
      console.log(`🔄 Fixing task ${doc.id}: ${data.task_note?.substring(0, 50)}...`);
      fixedCount++;
    });
    
    await batch.commit();
    console.log(`✅ Successfully fixed ${fixedCount} archived tasks to pending status`);
    
  } catch (error) {
    console.error('❌ Error fixing archived tasks:', error);
  } finally {
    process.exit(0);
  }
}

fixArchivedTasks();
