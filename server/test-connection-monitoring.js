/**
 * Test script for bin connection monitoring
 * This script tests the connection monitoring and error logging functionality
 */

const binConnectionMonitor = require('./services/binConnectionMonitor');

async function testConnectionMonitoring() {
  console.log('🧪 Testing Bin Connection Monitoring...\n');

  try {
    // Test 1: Start monitoring
    console.log('1. Starting connection monitoring...');
    binConnectionMonitor.startMonitoring();
    console.log('   ✅ Monitoring started\n');

    // Test 2: Get initial stats
    console.log('2. Getting initial monitoring stats...');
    const initialStats = binConnectionMonitor.getStats();
    console.log('   Stats:', initialStats);
    console.log('   ✅ Stats retrieved\n');

    // Test 3: Check all connections
    console.log('3. Checking all bin connections...');
    await binConnectionMonitor.checkAllBinConnections();
    console.log('   ✅ Connection check completed\n');

    // Test 4: Get connection statuses
    console.log('4. Getting connection statuses...');
    const statuses = binConnectionMonitor.getAllConnectionStatuses();
    console.log('   Statuses:', statuses);
    console.log('   ✅ Statuses retrieved\n');

    // Test 5: Test specific bin check (if bins exist)
    const allStatuses = binConnectionMonitor.getAllConnectionStatuses();
    const binIds = Object.keys(allStatuses);
    
    if (binIds.length > 0) {
      const testBinId = binIds[0];
      console.log(`5. Testing specific bin check for ${testBinId}...`);
      await binConnectionMonitor.triggerConnectionCheck(testBinId);
      console.log('   ✅ Specific bin check completed\n');
    } else {
      console.log('5. No bins found to test specific bin check\n');
    }

    // Test 6: Wait a bit and check stats again
    console.log('6. Waiting 5 seconds and checking stats again...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    const updatedStats = binConnectionMonitor.getStats();
    console.log('   Updated stats:', updatedStats);
    console.log('   ✅ Stats updated\n');

    // Test 7: Stop monitoring
    console.log('7. Stopping connection monitoring...');
    binConnectionMonitor.stopMonitoring();
    console.log('   ✅ Monitoring stopped\n');

    console.log('✅ Connection monitoring test completed successfully!');
    console.log('\n📊 Final Statistics:');
    console.log(binConnectionMonitor.getStats());

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testConnectionMonitoring();
