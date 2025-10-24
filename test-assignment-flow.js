/**
 * Test Assignment Flow - Debug SMS Not Sending
 * Tests the complete flow from dashboard assignment to SMS delivery
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
const TEST_JANITOR_ID = 'E5299pi1fFCIKVzwAhGq'; // Jeralyn Peritos
const TEST_PHONE = '+639309096606'; // Josh Canillas

async function testCompleteAssignmentFlow() {
  console.log('\n========================================');
  console.log('🔍 TESTING COMPLETE ASSIGNMENT FLOW');
  console.log('========================================\n');

  try {
    // Step 1: Check if server is running
    console.log('Step 1: Checking server health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running:', healthResponse.data);

    // Step 2: Check GSM service status
    console.log('\nStep 2: Checking GSM service status...');
    const gsmStatusResponse = await axios.get(`${BASE_URL}/api/test/gsm-service/status`);
    console.log('📡 GSM Status:', JSON.stringify(gsmStatusResponse.data, null, 2));

    // Step 3: Check SMS service status
    console.log('\nStep 3: Checking SMS service status...');
    const smsStatusResponse = await axios.get(`${BASE_URL}/api/test/sms-service/status`);
    console.log('📱 SMS Status:', JSON.stringify(smsStatusResponse.data, null, 2));

    // Step 4: Get available janitors
    console.log('\nStep 4: Getting available janitors...');
    const janitorsResponse = await axios.get(`${BASE_URL}/api/janitors/available`);
    console.log(`✅ Found ${janitorsResponse.data.janitors.length} janitors`);
    janitorsResponse.data.janitors.forEach(j => {
      console.log(`  - ${j.fullName} (${j.id}): ${j.contactNumber || 'No phone'}`);
    });

    // Step 5: Create a test activity log (simulating dashboard bin assignment)
    console.log('\nStep 5: Creating test activity log...');
    const activityData = {
      user_id: 'test-user-123',
      bin_id: 'bin1',
      bin_location: 'Central Plaza',
      bin_status: 'pending',
      bin_level: 100, // 100% full to test CRITICAL status
      assigned_janitor_id: null, // Initially null
      assigned_janitor_name: null,
      task_note: 'TEST ASSIGNMENT - Please clean this bin urgently',
      activity_type: 'task_assignment',
      description: 'Test task assignment for SMS flow debugging',
      source: 'web_dashboard',
      status: 'pending'
    };

    const activityResponse = await axios.post(`${BASE_URL}/api/activitylogs`, activityData);
    console.log('✅ Activity log created:', activityResponse.data);
    
    const activityId = activityResponse.data.activity_id || activityResponse.data.id;
    
    if (!activityId) {
      console.error('❌ Failed to get activity ID from response');
      console.log('Response data:', activityResponse.data);
      return;
    }
    
    console.log(`📝 Activity ID: ${activityId}`);

    // Step 6: Assign task to janitor (THIS SHOULD TRIGGER SMS)
    console.log('\nStep 6: Assigning task to janitor (SMS SHOULD BE TRIGGERED)...');
    const assignmentData = {
      activityId: activityId,
      janitorId: TEST_JANITOR_ID,
      janitorName: 'Jeralyn Peritos',
      taskNote: 'TEST ASSIGNMENT - Please clean this bin urgently'
    };

    console.log('Assignment payload:', JSON.stringify(assignmentData, null, 2));
    
    const assignResponse = await axios.post(`${BASE_URL}/api/assign-task`, assignmentData);
    console.log('✅ Assignment response:', JSON.stringify(assignResponse.data, null, 2));

    // Step 7: Wait a moment for SMS processing
    console.log('\nStep 7: Waiting 5 seconds for SMS processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 8: Check SMS statistics
    console.log('\nStep 8: Checking SMS statistics...');
    const smsStatsResponse = await axios.get(`${BASE_URL}/api/sms/stats`);
    console.log('📊 SMS Statistics:', JSON.stringify(smsStatsResponse.data, null, 2));

    console.log('\n========================================');
    console.log('✅ TEST COMPLETED');
    console.log('========================================');
    console.log('\n🔍 CHECK YOUR PHONE FOR SMS:');
    console.log(`   Phone: ${TEST_PHONE}`);
    console.log(`   Expected: SMS about bin1 at Central Plaza (100% full)`);
    console.log('\n📝 CHECK SERVER CONSOLE LOGS FOR:');
    console.log('   [JANITOR NOTIFICATION] Sending SMS notification...');
    console.log('   [SMS NOTIFICATION SERVICE] SMS Message prepared');
    console.log('   [GSM SERVICE] Sending SMS to +639309096606...');
    console.log('   [GSM SERVICE] SMS sent successfully');
    console.log('\n========================================\n');

  } catch (error) {
    console.error('\n❌ ERROR DURING TEST:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Is the server running on port 8000?');
    } else {
      console.error('Error details:', error);
    }
  }
}

// Run the test
testCompleteAssignmentFlow();

