const axios = require('axios');

async function testAssignmentAPI() {
  console.log('🧪 Testing Assignment API...');
  
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
    
    // 2. Test assignment with the automatic task we created
    const assignmentData = {
      activityId: 'xmaQ4xv3tv1xvUHl16PU', // The automatic task we created
      janitorId: janitor.id,
      janitorName: janitor.fullName,
      taskNote: 'Test assignment via API'
    };
    
    console.log('📤 Sending assignment request...');
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
