const https = require('https');

async function testFirebaseURLs() {
  console.log('🧪 Testing Firebase URLs accessibility...\n');
  
  const urls = [
    'https://smartwaste-b3f0f-default-rtdb.firebaseio.com/monitoring/bin1.json',
    'https://smartbin-75fc3-default-rtdb.asia-southeast1.firebasedatabase.app/monitoring/data.json'
  ];
  
  for (const url of urls) {
    console.log(`🔍 Testing: ${url}`);
    
    try {
      const response = await makeRequest(url, 'GET');
      console.log(`  ✅ Status: ${response.status}`);
      console.log(`  📊 Data: ${response.data ? 'Available' : 'Empty'}`);
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }
  
  // Test with sample data
  console.log('🧪 Testing with sample data...');
  const sampleData = {
    weight_kg: 0.001,
    weight_percent: 0,
    distance_cm: 50,
    height_percent: 0,
    bin_level: 0,
    latitude: 0,
    longitude: 0,
    last_active: "2025-10-08 01:00:00",
    gps_valid: false,
    satellites: 0,
    gps_timestamp: "N/A",
    coordinates_source: "gps_backup",
    timestamp: Date.now(),
    gps_timeout: true
  };
  
  try {
    const response = await makeRequest(urls[0], 'PUT', JSON.stringify(sampleData));
    console.log(`✅ Sample data upload: ${response.status}`);
  } catch (error) {
    console.log(`❌ Sample data upload failed: ${error.message}`);
  }
}

function makeRequest(url, method, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

// Run the test
testFirebaseURLs().then(() => {
  console.log('🎉 Firebase URL test completed!');
  process.exit(0);
});
