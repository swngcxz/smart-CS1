/**
 * Quick SMS Test - Edit YOUR_PHONE_NUMBER and run!
 */

const gsmService = require('./server/services/gsmService');

// ⚠️ CHANGE THIS TO YOUR ACTUAL PHONE NUMBER! ⚠️
const YOUR_PHONE_NUMBER = '+639606388228'; // Example: +639171234567 or 09171234567

async function sendTestSMS() {
    console.log('📱 Quick SMS Test\n');
    
    // Validate phone number
    if (YOUR_PHONE_NUMBER === 'YOUR_PHONE_NUMBER_HERE' || !YOUR_PHONE_NUMBER) {
        console.log('❌ ERROR: You must set YOUR_PHONE_NUMBER!');
        console.log('\nHow to fix:');
        console.log('1. Open send-test-sms.js');
        console.log('2. Change line 8 to your phone number');
        console.log('3. Example: const YOUR_PHONE_NUMBER = "+639171234567";');
        console.log('4. Or: const YOUR_PHONE_NUMBER = "09171234567";\n');
        process.exit(1);
    }
    
    try {
        console.log('Initializing GSM module...');
        await gsmService.initialize();
        
        console.log('Waiting for modem to be ready...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check status
        const status = gsmService.getStatus();
        console.log('\n📊 Status:');
        console.log('  Connection:', status.isConnected ? '✅' : '❌');
        console.log('  SIM Status:', status.simStatus);
        console.log('  Signal:', status.signalStrength + '/31');
        
        if (!status.isConnected || status.simStatus !== 'ready') {
            console.log('\n❌ GSM module not ready!');
            console.log('Please wait and try again.\n');
            gsmService.close();
            process.exit(1);
        }
        
        // Send SMS
        const message = `Test SMS from Smart Bin GSM Module! Sent at: ${new Date().toLocaleString()}`;
        
        console.log('\n📤 Sending SMS...');
        console.log('  To:', YOUR_PHONE_NUMBER);
        console.log('  Message:', message);
        console.log('\n⏳ Please wait 10-30 seconds...\n');
        
        const result = await gsmService.sendSMS(YOUR_PHONE_NUMBER, message);
        
        console.log('✅ SMS SENT SUCCESSFULLY!');
        console.log('━'.repeat(60));
        console.log('📱 Check your phone for the SMS!');
        console.log('━'.repeat(60));
        console.log('Details:');
        console.log(JSON.stringify(result, null, 2));
        console.log('━'.repeat(60));
        
    } catch (error) {
        console.log('\n❌ SMS FAILED!');
        console.log('Error:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Check if SIM has load/credits');
        console.log('2. Verify phone number format (+639XXXXXXXXX)');
        console.log('3. Ensure SIM is registered with Smart network');
        console.log('4. Wait 30 seconds and try again\n');
    } finally {
        gsmService.close();
        console.log('\nTest completed.\n');
        process.exit(0);
    }
}

console.log('═'.repeat(60));
console.log('   📱 SMART BIN - GSM SMS TEST');
console.log('═'.repeat(60));
console.log('\n⚠️  IMPORTANT: Set your phone number first!');
console.log('Edit line 8 in this file: send-test-sms.js\n');

sendTestSMS().catch(console.error);
