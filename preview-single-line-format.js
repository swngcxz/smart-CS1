/**
 * Preview single-line SMS format (no newlines!)
 */

function createMessage(binName, binLocation, binLevel, weight, height, taskNotes, assignedBy) {
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
  
  let message = `${taskType} TASK: ${binName} @ ${binLocation}. `;
  message += `Level:${binLevel}% (${status}). `;
  message += `W:${weight}kg H:${height}%. `;
  
  if (taskNotes && taskNotes.trim()) {
    const notes = taskNotes.trim().replace(/\n/g, ' ');
    const availableSpace = 150 - message.length - 20;
    
    if (notes.length <= availableSpace) {
      message += `Note: ${notes}. `;
    } else if (availableSpace > 10) {
      message += `Note: ${notes.substring(0, availableSpace - 4)}... `;
    }
  }
  
  message += `By ${assignedBy} ${time}. Empty now`;

  if (message.length > 160) {
    message = `${taskType} TASK: ${binName} @ ${binLocation}. Level:${binLevel}% (${status}). W:${weight}kg H:${height}%. By ${assignedBy} ${time}. Empty now`;
  }

  if (message.length > 160) {
    message = message.substring(0, 157) + '...';
  }

  return message;
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   SINGLE-LINE SMS FORMAT (No newlines - Works!)         ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Test 1
console.log('Test 1: WITH SHORT NOTE');
console.log('────────────────────────────────────────────────────────────');
const msg1 = createMessage('Bin bin1', 'Central Plaza', 88, 0.041, 0, 'Clean bin', 'Josh Canillas');
console.log(msg1);
console.log(`Length: ${msg1.length} chars ✅\n`);

// Test 2
console.log('Test 2: WITHOUT NOTE');
console.log('────────────────────────────────────────────────────────────');
const msg2 = createMessage('Bin bin1', 'Central Plaza', 0, 0, 0, '', 'Josh Canillas');
console.log(msg2);
console.log(`Length: ${msg2.length} chars ✅\n`);

// Test 3
console.log('Test 3: WITH LONG NOTE (truncated)');
console.log('────────────────────────────────────────────────────────────');
const msg3 = createMessage('Bin bin1', 'Central Plaza', 75, 5.2, 85, 'Very long note that will be truncated', 'Josh Canillas');
console.log(msg3);
console.log(`Length: ${msg3.length} chars ✅\n`);

console.log('✅ All messages are single-line (no \\n characters)');
console.log('✅ All under 160 characters');
console.log('✅ Should work with your GSM module!\n');

