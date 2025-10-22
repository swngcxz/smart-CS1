const { sendJanitorAssignmentNotification } = require('./server/controllers/activityController');

async function testManualAssignment() {
  console.log('🧪 Testing Manual Task Assignment SMS...');
  
  try {
    // Test data for manual assignment
    const testData = {
      janitorId: 'test_janitor_id', // This should be a real janitor ID from your database
      janitorName: 'Test Janitor',
      binId: 'bin1',
      binLocation: 'Central Plaza',
      binLevel: 85,
      taskNote: 'This is a test manual assignment',
      activityType: 'manual_assignment',
      priority: 'high',
      activityId: 'test_activity_id',
      timestamp: new Date(),
      isTaskAssignment: true,
      assignmentType: 'manual'
    };

    console.log('📤 Sending test manual assignment notification...');
    const result = await sendJanitorAssignmentNotification(testData);
    
    console.log('📥 Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Manual assignment test completed successfully!');
    } else {
      console.log('❌ Manual assignment test failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

// Run the test
testManualAssignment();
