const { admin } = require('./models/firebase');

async function testSeparateBackupStorage() {
  console.log('🧪 Testing separate backup storage system...\n');
  
  try {
    const rtdb = admin.database();
    
    // 1. Check current bin1 data
    console.log('📊 Current bin1 data:');
    const bin1Snapshot = await rtdb.ref('monitoring/bin1').once('value');
    if (bin1Snapshot.exists()) {
      const bin1Data = bin1Snapshot.val();
      console.log('  - latitude:', bin1Data.latitude);
      console.log('  - longitude:', bin1Data.longitude);
      console.log('  - gps_valid:', bin1Data.gps_valid);
      console.log('  - coordinates_source:', bin1Data.coordinates_source);
      console.log('  - backup_latitude:', bin1Data.backup_latitude || 'NOT FOUND');
      console.log('  - backup_longitude:', bin1Data.backup_longitude || 'NOT FOUND');
    } else {
      console.log('  ❌ bin1 data not found');
    }
    console.log('');
    
    // 2. Check separate backup storage
    console.log('🔒 Separate backup storage:');
    const backupSnapshot = await rtdb.ref('monitoring/backup/bin1').once('value');
    if (backupSnapshot.exists()) {
      const backupData = backupSnapshot.val();
      console.log('  - backup_latitude:', backupData.backup_latitude || 'NOT FOUND');
      console.log('  - backup_longitude:', backupData.backup_longitude || 'NOT FOUND');
      console.log('  - backup_timestamp:', backupData.backup_timestamp || 'NOT FOUND');
      console.log('  - backup_source:', backupData.backup_source || 'NOT FOUND');
      console.log('  - original_bin_id:', backupData.original_bin_id || 'NOT FOUND');
    } else {
      console.log('  ❌ Backup storage not found');
    }
    console.log('');
    
    // 3. Test the GPS backup service API
    console.log('🔧 Testing GPS backup service API...');
    const gpsBackupService = require('./services/gpsBackupService');
    
    try {
      const displayCoordinates = await gpsBackupService.getDisplayCoordinates('bin1');
      if (displayCoordinates) {
        console.log('  ✅ Display coordinates retrieved:');
        console.log('    - latitude:', displayCoordinates.latitude);
        console.log('    - longitude:', displayCoordinates.longitude);
        console.log('    - source:', displayCoordinates.source);
        console.log('    - gps_valid:', displayCoordinates.gps_valid);
      } else {
        console.log('  ❌ No display coordinates found');
      }
    } catch (error) {
      console.log('  ❌ Error getting display coordinates:', error.message);
    }
    console.log('');
    
    // 4. Simulate ESP32 overwrite (this should NOT affect backup storage)
    console.log('🔄 Simulating ESP32 data overwrite...');
    const testData = {
      latitude: 10.999999,
      longitude: 123.999999,
      gps_valid: true,
      coordinates_source: 'gps_live',
      bin_level: 50,
      timestamp: Date.now()
    };
    
    await rtdb.ref('monitoring/bin1').set(testData);
    console.log('  ✅ ESP32 data overwrite simulated');
    
    // 5. Check if backup storage is still intact
    console.log('🔍 Checking if backup storage survived ESP32 overwrite...');
    const backupAfterOverwrite = await rtdb.ref('monitoring/backup/bin1').once('value');
    if (backupAfterOverwrite.exists()) {
      const backupData = backupAfterOverwrite.val();
      console.log('  ✅ Backup storage survived!');
      console.log('    - backup_latitude:', backupData.backup_latitude);
      console.log('    - backup_longitude:', backupData.backup_longitude);
      console.log('    - backup_timestamp:', backupData.backup_timestamp);
    } else {
      console.log('  ❌ Backup storage was affected by ESP32 overwrite');
    }
    console.log('');
    
    console.log('📍 Database structure:');
    console.log('  - Live data: monitoring/bin1 (gets overwritten by ESP32)');
    console.log('  - Backup data: monitoring/backup/bin1 (protected from ESP32)');
    console.log('  - API endpoint: /api/gps-backup/display/bin1');
    
  } catch (error) {
    console.error('❌ Error testing separate backup storage:', error);
  }
}

// Run the test
testSeparateBackupStorage().then(() => {
  console.log('\n🎉 Test completed!');
  process.exit(0);
});
