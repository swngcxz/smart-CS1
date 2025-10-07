const { admin } = require('./models/firebase');

async function fixTimezone() {
  console.log('🕐 Fixing timezone issues...\n');
  
  try {
    // Get current data from bin1
    const rtdb = admin.database();
    const bin1Ref = rtdb.ref('monitoring/bin1');
    const snapshot = await bin1Ref.once('value');
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('📊 Current data:');
      console.log('  - gps_timestamp:', data.gps_timestamp);
      console.log('  - last_active:', data.last_active);
      console.log('  - backup_timestamp:', data.backup_timestamp);
      console.log('');
      
      // Get current time in Philippines timezone (UTC+8)
      const now = new Date();
      const philippinesTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
      const formattedTime = philippinesTime.toISOString().replace('T', ' ').replace('Z', '');
      
      console.log('🕐 Current Philippines time (UTC+8):', formattedTime);
      console.log('🕐 Current UTC time:', now.toISOString());
      console.log('');
      
      // Update timestamps to current Philippines time
      await bin1Ref.update({
        last_active: formattedTime,
        gps_timestamp: formattedTime,
        backup_timestamp: now.toISOString(), // Keep backup timestamp in UTC
        timezone_fixed: true,
        timezone_offset: '+08:00'
      });
      
      console.log('✅ Timestamps updated to Philippines timezone (UTC+8)');
      console.log('📍 Check your Firebase Realtime Database to see the updated timestamps');
      
    } else {
      console.log('❌ bin1 data not found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing timezone:', error);
  }
}

// Run the fix
fixTimezone().then(() => {
  console.log('\n🎉 Timezone fix completed!');
  process.exit(0);
});
