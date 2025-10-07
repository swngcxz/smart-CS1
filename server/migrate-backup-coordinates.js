const { admin } = require('./models/firebase');

async function migrateBackupCoordinates() {
  console.log('🔄 Migrating backup coordinates to separate storage...\n');
  
  try {
    const rtdb = admin.database();
    
    // Check if backup coordinates exist in bin1
    const bin1Snapshot = await rtdb.ref('monitoring/bin1').once('value');
    
    if (bin1Snapshot.exists()) {
      const bin1Data = bin1Snapshot.val();
      
      if (bin1Data.backup_latitude && bin1Data.backup_longitude) {
        console.log('📊 Found existing backup coordinates in bin1:');
        console.log('  - backup_latitude:', bin1Data.backup_latitude);
        console.log('  - backup_longitude:', bin1Data.backup_longitude);
        console.log('  - backup_timestamp:', bin1Data.backup_timestamp);
        console.log('');
        
        // Create backup storage structure
        const backupRef = rtdb.ref('monitoring/backup/bin1');
        await backupRef.set({
          backup_latitude: bin1Data.backup_latitude,
          backup_longitude: bin1Data.backup_longitude,
          backup_timestamp: bin1Data.backup_timestamp,
          backup_source: bin1Data.backup_source || 'migrated_from_bin1',
          original_bin_id: 'bin1',
          created_at: new Date().toISOString(),
          migrated_at: new Date().toISOString()
        });
        
        console.log('✅ Successfully migrated backup coordinates to separate storage:');
        console.log('   📍 Location: monitoring/backup/bin1');
        console.log('   🔒 Protected from ESP32 overwrites');
        console.log('');
        
        // Remove backup coordinates from bin1 to avoid duplication
        await rtdb.ref('monitoring/bin1').update({
          backup_latitude: null,
          backup_longitude: null,
          backup_timestamp: null,
          backup_source: null
        });
        
        console.log('🧹 Cleaned up backup coordinates from bin1 document');
        console.log('📍 Check your Firebase Realtime Database:');
        console.log('   - Live data: monitoring/bin1');
        console.log('   - Backup data: monitoring/backup/bin1');
        
      } else {
        console.log('❌ No backup coordinates found in bin1');
        console.log('🔧 Creating initial backup storage structure...');
        
        // Create empty backup structure
        const backupRef = rtdb.ref('monitoring/backup/bin1');
        await backupRef.set({
          backup_latitude: null,
          backup_longitude: null,
          backup_timestamp: null,
          backup_source: 'initialized',
          original_bin_id: 'bin1',
          created_at: new Date().toISOString()
        });
        
        console.log('✅ Created backup storage structure at monitoring/backup/bin1');
      }
    } else {
      console.log('❌ bin1 document not found');
    }
    
  } catch (error) {
    console.error('❌ Error migrating backup coordinates:', error);
  }
}

// Run the migration
migrateBackupCoordinates().then(() => {
  console.log('\n🎉 Migration completed!');
  process.exit(0);
});
