const dynamicBinStatusService = require('./services/dynamicBinStatusService');

function testThresholds() {
  console.log('🧪 Testing New GPS Status Thresholds...\n');
  
  const now = new Date();
  
  // Test scenarios
  const scenarios = [
    {
      name: 'Fresh Data (30 seconds ago)',
      timestamp: new Date(now.getTime() - 30 * 1000).toISOString(),
      expectedStatus: 'live'
    },
    {
      name: 'Stale Data (2 minutes ago)',
      timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
      expectedStatus: 'stale'
    },
    {
      name: 'Offline Data (10 minutes ago)',
      timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      expectedStatus: 'offline'
    },
    {
      name: 'Very Fresh Data (10 seconds ago)',
      timestamp: new Date(now.getTime() - 10 * 1000).toISOString(),
      expectedStatus: 'live'
    },
    {
      name: 'Just Stale Data (1.5 minutes ago)',
      timestamp: new Date(now.getTime() - 1.5 * 60 * 1000).toISOString(),
      expectedStatus: 'stale'
    },
    {
      name: 'Just Offline Data (6 minutes ago)',
      timestamp: new Date(now.getTime() - 6 * 60 * 1000).toISOString(),
      expectedStatus: 'offline'
    }
  ];
  
  console.log('📊 Threshold Configuration:');
  console.log('  - Fresh Data: < 1 minute');
  console.log('  - Stale Data: 1-5 minutes');
  console.log('  - Offline Data: > 5 minutes');
  console.log('');
  
  scenarios.forEach((scenario, index) => {
    console.log(`🎯 Test ${index + 1}: ${scenario.name}`);
    
    // Create mock GPS data
    const mockGpsData = {
      latitude: 10.243723,
      longitude: 123.787124,
      gps_valid: true,
      gps_timeout: false,
      coordinates_source: 'gps_live',
      satellites: 8,
      last_active: scenario.timestamp,
      gps_timestamp: scenario.timestamp
    };
    
    // Get dynamic status
    const status = dynamicBinStatusService.getDynamicBinStatus('bin1', mockGpsData);
    
    // Calculate time difference
    const timeDiff = now.getTime() - new Date(scenario.timestamp).getTime();
    const minutesAgo = Math.floor(timeDiff / (1000 * 60));
    const secondsAgo = Math.floor(timeDiff / 1000);
    
    console.log(`  📅 Timestamp: ${scenario.timestamp}`);
    console.log(`  ⏰ Time Ago: ${secondsAgo} seconds (${minutesAgo} minutes)`);
    console.log(`  🎯 Expected: ${scenario.expectedStatus}`);
    console.log(`  ✅ Actual: ${status.status}`);
    console.log(`  📍 Coordinates Source: ${status.coordinatesSource}`);
    console.log(`  🛰️ GPS Valid: ${status.gpsValid}`);
    
    // Check if result matches expectation
    const isCorrect = status.status === scenario.expectedStatus;
    console.log(`  ${isCorrect ? '✅' : '❌'} Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    console.log('');
  });
  
  console.log('📋 Summary:');
  console.log('  ✅ Fresh Data (< 1 min): Shows green "Live GPS"');
  console.log('  ⚠️ Stale Data (1-5 min): Shows orange "Stale GPS"');
  console.log('  ❌ Offline Data (> 5 min): Shows grey "Offline GPS"');
  console.log('');
  console.log('🎉 Threshold testing completed!');
}

// Run the test
testThresholds();
