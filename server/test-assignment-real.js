const axios = require('axios');

async function testAssignmentAPI() {
  console.log('🧪 Testing Assignment API with real activity...');
  
  try {
    // 1. Get available janitors
    console.log('📋 Fetching available janitors...');
    const janitorsResponse = await axios.get('http://localhost:8000/api/janitors/available');
    console.log('✅ Janitors fetched:', janitorsResponse.data);
    
    if (!janitorsResponse.data.success || janitorsResponse.data.janitors.length === 0) {
      throw new Error('No janitors available for testing.');
    }
    
    const janitor = janitorsResponse.data.janitors[0];
    console.log('👤 Using janitor:', janitor.fullName);
    
    // 2. Test assignment with the real activity ID
    const assignmentData = {
      activityId: 'StBnybRjCiM8t3YV6vpa', // Real activity ID from database
      janitorId: janitor.id,
      janitorName: janitor.fullName,
      taskNote: 'Test assignment via API - Real Activity'
    };
    
    console.log('📤 Sending assignment request...');
    console.log('📤 Assignment data:', assignmentData);
    
    const assignmentResponse = await axios.post('http://localhost:8000/api/assign-task', assignmentData);
    
    console.log('📥 Assignment response:', assignmentResponse.data);
    
    if (assignmentResponse.data.success) {
      console.log('✅ Assignment test completed successfully!');
    } else {
      console.error('💥 Assignment test failed:', assignmentResponse.data.error);
    }
    
  } catch (error) {
    console.error('💥 Test error:', error.response ? error.response.data : error.message);
  }
}

testAssignmentAPI();
