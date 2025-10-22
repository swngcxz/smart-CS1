// Test the JSON format that ESP32 should send
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
  gps_timestamp: "2025-10-08 01:00:00",
  coordinates_source: "gps_backup",
  timestamp: Date.now(),
  gps_timeout: true
};

console.log('🧪 Testing JSON format for ESP32...\n');

// Test 1: Standard JSON
console.log('✅ Standard JSON:');
console.log(JSON.stringify(sampleData, null, 2));
console.log('');

// Test 2: Compact JSON (like ESP32 would send)
console.log('✅ Compact JSON:');
console.log(JSON.stringify(sampleData));
console.log('');

// Test 3: Validate JSON
try {
  const jsonString = JSON.stringify(sampleData);
  const parsed = JSON.parse(jsonString);
  console.log('✅ JSON is valid and parseable');
  console.log('📊 Parsed data:');
  console.log('  - weight_kg:', parsed.weight_kg);
  console.log('  - gps_valid:', parsed.gps_valid);
  console.log('  - coordinates_source:', parsed.coordinates_source);
} catch (error) {
  console.log('❌ JSON validation failed:', error.message);
}

console.log('\n🎉 JSON format test completed!');
