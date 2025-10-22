/**
 * Direct SMS Test - Troubleshooting Script
 * This will test SMS sending step by step
 */

const gsmService = require('./server/services/gsmService');

// CONFIGURE YOUR TEST HERE
const TEST_PHONE_NUMBER = '+639606388228'; // CHANGE THIS TO YOUR PHONE NUMBER - EDIT LINE 8!
const TEST_MESSAGE = 'Hello from Smart Bin! This is a test SMS. Time: ' + new Date().toLocaleString();

async function testDirectSMS() {
    console.log('📱 Direct SMS Test - Troubleshooting Mode');
    console.log('==========================================\n');
    
    try {
        // Step 1: Initialize
        console.log('Step 1: Initializing GSM service...');
        await gsmService.initialize();
        
        // Wait for initialization
        console.log('Waiting for modem initialization (5 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Step 2: Check Status
        console.log('\nStep 2: Checking GSM status...');
        const status = gsmService.getStatus();
        console.log('━'.repeat(50));
        console.log('Connection Status:', status.isConnected ? '✅ Connected' : '❌ Disconnected');
        console.log('Initialization:', status.isInitialized ? '✅ Ready' : '❌ Not Ready');
        console.log('SIM Status:', status.simStatus === 'ready' ? '✅ Ready' : '❌ ' + status.simStatus);
        console.log('Signal Strength:', status.signalStrength + '/31', 
            status.signalStrength > 15 ? '(Excellent)' : 
            status.signalStrength > 10 ? '(Good)' : 
            status.signalStrength > 5 ? '(Fair)' : '(Poor)');
        console.log('━'.repeat(50));
        
        if (!status.isConnected) {
            console.log('\n❌ GSM module not connected!');
            console.log('Please check:');
            console.log('  - GSM module is connected to COM12');
            console.log('  - GSM module is powered on');
            console.log('  - USB/Serial cable is working');
            return;
        }
        
        if (!status.isInitialized) {
            console.log('\n❌ GSM module not initialized!');
            console.log('Please wait longer or check SIM card');
            return;
        }
        
        if (status.simStatus !== 'ready') {
            console.log('\n❌ SIM card not ready!');
            console.log('Please check:');
            console.log('  - SIM card is properly inserted');
            console.log('  - SIM card has credit/load');
            console.log('  - SIM card PIN is not required (or set in config)');
            return;
        }
        
        if (status.signalStrength < 5) {
            console.log('\n⚠️  Warning: Signal strength is weak!');
            console.log('SMS may fail. Consider moving GSM module to better location.');
        }
        
        // Step 3: Send SMS
        console.log('\nStep 3: Sending SMS...');
        console.log('━'.repeat(50));
        console.log('To:', TEST_PHONE_NUMBER);
        console.log('Message:', TEST_MESSAGE);
        console.log('━'.repeat(50));
        console.log('\nSending... (this may take 10-30 seconds)');
        
        const result = await gsmService.sendSMS(TEST_PHONE_NUMBER, TEST_MESSAGE);
        
        console.log('\n✅ SMS SENT SUCCESSFULLY!');
        console.log('━'.repeat(50));
        console.log('Result:', JSON.stringify(result, null, 2));
        console.log('━'.repeat(50));
        console.log('\n✅ Check your phone for the SMS!');
        console.log('Phone:', result.phoneNumber);
        console.log('Method:', result.method);
        console.log('Message ID:', result.messageId);
        
    } catch (error) {
        console.log('\n❌ SMS FAILED!');
        console.log('━'.repeat(50));
        console.log('Error:', error.message);
        console.log('━'.repeat(50));
        
        console.log('\n🔍 Troubleshooting:');
        const status = gsmService.getStatus();
        
        if (!status.isConnected) {
            console.log('  ❌ GSM module not connected');
            console.log('     → Check COM12 connection');
        }
        
        if (!status.isInitialized) {
            console.log('  ❌ GSM module not initialized');
            console.log('     → Wait for initialization or restart');
        }
        
        if (status.simStatus !== 'ready') {
            console.log('  ❌ SIM card not ready');
            console.log('     → Check SIM card insertion and credit');
        }
        
        if (status.signalStrength < 5) {
            console.log('  ⚠️  Weak signal strength');
            console.log('     → Move to location with better signal');
        }
        
        console.log('\n📱 Phone Number Tips:');
        console.log('  - Use international format: +639XXXXXXXXX');
        console.log('  - Or local format: 09XXXXXXXXX');
        console.log('  - System will auto-format Philippines numbers');
        
        console.log('\n💳 SIM Card Checklist:');
        console.log('  ✓ SIM has credit/load');
        console.log('  ✓ SIM is registered');
        console.log('  ✓ SIM is not locked with PIN');
        console.log('  ✓ SMS service is enabled');
        
    } finally {
        console.log('\n\nClosing GSM connection...');
        gsmService.close();
        console.log('Test completed.');
        process.exit(0);
    }
}

// Run the test
console.log('⚠️  IMPORTANT: Edit this file to set your phone number!');
console.log('Change TEST_PHONE_NUMBER on line 8 to your actual number\n');

if (TEST_PHONE_NUMBER === '+639123456789') {
    console.log('❌ ERROR: You must change the TEST_PHONE_NUMBER!');
    console.log('Edit test-direct-sms.js and set your actual phone number.\n');
    process.exit(1);
}

testDirectSMS().catch(console.error);
