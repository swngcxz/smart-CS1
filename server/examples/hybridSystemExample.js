/**
 * Hybrid Data Storage System - Example Usage
 * This file demonstrates how to use the hybrid data storage system
 */

const hybridDataService = require('../services/hybridDataService');
const hybridMonitoringService = require('../services/hybridMonitoringService');
const { getConfig, updateConfig } = require('../config/hybridConfig');

/**
 * Example 1: Basic Data Processing
 */
async function exampleBasicProcessing() {
  console.log('\n=== Example 1: Basic Data Processing ===');
  
  // Simulate incoming hardware data
  const hardwareData = {
    binId: 'bin1',
    weight: 45.2,
    distance: 25.5,
    binLevel: 75,
    gps: { lat: 10.3157, lng: 123.8854 },
    gpsValid: true,
    satellites: 8,
    errorMessage: null
  };

  // Process data through hybrid service
  const result = await hybridDataService.processIncomingData(hardwareData);
  console.log('Processing result:', result);
  
  // Get latest data from buffer
  const latestData = hybridDataService.getLatestData('bin1');
  console.log('Latest buffered data:', latestData);
}

/**
 * Example 2: Critical Error Handling
 */
async function exampleCriticalError() {
  console.log('\n=== Example 2: Critical Error Handling ===');
  
  // Simulate critical error data
  const criticalData = {
    binId: 'bin1',
    weight: 0,
    distance: 0,
    binLevel: 0,
    gps: { lat: 0, lng: 0 },
    gpsValid: false,
    satellites: 0,
    errorMessage: 'SENSOR_FAILURE: Weight sensor malfunction detected'
  };

  const result = await hybridDataService.processIncomingData(criticalData);
  console.log('Critical error processing:', result);
}

/**
 * Example 3: High Bin Level Warning
 */
async function exampleHighBinLevel() {
  console.log('\n=== Example 3: High Bin Level Warning ===');
  
  // Simulate high bin level data
  const warningData = {
    binId: 'bin1',
    weight: 85.7,
    distance: 5.2,
    binLevel: 92, // High level - should trigger warning
    gps: { lat: 10.3157, lng: 123.8854 },
    gpsValid: true,
    satellites: 6,
    errorMessage: null
  };

  const result = await hybridDataService.processIncomingData(warningData);
  console.log('Warning data processing:', result);
}

/**
 * Example 4: Configuration Management
 */
function exampleConfigurationManagement() {
  console.log('\n=== Example 4: Configuration Management ===');
  
  // Get current configuration
  const currentInterval = getConfig('intervals.NORMAL_DATA_INTERVAL');
  console.log('Current normal data interval:', currentInterval);
  
  // Update configuration for testing
  updateConfig('intervals.NORMAL_DATA_INTERVAL', 1 * 60 * 1000); // 1 minute
  console.log('Updated normal data interval to 1 minute');
  
  // Get updated configuration
  const updatedInterval = getConfig('intervals.NORMAL_DATA_INTERVAL');
  console.log('Updated normal data interval:', updatedInterval);
}

/**
 * Example 5: Monitoring and Alerts
 */
async function exampleMonitoring() {
  console.log('\n=== Example 5: Monitoring and Alerts ===');
  
  // Start monitoring
  hybridMonitoringService.startMonitoring();
  
  // Simulate some data processing
  for (let i = 0; i < 10; i++) {
    const data = {
      binId: 'bin1',
      weight: Math.random() * 100,
      distance: Math.random() * 50,
      binLevel: Math.random() * 100,
      gps: { lat: 10.3157, lng: 123.8854 },
      gpsValid: true,
      satellites: 8,
      errorMessage: null
    };
    
    const result = await hybridDataService.processIncomingData(data);
    hybridMonitoringService.recordEvent(result);
  }
  
  // Get metrics
  const metrics = hybridMonitoringService.getMetrics();
  console.log('System metrics:', metrics);
  
  // Get active alerts
  const alerts = hybridMonitoringService.getActiveAlerts();
  console.log('Active alerts:', alerts);
  
  // Generate report
  const report = hybridMonitoringService.generateReport();
  console.log('System report:', report);
}

