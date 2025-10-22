const { db } = require('./models/firebase');

async function createTestActivity() {
  try {
    console.log('📝 Creating test activity log...');
    
    const activityData = {
      bin_id: 'bin1',
      bin_location: 'Central Plaza',
      bin_level: 85,
      activity_type: 'task_assignment',
      description: 'Test manual task assignment',
      status: 'pending',
      priority: 'high',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const docRef = await db.collection('activitylogs').add(activityData);
    console.log('✅ Test activity created with ID:', docRef.id);
    
    return docRef.id;
    
  } catch (error) {
    console.error('💥 Error creating test activity:', error);
    return null;
  }
}

createTestActivity();
