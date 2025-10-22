/**
 * Final SMS Test - Compact Format (Under 160 chars)
 */

const serialportgsm = require('serialport-gsm');

const modem = serialportgsm.Modem();
const PORT = 'COM12';
const YOUR_PHONE = '+639606388228';

const message = `MANUAL TASK
Bin: Bin bin1
Loc: Central Plaza
Level: 88% WARNING
W:0.041kg H:0%
Note: Clean bin
By: Josh Canillas
10/23/2025, 02:53 AM
Empty bin now.`;

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║      FINAL SMS TEST (Single SMS - Guaranteed Delivery)   ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log('Message Preview:');
console.log('────────────────────────────────────────────────────────────');
console.log(message);
console.log('────────────────────────────────────────────────────────────');
console.log(`Length: ${message.length} characters ✅ (Single SMS)\n`);

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
    
    console.log('✅ Modem ready\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📤 Sending compact SMS...');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Send in TEXT mode (false = TEXT mode)
    modem.sendSMS(YOUR_PHONE, message, false, (result) => {
      console.log('\n📊 Result:', result);
      
      if (result.status === 'success') {
        console.log('\n╔════════════════════════════════════════════╗');
        console.log('║   ✅ SMS SENT SUCCESSFULLY!              ║');
        console.log('║   Check your phone in 10-30 seconds      ║');
        console.log('╚════════════════════════════════════════════╝\n');
        console.log('💡 This format will work from your web dashboard too!');
      } else {
        console.error('\n❌ Failed:', result.message);
      }
      
      setTimeout(() => {
        modem.close();
        process.exit(result.status === 'success' ? 0 : 1);
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

