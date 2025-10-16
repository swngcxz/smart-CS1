// Test password reset functionality
const axios = require('axios');

const SERVER_URL = 'http://10.0.2.187:8000';

async function testPasswordReset() {
  console.log('🔐 Testing password reset functionality...');
  console.log(`📍 Server URL: ${SERVER_URL}`);
  console.log(`📧 Test Email: john@gmail.com`);
  
  try {
    console.log('\n1. Requesting password reset...');
    const resetResponse = await axios.post(`${SERVER_URL}/auth/request-password-reset`, {
      email: 'john@gmail.com'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Password reset request successful!');
    console.log(`   Status: ${resetResponse.status}`);
    console.log(`   Message: ${resetResponse.data.message}`);
    
    console.log('\n📧 Check your email for the 6-digit OTP code!');
    console.log('   The OTP code should be sent to: john@gmail.com');
    console.log('   The code expires in 10 minutes.');
    
    console.log('\n📱 Next steps:');
    console.log('   1. Open your mobile app');
    console.log('   2. Go to Forgot Password');
    console.log('   3. Enter: john@gmail.com');
    console.log('   4. Check your email for the OTP code');
    console.log('   5. Enter the OTP code in the app');
    console.log('   6. Set your new password');
    
  } catch (error) {
    console.log('❌ Password reset request failed!');
    console.log(`   Error: ${error.message}`);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure your server is running: cd server && npm start');
    console.log('   2. Check if the email configuration is set up');
    console.log('   3. Verify the user exists in the database');
  }
}

testPasswordReset();
