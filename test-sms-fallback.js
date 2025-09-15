const axios = require('axios');

async function testSMSFallback() {
  try {
    console.log('🧪 Testing SMS Fallback Functionality...\n');
    
    // Test the manual SMS endpoint
    console.log('1. Testing manual SMS endpoint...');
    const response = await axios.post('http://localhost:8000/api/send-sms', {
      phoneNumber: '+639309096606',
      message: 'Test SMS from fallback system'
    });
    
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', response.data);
    
    // Test the server status
    console.log('\n2. Testing server status...');
    const statusResponse = await axios.get('http://localhost:8000/api/status');
    console.log('✅ Server Status:', statusResponse.data.server_status);
    console.log('✅ Bin1 Data Available:', !!statusResponse.data.bin1_data);
    
    if (statusResponse.data.bin1_data) {
      console.log('📊 Current Bin1 Level:', statusResponse.data.bin1_data.bin_level + '%');
      
      if (statusResponse.data.bin1_data.bin_level >= 85) {
        console.log('🚨 Bin level is at or above 85% - SMS should be triggered!');
      } else {
        console.log('✅ Bin level is below 85% - no SMS needed');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing SMS:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testSMSFallback();












