/**
 * GSM SMS Test Script
 * Tests the GSM module functionality and SMS sending
 */

const gsmService = require('./server/services/gsmService');
const smsService = require('./server/services/smsNotificationService');

async function testGSMFunctionality() {
    console.log('🧪 Starting GSM SMS Test...\n');
    
    try {
        // Initialize services
        console.log('1. Initializing GSM service...');
        await gsmService.initialize();
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for initialization
        
        // Check status
        console.log('\n2. Checking GSM status...');
        const status = gsmService.getStatus();
        console.log('GSM Status:', JSON.stringify(status, null, 2));
        
        // Test connection
        console.log('\n3. Testing GSM connection...');
        const connectionTest = await gsmService.testConnection();
        console.log('Connection Test:', JSON.stringify(connectionTest, null, 2));
        
        if (connectionTest.success) {
            console.log('✅ GSM module is ready for SMS testing');
            
            // Test SMS sending
            console.log('\n4. Testing SMS sending...');
            const testPhoneNumber = '+639123456789'; // Replace with your test number
            const testMessage = `Test SMS from Smart Bin GSM Module - ${new Date().toLocaleString()}`;
            
            console.log(`Sending SMS to: ${testPhoneNumber}`);
            console.log(`Message: ${testMessage}`);
            
            const smsResult = await gsmService.sendSMSWithFallback(testPhoneNumber, testMessage);
            console.log('\nSMS Result:', JSON.stringify(smsResult, null, 2));
            
            if (smsResult.success) {
                console.log('✅ SMS sent successfully!');
            } else {
                console.log('❌ SMS failed:', smsResult.error);
            }
            
        } else {
            console.log('❌ GSM module not ready:', connectionTest.message);
            if (connectionTest.recommendations) {
                console.log('Recommendations:');
                connectionTest.recommendations.forEach(rec => console.log(`- ${rec}`));
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        // Close connection
        console.log('\n5. Closing GSM connection...');
        gsmService.close();
        console.log('Test completed.');
    }
}

// Run the test
if (require.main === module) {
    testGSMFunctionality().catch(console.error);
}

module.exports = { testGSMFunctionality };
