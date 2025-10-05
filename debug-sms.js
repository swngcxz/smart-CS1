const gsmService = require('./server/services/gsmService');
const smsService = require('./server/services/smsNotificationService');

async function debugSMS() {
  try {
    console.log('🔍 Debugging SMS System...\n');
    
    // 1. Test GSM service status
    console.log('1️⃣ Testing GSM Service Status:');
    const gsmStatus = gsmService.getStatus();
    console.log('GSM Status:', gsmStatus);
    console.log('');
    
    // 2. Test GSM connection
    console.log('2️⃣ Testing GSM Connection:');
    const connectionTest = await gsmService.testConnection();
    console.log('Connection Test:', connectionTest);
    console.log('');
    
    // 3. Test SMS service status
    console.log('3️⃣ Testing SMS Service Status:');
    const smsStatus = smsService.getStatus();
    console.log('SMS Status:', smsStatus);
    console.log('');
    
    // 4. Test janitor lookup
    console.log('4️⃣ Testing Janitor Lookup:');
    try {
      const janitor = await smsService.getJanitorDetails('a7vym9uR6oqhh7wXNBwp');
      console.log('Janitor Found:', {
        id: janitor.id,
        name: janitor.fullName,
        contactNumber: janitor.contactNumber
      });
    } catch (error) {
      console.error('Janitor Lookup Error:', error.message);
    }
    console.log('');
    
    // 5. Test SMS sending
    console.log('5️⃣ Testing SMS Sending:');
    const testResult = await smsService.sendManualTaskSMS({
      binName: 'Debug Test Bin',
      binLocation: 'Debug Location',
      binLevel: 85,
      weight: 50,
      height: 75,
      coordinates: { latitude: 10.2105, longitude: 123.7583 },
      taskNotes: 'Debug test message',
      assignedBy: 'Debug Staff'
    }, 'a7vym9uR6oqhh7wXNBwp');
    
    console.log('SMS Test Result:', testResult);
    console.log('');
    
    // 6. Summary
    console.log('📊 Summary:');
    console.log(`- GSM Connected: ${gsmStatus.isConnected}`);
    console.log(`- GSM Initialized: ${gsmStatus.isInitialized}`);
    console.log(`- SMS Service Ready: ${smsStatus.isInitialized}`);
    console.log(`- SMS Test Result: ${testResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (!testResult.success) {
      console.log('\n❌ Issues Found:');
      if (!gsmStatus.isConnected) console.log('  - GSM module not connected');
      if (!gsmStatus.isInitialized) console.log('  - GSM module not initialized');
      if (testResult.error) console.log(`  - SMS Error: ${testResult.error}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    gsmService.close();
    console.log('\n🔌 GSM connection closed');
  }
}

debugSMS();
