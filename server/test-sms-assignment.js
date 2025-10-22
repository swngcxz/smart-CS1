const axios = require('axios');

async function testSMSAssignment() {
  try {
    console.log('🧪 Testing SMS Notification for Janitor Assignment...');
    
    // First, create a test activity
    console.log('📝 Creating test activity...');
    const activityData = {
      bin_id: 'bin1',
      bin_location: 'Central Plaza',
      bin_level: 85,
      activity_type: 'task_assignment',
      description: 'Test SMS notification assignment',
      status: 'pending',
      priority: 'high',
      timestamp: new Date().toISOString()
    };
    
    const activityResponse = await axios.post('http://localhost:8000/api/activitylogs', activityData);
    const activityId = activityResponse.data.id;
    console.log('✅ Test activity created with ID:', activityId);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Now assign a janitor to trigger SMS
    console.log('👤 Assigning janitor to trigger SMS notification...');
    const assignmentData = {
      status: 'in_progress',
      assigned_janitor_id: '6uprP4efGeffBN5aEJGx', // Glendon Rose Marie
      assigned_janitor_name: 'Glendon Rose Marie'
    };
    
    const updateResponse = await axios.put(`http://localhost:8000/api/activitylogs/${activityId}`, assignmentData);
    console.log('✅ Assignment response:', updateResponse.data);
    
    console.log('🎉 Test completed! Check server logs for SMS notification.');
    
  } catch (error) {
    console.error('💥 Test error:', error.response?.data || error.message);
  }
}

// Run the test
testSMSAssignment();
