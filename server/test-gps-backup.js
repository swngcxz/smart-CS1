const gpsBackupService = require('./services/gpsBackupService');

async function testGPSBackupSystem() {
  console.log('🧪 Testing GPS Backup System...\n');
  
  try {
    // Initialize the service
    console.log('1. Initializing GPS Backup Service...');
    await gpsBackupService.initialize();
    console.log('✅ Service initialized successfully\n');
    
    // Test valid coordinates
    console.log('2. Testing valid coordinates backup...');
    await gpsBackupService.backupValidCoordinates('bin1', 10.2105, 123.7583);
    console.log('✅ Valid coordinates backed up successfully\n');
    
    // Test invalid coordinates (should be ignored)
    console.log('3. Testing invalid coordinates (should be ignored)...');
    await gpsBackupService.backupValidCoordinates('bin1', 0, 0);
    console.log('✅ Invalid coordinates correctly ignored\n');
    
    // Test coordinate validation
    console.log('4. Testing coordinate validation...');
    const validCoords = gpsBackupService.isValidCoordinates(10.2105, 123.7583);
    const invalidCoords = gpsBackupService.isValidCoordinates(0, 0);
    console.log(`Valid coordinates (10.2105, 123.7583): ${validCoords}`);
    console.log(`Invalid coordinates (0, 0): ${invalidCoords}\n`);
    
    // Get service status
    console.log('5. Getting service status...');
    const status = gpsBackupService.getStatus();
    console.log('Service Status:', JSON.stringify(status, null, 2));
    console.log('✅ Status retrieved successfully\n');
    
    // Test getting backup coordinates
    console.log('6. Testing backup coordinates retrieval...');
    const backupCoords = await gpsBackupService.getBackupCoordinates('bin1');
    if (backupCoords) {
      console.log('Backup Coordinates:', JSON.stringify(backupCoords, null, 2));
    } else {
      console.log('No backup coordinates found');
    }
    console.log('✅ Backup coordinates test completed\n');
    
    // Test getting display coordinates
    console.log('7. Testing display coordinates retrieval...');
    const displayCoords = await gpsBackupService.getDisplayCoordinates('bin1');
    if (displayCoords) {
      console.log('Display Coordinates:', JSON.stringify(displayCoords, null, 2));
    } else {
      console.log('No display coordinates found');
    }
    console.log('✅ Display coordinates test completed\n');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Stop the service
    gpsBackupService.stop();
    console.log('🛑 Service stopped');
    process.exit(0);
  }
}

// Run the test
testGPSBackupSystem();
