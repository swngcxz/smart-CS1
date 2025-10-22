/**
 * Test Short SMS Format (under 160 chars)
 */

const serialportgsm = require('serialport-gsm');

const modem = serialportgsm.Modem();
const PORT = 'COM12';
const YOUR_PHONE = '+639606388228';

// Simulate the new short message format
const binName = 'Bin bin1';
const binLocation = 'Central Plaza';
const binLevel = 0;
const status = 'NORMAL';
const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const taskNotes = 'test task';

let message = `SmartBin Manual Task\n`;
message += `${binName} @ ${binLocation}\n`;
message += `Level: ${binLevel}% (${status})\n`;
message += `Note: ${taskNotes}\n`;
message += `${time} - Empty bin now`;

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     Test Short SMS (Under 160 chars)                    ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log('Message Preview:');
console.log('────────────────────────────────────────────────────────────');
console.log(message);
console.log('────────────────────────────────────────────────────────────');
console.log(`Length: ${message.length} characters (${message.length <= 160 ? '✅ FITS in single SMS' : '❌ TOO LONG'})\n`);

modem.open(PORT, {
  baudRate: 9600,
  customInitCommand: 'AT+CSCA="+639180000101",145', // Globe SMSC
  logger: console
});

modem.on('open', () => {
  console.log('✅ Connected\n');
  
  modem.initializeModem((result) => {
    if (result.status !== 'success') {
      console.error('❌ Init failed');
      process.exit(1);
    }
    
    console.log('✅ Modem initialized\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📤 Sending short SMS with Globe SMSC...');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Send in TEXT mode (false = TEXT mode, not PDU)
    modem.sendSMS(YOUR_PHONE, message, false, (result) => {
      console.log('\n📊 Result:', result);
      
      if (result.status === 'success') {
        console.log('\n✅ SHORT SMS SENT SUCCESSFULLY!');
        console.log('📱 Check your phone - should arrive in 10-30 seconds');
      } else {
        console.error('\n❌ Failed:', result.message);
      }
      
      setTimeout(() => {
        modem.close();
        process.exit(0);
      }, 3000);
    });
  });
});

modem.on('error', (error) => {
  console.error('❌ Error:', error);
});

process.on('SIGINT', () => {
  console.log('\n\n⏹️  Interrupted');
  modem.close();
  process.exit(0);
});

console.log('⏳ Connecting...\n');

