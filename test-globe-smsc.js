/**
 * Test SMS with Globe SMSC (for roaming Smart SIM)
 */

const serialportgsm = require('serialport-gsm');

const modem = serialportgsm.Modem();
const PORT = 'COM12';
const YOUR_PHONE = '+639606388228';

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     SMS Test with Globe SMSC (Roaming Smart SIM)        ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

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
    
    // Verify SMSC was set
    console.log('📡 Verifying SMSC configuration...');
    modem.executeCommand('AT+CSCA?', (result) => {
      console.log('SMSC:', result);
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('📤 Sending SMS with Globe SMSC...');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      const testMsg = `Globe SMSC Test ${new Date().toLocaleTimeString()} - Smart Bin`;
      console.log(`To: ${YOUR_PHONE}`);
      console.log(`Message: ${testMsg}\n`);
      
      // Send SMS in TEXT mode
      modem.sendSMS(YOUR_PHONE, testMsg, false, (result) => {
        console.log('\n📊 Result:', result);
        
        if (result.status === 'success') {
          console.log('\n✅ SMS SENT WITH GLOBE SMSC!');
          console.log('📱 Check your phone in 10-30 seconds\n');
          console.log('💡 If you receive this SMS, the problem was the SMSC mismatch!');
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

