// Simple test script to verify server connection
// Run with: node test-connection.js

const axios = require('axios');

const SERVER_URL = 'http://10.0.2.187:8000';

async function testConnection() {
  console.log('🔍 Testing server connection...');
  console.log(`📍 Server URL: ${SERVER_URL}`);
  
  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const response = await axios.get(`${SERVER_URL}/`, { timeout: 5000 });
    console.log('✅ Server is running!');
    console.log(`   Status: ${response.status}`);
    
    // Test API endpoints
    console.log('\n2. Testing API endpoints...');
    
    // Test bins endpoint
    try {
      const binsResponse = await axios.get(`${SERVER_URL}/api/bins`, { timeout: 5000 });
      console.log('✅ Bins endpoint accessible');
      console.log(`   Status: ${binsResponse.status}`);
    } catch (error) {
      console.log('⚠️  Bins endpoint not accessible (might need authentication)');
      console.log(`   Error: ${error.response?.status || error.message}`);
    }
    
    // Test auth endpoint
    try {
      const authResponse = await axios.get(`${SERVER_URL}/auth`, { timeout: 5000 });
      console.log('✅ Auth endpoint accessible');
      console.log(`   Status: ${authResponse.status}`);
    } catch (error) {
      console.log('⚠️  Auth endpoint not accessible');
      console.log(`   Error: ${error.response?.status || error.message}`);
    }
    
    // Test schedules endpoint
    try {
      const schedulesResponse = await axios.get(`${SERVER_URL}/api/schedules`, { timeout: 5000 });
      console.log('✅ Schedules endpoint accessible');
      console.log(`   Status: ${schedulesResponse.status}`);
    } catch (error) {
      console.log('⚠️  Schedules endpoint not accessible (might need authentication)');
      console.log(`   Error: ${error.response?.status || error.message}`);
    }
    
    console.log('\n🎉 Connection test completed!');
    console.log('\n📱 Next steps:');
    console.log('   1. Start your mobile app: npm start');
    console.log('   2. Import ApiExample component to test API calls');
    console.log('   3. Check the API_SETUP.md file for usage examples');
    
  } catch (error) {
    console.log('❌ Connection failed!');
    console.log(`   Error: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the server is running: cd server && npm start');
    console.log('   2. Check if server is running on port 8000');
    console.log('   3. Verify the server URL in the mobile app');
  }
}

// Run the test
testConnection();
