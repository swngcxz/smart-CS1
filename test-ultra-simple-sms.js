/**
 * Test ultra-simple SMS (no newlines, under 70 chars)
 */

const serialportgsm = require('serialport-gsm');

const modem = serialportgsm.Modem();
const PORT = 'COM12';
const YOUR_PHONE = '+639606388228';

// Ultra simple - no newlines, very short
const message = 'MANUAL TASK: Bin bin1 at Central Plaza needs emptying. Level 88%. -Staff';

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   Ultra-Simple SMS Test (No newlines, Plain text)       ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log('Message:', message);
console.log(`Length: ${message.length} chars\n`);

modem.open(PORT, {
  baudRate: 9600,
  customInitCommand: 'AT+CSCA="+639180000101",145', // Globe SMSC
  enableConcatenation: false,
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
    console.log('📤 Sending ultra-simple SMS...');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Send in TEXT mode (false = TEXT)
    modem.sendSMS(YOUR_PHONE, message, false, (result) => {
      console.log('\n📊 Result:', result);
      
      if (result.status === 'success') {
        console.log('\n✅ SMS SENT!');
        console.log('📱 Check your phone');
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

