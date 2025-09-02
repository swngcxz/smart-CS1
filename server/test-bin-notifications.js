const binNotificationController = require('./controllers/binNotificationController');

/**
 * Test script to demonstrate the bin notification functionality
 */
async function testBinNotifications() {
  console.log('🧪 Testing Bin Notification System...\n');

  // Test 1: Bin almost full (85%)
  console.log('📊 Test 1: Bin almost full (85%)');
  const fullBinData = {
    binId: 'bin1',
    binLevel: 85,
    status: 'OK',
    gps: { lat: 10.2901, lng: 123.8810 },
    timestamp: new Date(),
    weight: 45.2,
    distance: 30.5,
    gpsValid: true,
    satellites: 8,
    errorMessage: null
  };

  const fullBinResult = await binNotificationController.checkBinAndNotify(fullBinData);
  console.log('Result:', fullBinResult);
  console.log('');

  // Test 2: Bin error status
  console.log('📊 Test 2: Bin error status');
  const errorBinData = {
    binId: 'bin1',
    binLevel: 45,
    status: 'ERROR',
    gps: { lat: 10.2901, lng: 123.8810 },
    timestamp: new Date(),
    weight: 45.2,
    distance: 30.5,
    gpsValid: false,
    satellites: 0,
    errorMessage: 'GPS signal invalid or no satellites detected'
  };

  const errorBinResult = await binNotificationController.checkBinAndNotify(errorBinData);
  console.log('Result:', errorBinResult);
  console.log('');

  // Test 3: Bin malfunction
  console.log('📊 Test 3: Bin malfunction');
  const malfunctionBinData = {
    binId: 'bin1',
    binLevel: 150, // Abnormal value
    status: 'MALFUNCTION',
    gps: { lat: 10.2901, lng: 123.8810 },
    timestamp: new Date(),
    weight: 1500, // Abnormal weight
    distance: 200,
    gpsValid: true,
    satellites: 8,
    errorMessage: 'Weight reading abnormal: 1500 kg'
  };

  const malfunctionBinResult = await binNotificationController.checkBinAndNotify(malfunctionBinData);
  console.log('Result:', malfunctionBinResult);
  console.log('');

  // Test 4: GPS error
  console.log('📊 Test 4: GPS error');
  const gpsErrorBinData = {
    binId: 'bin1',
    binLevel: 65,
    status: 'OK',
    gps: { lat: 0, lng: 0 },
    timestamp: new Date(),
    weight: 45.2,
    distance: 30.5,
    gpsValid: false,
    satellites: 0,
    errorMessage: null
  };

  const gpsErrorBinResult = await binNotificationController.checkBinAndNotify(gpsErrorBinData);
  console.log('Result:', gpsErrorBinResult);
  console.log('');

  // Test 5: Connection error
  console.log('📊 Test 5: Connection error');
  const connectionErrorBinData = {
    binId: 'bin1',
    binLevel: 0,
    status: 'ERROR',
    gps: { lat: 0, lng: 0 },
    timestamp: new Date(),
    weight: 0,
    distance: 0,
    gpsValid: false,
    satellites: 0,
    errorMessage: 'Error opening port: [Error: Opening COM12: File not found]'
  };

  const connectionErrorBinResult = await binNotificationController.checkBinAndNotify(connectionErrorBinData);
  console.log('Result:', connectionErrorBinResult);
  console.log('');

  // Test 6: Normal bin (no notification needed)
  console.log('📊 Test 6: Normal bin (no notification needed)');
  const normalBinData = {
    binId: 'bin1',
    binLevel: 45,
    status: 'OK',
    gps: { lat: 10.2901, lng: 123.8810 },
    timestamp: new Date(),
    weight: 45.2,
    distance: 30.5,
    gpsValid: true,
    satellites: 8,
    errorMessage: null
  };

  const normalBinResult = await binNotificationController.checkBinAndNotify(normalBinData);
  console.log('Result:', normalBinResult);
  console.log('');

  console.log('✅ All tests completed!');
}

// Run the test
testBinNotifications().catch(console.error);

