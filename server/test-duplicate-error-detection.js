/**
 * Test script for duplicate error detection
 * This script tests the new duplicate error filtering functionality
 */

const hybridDataService = require('./services/hybridDataService');

async function testDuplicateErrorDetection() {
  console.log('🧪 Testing Duplicate Error Detection...\n');

  // Test data with GPS error
  const testDataWithGpsError = {
    binId: 'test-bin-1',
    weight: 50,
    distance: 30,
    binLevel: 75,
    gps: { lat: 0, lng: 0 },
    gpsValid: false,
    satellites: 0,
    errorMessage: 'GPS_INVALID: No satellite signal'
  };

  // Test data with same GPS error (should be filtered)
  const duplicateGpsError = {
    binId: 'test-bin-1',
    weight: 55,
    distance: 32,
    binLevel: 78,
    gps: { lat: 0, lng: 0 },
    gpsValid: false,
    satellites: 0,
    errorMessage: 'GPS_INVALID: No satellite signal'
  };

  // Test data with different error (should not be filtered)
  const differentError = {
    binId: 'test-bin-1',
    weight: 60,
    distance: 35,
    binLevel: 80,
    gps: { lat: 14.5995, lng: 120.9842 },
    gpsValid: true,
    satellites: 8,
    errorMessage: 'HIGH_BIN_LEVEL: Bin is 80% full'
  };

  try {
    console.log('1. Testing first GPS error (should be processed)...');
    const result1 = await hybridDataService.processIncomingData(testDataWithGpsError);
    console.log('   Result:', result1);
    console.log('   Expected: success: true, action: buffered or saved_immediately\n');

    console.log('2. Testing duplicate GPS error (should be filtered)...');
    const result2 = await hybridDataService.processIncomingData(duplicateGpsError);
    console.log('   Result:', result2);
    console.log('   Expected: success: false, reason: duplicate_error\n');

    console.log('3. Testing different error (should be processed)...');
    const result3 = await hybridDataService.processIncomingData(differentError);
    console.log('   Result:', result3);
    console.log('   Expected: success: true, action: buffered or saved_immediately\n');

    console.log('4. Testing another duplicate GPS error (should be filtered)...');
    const result4 = await hybridDataService.processIncomingData(duplicateGpsError);
    console.log('   Result:', result4);
    console.log('   Expected: success: false, reason: duplicate_error\n');

    console.log('5. Testing rate limit (should be processed if under limit)...');
    const result5 = await hybridDataService.processIncomingData({
      binId: 'test-bin-1',
      weight: 65,
      distance: 40,
      binLevel: 85,
      gps: { lat: 14.5995, lng: 120.9842 },
      gpsValid: true,
      satellites: 8,
      errorMessage: null
    });
    console.log('   Result:', result5);
    console.log('   Expected: success: true (if under daily limit)\n');

    console.log('✅ Duplicate error detection test completed!');
    console.log('\n📊 Service Statistics:');
    console.log(hybridDataService.getStats());

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDuplicateErrorDetection();
