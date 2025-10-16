// Test login functionality
const axios = require('axios');

const SERVER_URL = 'http://10.0.2.187:8000';

async function testLogin() {
  console.log('🔐 Testing login functionality...');
  console.log(`📍 Server URL: ${SERVER_URL}`);
  
  try {
    console.log('\n1. Testing login with your credentials...');
    const response = await axios.post(`${SERVER_URL}/auth/login`, {
      email: 'john@gmail.com',
      password: 'John_12345'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log(`   Status: ${response.status}`);
    console.log(`   User: ${response.data.user.fullName}`);
    console.log(`   Role: ${response.data.user.role}`);
    console.log(`   Redirect: ${response.data.redirectTo}`);
    console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
    
    console.log('\n🎉 Your credentials work perfectly!');
    console.log('\n📱 Next steps:');
    console.log('   1. Restart your mobile app: npm start');
    console.log('   2. Try logging in with: john@gmail.com / John_12345');
    console.log('   3. You should now be able to login successfully!');
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log(`   Error: ${error.message}`);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure your server is running: cd server && npm start');
    console.log('   2. Check if the IP address is correct');
    console.log('   3. Verify your credentials in the database');
  }
}

testLogin();
