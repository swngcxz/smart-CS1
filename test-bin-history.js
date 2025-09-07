const axios = require('axios');

async function testBinHistoryAPI() {
  try {
    console.log('Testing Bin History API...');
    
    // Test the bin history endpoint
    const response = await axios.get('http://localhost:8000/api/bin-history');
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log(`✅ Found ${response.data.records.length} bin history records`);
      console.log('✅ Stats:', response.data.stats);
    } else {
      console.log('❌ API returned error:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBinHistoryAPI();


