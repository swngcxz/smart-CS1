const { db } = require('./models/firebase');

async function checkActivityLogs() {
  try {
    console.log('Checking recent activity logs...');
    const snapshot = await db.collection('activitylogs').orderBy('created_at', 'desc').limit(5).get();
    
    if (snapshot.empty) {
      console.log('No activity logs found.');
      return;
    }
    
    console.log(`Found ${snapshot.size} recent activity logs:`);
    console.log('==========================================');
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`Status: ${data.status}`);
      console.log(`Activity Type: ${data.activity_type}`);
      console.log(`Source: ${data.source || 'N/A'}`);
      console.log(`Assigned Janitor: ${data.assigned_janitor_name || 'None'}`);
      console.log(`Created: ${data.created_at}`);
      console.log(`Task Note: ${data.task_note ? data.task_note.substring(0, 100) + '...' : 'N/A'}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error checking activity logs:', error);
  }
}

checkActivityLogs();
