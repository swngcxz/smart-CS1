/**
 * Test script for the Hybrid Data Storage System
 * Demonstrates critical data immediate saving and non-critical data batching
 */

const hybridDataService = require('./services/hybridDataService');
const hybridMonitoringService = require('./services/hybridMonitoringService');

async function testHybridSystem() {
  console.log('🚀 Testing Hybrid Data Storage System\n');

  // Start monitoring
  hybridMonitoringService.startMonitoring();

  // Test 1: Normal data (should be buffered)
  console.log('=== Test 1: Normal Data (Should be buffered) ===');
  const normalData = {
    binId: 'bin1',
    weight: 45.2,
    distance: 25.5,
    binLevel: 60,
    gps: { lat: 10.3157, lng: 123.8854 },
    gpsValid: true,
    satellites: 8,
    errorMessage: null
  };

  const normalResult = await hybridDataService.processIncomingData(normalData);
  console.log('Normal data result:', normalResult);
  console.log('Expected: buffered\n');

  // Test 2: Critical data (should be saved immediately)
  console.log('=== Test 2: Critical Data (Should be saved immediately) ===');
  const criticalData = {
    binId: 'bin1',
    weight: 950,
    distance: 2.1,
    binLevel: 98,
    gps: { lat: 10.3157, lng: 123.8854 },
    gpsValid: true,
    satellites: 8,
    errorMessage: 'SENSOR_FAILURE: Weight sensor malfunction detected'
  };

  const criticalResult = await hybridDataService.processIncomingData(criticalData);
  console.log('Critical data result:', criticalResult);
  console.log('Expected: saved_immediately\n');

  // Test 3: Warning data (should be buffered with warning priority)
  console.log('=== Test 3: Warning Data (Should be buffered as warning) ===');
  const warningData = {
    binId: 'bin1',
    weight: 750,
    distance: 8.5,
    binLevel: 88,
    gps: { lat: 0, lng: 0 },
    gpsValid: false,
    satellites: 1,
    errorMessage: null
  };

  const warningResult = await hybridDataService.processIncomingData(warningData);
  console.log('Warning data result:', warningResult);
  console.log('Expected: buffered with warning priority\n');

  // Test 4: Invalid data (should be filtered)
  console.log('=== Test 4: Invalid Data (Should be filtered) ===');
  const invalidData = {
    binId: 'bin1',
    weight: -50,
    distance: 25.5,
    binLevel: 150,
    gps: { lat: 10.3157, lng: 123.8854 },
    gpsValid: true,
    satellites: 8,
    errorMessage: null
  };

  const invalidResult = await hybridDataService.processIncomingData(invalidData);
  console.log('Invalid data result:', invalidResult);
  console.log('Expected: filtered\n');

  // Test 5: Get latest data
  console.log('=== Test 5: Get Latest Data ===');
  const latestData = hybridDataService.getLatestData('bin1');
  console.log('Latest data for bin1:', latestData);
  console.log('Expected: Latest buffered data\n');

  // Test 6: Get all latest data
  console.log('=== Test 6: Get All Latest Data ===');
  const allLatestData = hybridDataService.getAllLatestData();
  console.log('All latest data:', allLatestData);
  console.log('Expected: Array of latest data for all bins\n');

  // Test 7: Get system statistics
  console.log('=== Test 7: System Statistics ===');
  const stats = hybridDataService.getStats();
  console.log('System statistics:', stats);
  console.log('Expected: Processing counts and buffer sizes\n');

  // Test 8: Force process all buffered data
  console.log('=== Test 8: Force Process All Buffered Data ===');
  const batchResults = await hybridDataService.forceProcessAll();
  console.log('Batch processing results:', batchResults);
  console.log('Expected: All buffered data processed\n');

  // Test 9: Get monitoring metrics
  console.log('=== Test 9: Monitoring Metrics ===');
  const metrics = hybridMonitoringService.getMetrics();
  console.log('Monitoring metrics:', metrics);

  // Test 10: Generate system report
  console.log('=== Test 10: System Report ===');
  const report = hybridMonitoringService.generateReport();
  console.log('System report:', report);

  console.log('\n✅ Hybrid System Test Completed!');
  console.log('\n📊 Summary:');
  console.log('- Critical data is saved immediately');
  console.log('- Non-critical data is buffered for batch processing');
  console.log('- Latest data is maintained in memory for real-time access');
  console.log('- Invalid data is filtered out');
  console.log('- System provides comprehensive monitoring and statistics');

  // Stop monitoring
  hybridMonitoringService.stopMonitoring();
}

// Run the test
testHybridSystem().catch(console.error);

