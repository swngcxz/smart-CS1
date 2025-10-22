const gsmService = require('./server/services/gsmService');

async function testGSMModule() {
  try {
    console.log('🔧 Testing GSM Module Connection...');
    
    // Initialize GSM service
    await gsmService.initialize();
    console.log('✅ GSM service initialized');
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test connection
    const connectionTest = await gsmService.testConnection();
    console.log('📡 Connection test result:', connectionTest);
    
    // Get status
    const status = gsmService.getStatus();
    console.log('📊 GSM Status:', status);
    
    if (status.isConnected && status.isInitialized) {
      console.log('🎉 GSM module is ready for SMS sending!');
      
      // Test SMS sending (replace with your phone number)
      const testPhoneNumber = '+639606388228'; // Replace with your phone number
      const testMessage = 'Test SMS from SmartBin GSM Module - ' + new Date().toLocaleString();
      
      console.log(`📱 Sending test SMS to ${testPhoneNumber}...`);
      const smsResult = await gsmService.sendSMSWithFallback(testPhoneNumber, testMessage);
      console.log('📱 SMS Result:', smsResult);
      
    } else {
      console.log('❌ GSM module is not ready. Please check:');
      console.log('  1. GSM module is connected to COM12');
      console.log('  2. SIM card is inserted and has credit');
      console.log('  3. Module is powered on');
      console.log('  4. No other application is using COM12');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close connection
    gsmService.close();
    console.log('🔌 GSM connection closed');
  }
}

testGSMModule();
