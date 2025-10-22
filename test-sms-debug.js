const { db } = require('./server/models/firebase');
const smsNotificationService = require('./server/services/smsNotificationService');

async function testSMS() {
  try {
    console.log('🧪 Testing SMS Notification Service...');
    
    // Initialize SMS service
    await smsNotificationService.initialize();
    console.log('✅ SMS service initialized');
    
    // Test janitor details fetch
    const janitorId = 'a7vym9uR6oqhh7wXNBwp';
    console.log(`\n📋 Fetching janitor details for ID: ${janitorId}`);
    
    const janitor = await smsNotificationService.getJanitorDetails(janitorId);
    console.log('📋 Janitor details:', janitor);
    
    // Test SMS sending
    console.log('\n📱 Testing SMS sending...');
    const result = await smsNotificationService.sendManualTaskSMS({
      binName: 'Test Bin',
      binLocation: 'Test Location',
      binLevel: 85,
      weight: 50,
      height: 75,
      coordinates: { latitude: 10.2105, longitude: 123.7583 },
      taskNotes: 'Test task notes',
      assignedBy: 'Test Staff'
    }, janitorId);
    
    console.log('\n📱 SMS Result:', result);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSMS();
