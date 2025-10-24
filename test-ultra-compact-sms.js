/**
 * Test Ultra-Compact SMS Format
 * Verify new format is under 140 characters and ASCII-safe
 */

const smsNotificationService = require('./server/services/smsNotificationService');

console.log('\n========================================');
console.log('🧪 TESTING ULTRA-COMPACT SMS FORMAT');
console.log('========================================\n');

// Test scenarios
const testCases = [
  {
    name: 'High Priority with Note',
    data: {
      binName: 'Bin bin1',
      binLocation: 'Central Plaza',
      binLevel: 100,
      weight: 0.5,
      height: 95,
      taskNotes: 'Urgent - overflow detected, clean immediately',
      assignedBy: 'Josh Canillas',
      assignmentType: 'manual'
    }
  },
  {
    name: 'Medium Priority No Note',
    data: {
      binName: 'Bin bin2',
      binLocation: 'Park Avenue',
      binLevel: 75,
      weight: 2.3,
      height: 80,
      taskNotes: '',
      assignedBy: 'Staff',
      assignmentType: 'manual'
    }
  },
  {
    name: 'Low Priority Short Note',
    data: {
      binName: 'Bin bin1',
      binLocation: 'Central Plaza',
      binLevel: 50,
      weight: 0,
      height: 100,
      taskNotes: 'Clean bin',
      assignedBy: 'Admin',
      assignmentType: 'automatic'
    }
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log('─'.repeat(60));
  
  const message = smsNotificationService.createManualTaskSMSMessage(testCase.data);
  
  console.log(`Message: "${message}"`);
  console.log(`Length: ${message.length} characters`);
  console.log(`ASCII Only: ${/^[\x00-\x7F]*$/.test(message) ? '✅ Yes' : '❌ No'}`);
  console.log(`Under 140: ${message.length <= 140 ? '✅ Yes' : '❌ No'}`);
  console.log(`Under 160: ${message.length <= 160 ? '✅ Yes' : '❌ No'}`);
  
  // Check for problematic characters
  const hasNewlines = message.includes('\n');
  const hasColon = message.includes(':');
  const hasAt = message.includes('@');
  const hasComma = message.includes(',');
  
  console.log('\nCharacter Analysis:');
  console.log(`  Newlines (\\n): ${hasNewlines ? '❌ FOUND' : '✅ None'}`);
  console.log(`  Colons (:): ${hasColon ? '⚠️ ' + message.match(/:/g).length : '✅ None'}`);
  console.log(`  At symbols (@): ${hasAt ? '⚠️ ' + message.match(/@/g).length : '✅ None'}`);
  console.log(`  Commas (,): ${hasComma ? '⚠️ ' + message.match(/,/g).length : '✅ None'}`);
  
  // Estimate PDU size (rough calculation)
  const estimatedPDUSize = Math.ceil(message.length * 7 / 8); // 7-bit encoding
  console.log(`\nEstimated PDU Size: ${estimatedPDUSize} bytes`);
  console.log(`Single SMS: ${estimatedPDUSize <= 140 ? '✅ Yes (no splitting)' : '❌ No (will split)'}`);
});

console.log('\n========================================');
console.log('📊 SUMMARY');
console.log('========================================');
console.log('New format removes:');
console.log('  ❌ Complex date formatting (was: "10/23/2025, 11:20 PM")');
console.log('  ❌ Multiple colons, periods, parentheses');
console.log('  ❌ "By", "Note:", "Empty now" verbosity');
console.log('  ✅ Simple format: "TASK bin1 Central Plaza L100% CRITICAL..."');
console.log('\nExpected results:');
console.log('  ✅ All messages under 140 characters');
console.log('  ✅ ASCII-safe encoding');
console.log('  ✅ Single PDU (no splitting)');
console.log('  ✅ No Error 325');
console.log('========================================\n');

