const { admin } = require('./models/firebase');

async function testBackupCoordinates() {
  console.log('🧪 Testing GPS Backup Coordinates Storage...\n');
  
  try {
    // Get current data from bin1 in Realtime Database
    const rtdb = admin.database();
    const bin1Ref = rtdb.ref('monitoring/bin1');
    const snapshot = await bin1Ref.once('value');
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('📊 Current bin1 data from Realtime Database:');
      console.log('  - latitude:', data.latitude);
      console.log('  - longitude:', data.longitude);
      console.log('  - gps_valid:', data.gps_valid);
      console.log('  - coordinates_source:', data.coordinates_source);
      console.log('  - satellites:', data.satellites);
      console.log('');
      
      // Check if backup coordinates exist
      if (data.backup_latitude && data.backup_longitude) {
        console.log('✅ Backup coordinates found:');
        console.log('  - backup_latitude:', data.backup_latitude);
        console.log('  - backup_longitude:', data.backup_longitude);
        console.log('  - backup_timestamp:', data.backup_timestamp);
        console.log('  - backup_source:', data.backup_source);
      } else {
        console.log('❌ No backup coordinates found');
        console.log('🔧 Manually creating backup coordinates...');
        
        // Manually create backup coordinates
        const currentTime = new Date().toISOString();
        await bin1Ref.update({
          backup_latitude: data.latitude,
          backup_longitude: data.longitude,
          backup_timestamp: currentTime,
          backup_source: 'manual_test'
        });
        
        console.log('✅ Backup coordinates created successfully!');
        console.log('  - backup_latitude:', data.latitude);
        console.log('  - backup_longitude:', data.longitude);
        console.log('  - backup_timestamp:', currentTime);
        console.log('  - backup_source: manual_test');
        console.log('\n📍 Check your Firebase Realtime Database at:');
        console.log('   https://console.firebase.google.com/project/smartwaste-b3f0f/database/smartwaste-b3f0f-default-rtdb/data/monitoring/bin1');
      }
    } else {
      console.log('❌ bin1 data not found in Realtime Database');
      console.log('🔍 Make sure your ESP32 is sending data to the Realtime Database');
    }
    
  } catch (error) {
    console.error('❌ Error testing backup coordinates:', error);
  }
}

// Run the test
testBackupCoordinates().then(() => {
  console.log('\n🎉 Test completed!');
  process.exit(0);
});
