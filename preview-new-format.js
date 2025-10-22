/**
 * Preview the new SMS format with emojis
 */

// Simulate the message format
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

const header = isManualAssignment ? '🔴 MANUAL TASK 🔴' : '🔵 TASK 🔵';

let message = `${header}\n`;
message += `📦 Bin: ${binName}\n`;
message += `📍 Location: ${binLocation}\n`;
message += `📊 Fill Level: ${binLevel}% (${status})\n`;
message += `⚖️ Weight: ${weight} kg\n`;
message += `📏 Height: ${height}%\n`;
message += `🗺️ GPS: Not available\n`;

if (taskNotes && taskNotes.trim()) {
  message += `\n📝 Task Notes: ${taskNotes.trim()}\n`;
}

message += `\n👤 Assigned by: ${assignedBy}\n`;
message += `🕐 Time: ${timestamp}\n`;

if (isManualAssignment) {
  message += `💡 Staff selected you manually\n`;
}

message += `\nPlease proceed to empty the bin.`;

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║          NEW SMS FORMAT PREVIEW                          ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log('Message:');
console.log('────────────────────────────────────────────────────────────');
console.log(message);
console.log('────────────────────────────────────────────────────────────');
console.log(`\nLength: ${message.length} characters`);

if (message.length <= 160) {
  console.log('✅ Fits in single SMS (160 chars)');
} else if (message.length <= 306) {
  console.log(`⚠️  Requires 2 SMS parts (${message.length} chars)`);
  console.log('💡 Multi-part SMS may fail with Error 325');
  console.log('📝 Consider shortening task notes or removing some fields');
} else {
  console.log(`❌ TOO LONG - Requires ${Math.ceil(message.length / 153)} SMS parts`);
}

console.log('\n💡 TIP: Keep task notes short to stay under 306 characters (2 SMS limit)');
console.log('    or under 160 characters (single SMS) for guaranteed delivery\n');

