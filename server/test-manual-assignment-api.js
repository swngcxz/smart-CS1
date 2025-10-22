const axios = require('axios');

async function testManualAssignmentAPI() {
  try {
    console.log('🧪 Testing Manual Assignment API...');
    
    // First, get available janitors
    console.log('📋 Fetching available janitors...');
    const janitorsResponse = await axios.get('http://localhost:8000/api/janitors/available');
    console.log('✅ Janitors fetched:', janitorsResponse.data);
    
    if (janitorsResponse.data.janitors.length === 0) {
      console.log('❌ No janitors available');
      return;
    }
    
    const janitor = janitorsResponse.data.janitors[0];
    console.log('👤 Using janitor:', janitor.fullName);
    
    // Test manual assignment with real activity ID
    const assignmentData = {
      activityId: '5ET4lv0xCNkyHALNKniv', // Real activity ID from database
      janitorId: janitor.id,
      janitorName: janitor.fullName,
      taskNote: 'Test manual assignment via API'
    };
    
    console.log('📤 Sending manual assignment request...');
    const assignmentResponse = await axios.post('http://localhost:8000/api/assign-task', assignmentData);
    
    console.log('📥 Assignment response:', assignmentResponse.data);
    
    if (assignmentResponse.data.success) {
      console.log('✅ Manual assignment test completed successfully!');
    } else {
      console.log('❌ Manual assignment test failed:', assignmentResponse.data.error);
    }
    
  } catch (error) {
    console.error('💥 Test error:', error.response?.data || error.message);
  }
}

// Run the test
testManualAssignmentAPI();
