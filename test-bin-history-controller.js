const axios = require('axios');

async function testBinHistoryController() {
  try {
    console.log('🧪 Testing Bin History Controller Integration...\n');
    
    // Test the main bin history endpoint
    console.log('1. Testing GET /api/bin-history...');
    const response = await axios.get('http://localhost:8000/api/bin-history');
    
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Success:', response.data.success);
    console.log('✅ Records Count:', response.data.records?.length || 0);
    console.log('✅ Stats:', response.data.stats);
    
    if (response.data.success && response.data.records) {
      console.log('\n📊 Sample Record:');
      console.log(JSON.stringify(response.data.records[0], null, 2));
      
      console.log('\n📈 Statistics:');
      console.log(`- Total Records: ${response.data.stats.totalRecords}`);
      console.log(`- Critical: ${response.data.stats.criticalCount}`);
      console.log(`- Warning: ${response.data.stats.warningCount}`);
      console.log(`- Normal: ${response.data.stats.normalCount}`);
      console.log(`- Error: ${response.data.stats.errorCount}`);
      console.log(`- Malfunction: ${response.data.stats.malfunctionCount}`);
    }
    
    // Test with filters
    console.log('\n2. Testing with filters...');
    const filteredResponse = await axios.get('http://localhost:8000/api/bin-history?limit=5&status=critical');
    console.log('✅ Filtered Response:', filteredResponse.data.count, 'records');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testBinHistoryController();



