/**
 * Preview compact SMS format (under 160 chars)
 */

function previewMessage(binName, binLocation, binLevel, weight, height, taskNotes, assignedBy) {
  const status = binLevel >= 90 ? 'CRITICAL' : binLevel >= 70 ? 'WARNING' : binLevel >= 50 ? 'MODERATE' : 'NORMAL';
  const time = new Date().toLocaleString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const taskType = 'MANUAL';
  
  let message = `${taskType} TASK\n`;
  message += `Bin: ${binName}\n`;
  message += `Loc: ${binLocation}\n`;
  message += `Level: ${binLevel}% ${status}\n`;
  message += `W:${weight}kg H:${height}%\n`;
  
  if (taskNotes && taskNotes.trim() && message.length < 100) {
    const maxNoteLength = 150 - message.length - 15;
    const notes = taskNotes.trim();
    if (notes.length <= maxNoteLength) {
      message += `Note: ${notes}\n`;
    } else if (maxNoteLength > 10) {
      message += `Note: ${notes.substring(0, maxNoteLength - 3)}...\n`;
    }
  }
  
  message += `By: ${assignedBy}\n`;
  message += `${time}\n`;
  message += `Empty bin now.`;

  if (message.length > 160) {
    message = `${taskType} TASK\n`;
    message += `Bin: ${binName}\n`;
    message += `Loc: ${binLocation}\n`;
    message += `Level: ${binLevel}% ${status}\n`;
    message += `W:${weight}kg H:${height}%\n`;
    message += `By: ${assignedBy}\n`;
    message += `${time}\n`;
    message += `Empty bin now.`;
  }

  return message;
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     COMPACT SMS FORMAT (Single SMS - Under 160 chars)   ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Test 1: With short note
console.log('Test 1: WITH SHORT TASK NOTE');
console.log('────────────────────────────────────────────────────────────');
const msg1 = previewMessage('Bin bin1', 'Central Plaza', 88, 0.041, 0, 'Clean bin', 'Josh Canillas');
console.log(msg1);
console.log('────────────────────────────────────────────────────────────');
console.log(`Length: ${msg1.length} chars ${msg1.length <= 160 ? '✅' : '❌'}\n`);

// Test 2: Without note
console.log('Test 2: WITHOUT TASK NOTE');
console.log('────────────────────────────────────────────────────────────');
const msg2 = previewMessage('Bin bin1', 'Central Plaza', 0, 0, 0, '', 'Josh Canillas');
console.log(msg2);
console.log('────────────────────────────────────────────────────────────');
console.log(`Length: ${msg2.length} chars ${msg2.length <= 160 ? '✅' : '❌'}\n`);

// Test 3: With long note (should be truncated)
console.log('Test 3: WITH LONG TASK NOTE (auto-truncated)');
console.log('────────────────────────────────────────────────────────────');
const msg3 = previewMessage('Bin bin1', 'Central Plaza', 75, 5.2, 85, 'This is a very long task note that should be automatically truncated to fit', 'Josh Canillas');
console.log(msg3);
console.log('────────────────────────────────────────────────────────────');
console.log(`Length: ${msg3.length} chars ${msg3.length <= 160 ? '✅' : '❌'}\n`);

console.log('📝 Format includes:');
console.log('   ✓ Task type (MANUAL/AUTO)');
console.log('   ✓ Bin name');
console.log('   ✓ Location (abbreviated)');
console.log('   ✓ Fill level with status');
console.log('   ✓ Weight and height');
console.log('   ✓ Task notes (if space permits)');
console.log('   ✓ Assigned by');
console.log('   ✓ Timestamp');
console.log('   ✓ Action instruction\n');

