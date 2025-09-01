const BinHistoryProcessor = require('./utils/binHistoryProcessor');

/**
 * Test script to demonstrate the bin history functionality
 */
async function testBinHistory() {
  console.log('🧪 Testing Bin History System...\n');

  // Test 1: Normal monitoring data
  console.log('📊 Test 1: Normal monitoring data');
  const normalData = {
    binId: 'bin1',
    weight: 45.2,
    distance: 30.5,
    binLevel: 65,
    gps: { lat: 14.5995, lng: 120.9842 },
    gpsValid: true,
    satellites: 8,
    errorMessage: null
  };

  const normalResult = await BinHistoryProcessor.processMonitoringData(normalData);
  console.log('Result:', normalResult);
  console.log('');

  // Test 2: GPS Error
  console.log('📊 Test 2: GPS Error');
  const gpsErrorData = {
    binId: 'bin1',
    weight: 0.074,
    distance: 61,
    binLevel: 3,
    gps: { lat: 0, lng: 0 },
    gpsValid: false,
    satellites: 0,
    errorMessage: null
  };

  const gpsErrorResult = await BinHistoryProcessor.processMonitoringData(gpsErrorData);
  console.log('Result:', gpsErrorResult);
  console.log('');

  // Test 3: Port Error
  console.log('📊 Test 3: Port Error');
  const portErrorData = {
    binId: 'bin1',
    weight: 0,
    distance: 0,
    binLevel: 0,
    gps: { lat: 0, lng: 0 },
    gpsValid: false,
    satellites: 0,
    errorMessage: 'Error opening port: [Error: Opening COM12: File not found]'
  };

  const portErrorResult = await BinHistoryProcessor.processMonitoringData(portErrorData);
  console.log('Result:', portErrorResult);
  console.log('');

  // Test 4: Modem Connection Error
  console.log('📊 Test 4: Modem Connection Error');
  const modemErrorData = {
    binId: 'bin1',
    weight: 0,
    distance: 0,
    binLevel: 0,
    gps: { lat: 0, lng: 0 },
    gpsValid: false,
    satellites: 0,
    errorMessage: 'Modem not connected, but real-time monitoring will still work'
  };

  const modemErrorResult = await BinHistoryProcessor.processMonitoringData(modemErrorData);
  console.log('Result:', modemErrorResult);
  console.log('');

  // Test 5: Malfunction (abnormal values)
  console.log('📊 Test 5: Malfunction (abnormal values)');
  const malfunctionData = {
    binId: 'bin1',
    weight: 1500, // Abnormal weight
    distance: 200,
    binLevel: 150, // Abnormal bin level
    gps: { lat: 14.5995, lng: 120.9842 },
    gpsValid: true,
    satellites: 8,
    errorMessage: null
  };

  const malfunctionResult = await BinHistoryProcessor.processMonitoringData(malfunctionData);
  console.log('Result:', malfunctionResult);
  console.log('');

  console.log('✅ All tests completed!');
}

// Run the test
testBinHistory().catch(console.error);