/**
 * Example 6: Batch Processing Simulation
 */
async function exampleBatchProcessing() {
  console.log('\n=== Example 6: Batch Processing Simulation ===');
  
  // Simulate multiple data points
  const dataPoints = [];
  for (let i = 0; i < 50; i++) {
    dataPoints.push({
      binId: `bin${(i % 3) + 1}`,
      weight: Math.random() * 100,
      distance: Math.random() * 50,
      binLevel: Math.random() * 100,
      gps: { lat: 10.3157, lng: 123.8854 },
      gpsValid: true,
      satellites: 8,
      errorMessage: null
    });
  }
  
  // Process all data points
  const results = [];
  for (const data of dataPoints) {
    const result = await hybridDataService.processIncomingData(data);
    results.push(result);
    hybridMonitoringService.recordEvent(result);
  }
  
  console.log(`Processed ${results.length} data points`);
  
  // Get statistics
  const stats = hybridDataService.getStats();
  console.log('Hybrid service stats:', stats);
  
  // Force process all buffered data
  const batchResults = await hybridDataService.forceProcessAll();
  console.log('Batch processing results:', batchResults);
}

/**
 * Example 7: Error Scenarios
 */
async function exampleErrorScenarios() {
  console.log('\n=== Example 7: Error Scenarios ===');
  
  // Test validation errors
  const invalidData = {
    binId: 'bin1',
    weight: -10, // Invalid weight
    distance: 25.5,
    binLevel: 150, // Invalid bin level
    gps: { lat: 0, lng: 0 },
    gpsValid: false,
    satellites: 0,
    errorMessage: null
  };
  
  const validationResult = await hybridDataService.processIncomingData(invalidData);
  console.log('Validation error result:', validationResult);
  
  // Test missing required fields
  const missingFieldsData = {
    // Missing binId
    weight: 45.2,
    distance: 25.5,
    binLevel: 75
  };
  
  const missingFieldsResult = await hybridDataService.processIncomingData(missingFieldsData);
  console.log('Missing fields result:', missingFieldsResult);
}

/**
 * Example 8: Performance Testing
 */
async function examplePerformanceTesting() {
  console.log('\n=== Example 8: Performance Testing ===');
  
  const startTime = Date.now();
  const dataCount = 1000;
  
  // Generate test data
  const testData = [];
  for (let i = 0; i < dataCount; i++) {
    testData.push({
      binId: `bin${(i % 10) + 1}`,
      weight: Math.random() * 100,
      distance: Math.random() * 50,
      binLevel: Math.random() * 100,
      gps: { lat: 10.3157, lng: 123.8854 },
      gpsValid: true,
      satellites: 8,
      errorMessage: null
    });
  }
  
  // Process data
  const results = [];
  for (const data of testData) {
    const result = await hybridDataService.processIncomingData(data);
    results.push(result);
  }
  
  const endTime = Date.now();
  const processingTime = endTime - startTime;
  
  console.log(`Processed ${dataCount} records in ${processingTime}ms`);
  console.log(`Average processing time: ${processingTime / dataCount}ms per record`);
  
  // Get final statistics
  const stats = hybridDataService.getStats();
  console.log('Final statistics:', stats);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    console.log('🚀 Starting Hybrid Data Storage System Examples\n');
    
    await exampleBasicProcessing();
    await exampleCriticalError();
    await exampleHighBinLevel();
    exampleConfigurationManagement();
    await exampleMonitoring();
    await exampleBatchProcessing();
    await exampleErrorScenarios();
    await examplePerformanceTesting();
    
    console.log('\n✅ All examples completed successfully!');
    
    // Cleanup
    await hybridDataService.shutdown();
    hybridMonitoringService.stopMonitoring();
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export examples for individual use
module.exports = {
  exampleBasicProcessing,
  exampleCriticalError,
  exampleHighBinLevel,
  exampleConfigurationManagement,
  exampleMonitoring,
  exampleBatchProcessing,
  exampleErrorScenarios,
  examplePerformanceTesting,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

