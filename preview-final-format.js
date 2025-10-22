/**
 * Preview the final simple SMS format
 */

const binName = 'Bin bin1';
const binLocation = 'Central Plaza';
const binLevel = 88;
const weight = 0.041;
const height = 0;
const status = 'WARNING';
const taskNotes = 'qwerty';
const assignedBy = 'Josh Canillas';
const isManualAssignment = true;

const timestamp = new Date().toLocaleString('en-US', { 
  month: '2-digit', 
  day: '2-digit', 
  year: 'numeric',
  hour: '2-digit', 
  minute: '2-digit',
  second: '2-digit',
  hour12: true 
});

const header = isManualAssignment ? 'MANUAL TASK ASSIGNMENT' : 'TASK ASSIGNMENT';

let message = `${header}\n\n`;
message += `Bin: ${binName}\n`;
message += `Location: ${binLocation}\n`;
message += `Fill Level: ${binLevel}% (${status})\n`;
message += `Weight: ${weight} kg\n`;
message += `Height: ${height}%\n`;
message += `GPS: Not available\n`;

if (taskNotes && taskNotes.trim()) {
  message += `\nTask Notes: ${taskNotes.trim()}\n`;
}

message += `\nAssigned by: ${assignedBy}\n`;
message += `Time: ${timestamp}\n`;

if (isManualAssignment) {
  message += `Staff selected you manually for this task\n`;
}

message += `\nPlease proceed to empty the bin immediately.`;

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║       FINAL SMS FORMAT (Simple & Detailed)               ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log('Message:');
console.log('────────────────────────────────────────────────────────────');
console.log(message);
console.log('────────────────────────────────────────────────────────────');
console.log(`\nLength: ${message.length} characters`);

if (message.length <= 160) {
  console.log('✅ Fits in single SMS (160 chars)');
} else if (message.length <= 306) {
  console.log(`✅ Fits in 2 SMS parts (${message.length} chars)`);
} else if (message.length <= 459) {
  console.log(`⚠️  Requires 3 SMS parts (${message.length} chars)`);
} else {
  console.log(`❌ TOO LONG - Requires ${Math.ceil(message.length / 153)} SMS parts`);
}

console.log('\n📝 All details included:');
console.log('   ✓ Bin name and location');
console.log('   ✓ Fill level with status');
console.log('   ✓ Weight and height');
console.log('   ✓ GPS status');
console.log('   ✓ Task notes');
console.log('   ✓ Assigned by');
console.log('   ✓ Timestamp');
console.log('   ✓ Manual assignment indicator\n');

