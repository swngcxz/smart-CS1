const axios = require('axios');

async function testAutomaticTaskCreation() {
  try {
    console.log('🧪 Testing automatic task creation...');
    
    // Test with different bin levels
    const testCases = [
      { binLevel: 85, binId: 'bin1', binLocation: 'Central Plaza' },
      { binLevel: 90, binId: 'bin1', binLocation: 'Central Plaza' },
      { binLevel: 95, binId: 'bin1', binLocation: 'Central Plaza' }
    ];

    for (const testCase of testCases) {
      console.log(`\n📊 Testing bin level ${testCase.binLevel}%...`);
      
      const response = await axios.post('http://localhost:8000/api/test/automatic-task', testCase);
      
      if (response.data.success) {
        console.log(`✅ Success: ${response.data.message}`);
        console.log(`   Task ID: ${response.data.taskId}`);
        console.log(`   Priority: ${response.data.taskData.priority}`);
      } else {
        console.log(`❌ Failed: ${response.data.message}`);
        if (response.data.reason) {
          console.log(`   Reason: ${response.data.reason}`);
        }
      }
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check service status
    console.log('\n📈 Checking service status...');
    const statusResponse = await axios.get('http://localhost:8000/api/test/automatic-task/status');
    console.log('Service Status:', JSON.stringify(statusResponse.data.status, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testAutomaticTaskCreation();
