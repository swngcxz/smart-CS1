/**
 * Test 2-part SMS with Globe SMSC
 */

const serialportgsm = require('serialport-gsm');

const modem = serialportgsm.Modem();
const PORT = 'COM12';
const YOUR_PHONE = '+639606388228';

const message = `🔴 MANUAL TASK 🔴
📦 Bin: Bin bin1
📍 Location: Central Plaza
📊 Fill Level: 88% (WARNING)
⚖️ Weight: 0.041 kg
📏 Height: 0%
🗺️ GPS: Not available

📝 Task Notes: qwerty

👤 Assigned by: Josh Canillas
🕐 Time: 10/23/2025, 02:47:58 AM
💡 Staff selected you manually

Please proceed to empty the bin.`;

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     Test 2-Part SMS with Globe SMSC                     ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log(`Message length: ${message.length} characters (requires 2 SMS parts)\n`);

modem.open(PORT, {
  baudRate: 9600,
  customInitCommand: 'AT+CSCA="+639180000101",145', // Globe SMSC
  enableConcatenation: true, // Enable multi-part SMS
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
    console.log('📤 Sending 2-part SMS...');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Try TEXT mode first (false = TEXT mode)
    modem.sendSMS(YOUR_PHONE, message, false, (result) => {
      console.log('\n📊 TEXT Mode Result:', result);
      
      if (result.status === 'success') {
        console.log('\n✅ 2-PART SMS SENT IN TEXT MODE!');
        console.log('📱 Check your phone in 30-60 seconds');
        console.log('💡 Multi-part SMS takes longer to deliver');
        
        setTimeout(() => {
          modem.close();
          process.exit(0);
        }, 3000);
      } else {
        console.error('\n❌ TEXT mode failed:', result.message);
        console.log('🔄 Trying PDU mode...\n');
        
        // Try PDU mode (true = PDU mode)
        modem.sendSMS(YOUR_PHONE, message, true, (result2) => {
          console.log('\n📊 PDU Mode Result:', result2);
          
          if (result2.status === 'success') {
            console.log('\n✅ 2-PART SMS SENT IN PDU MODE!');
            console.log('📱 Check your phone in 30-60 seconds');
          } else {
            console.error('\n❌ Both modes failed - multi-part SMS not supported');
            console.log('💡 Need to shorten message to under 160 characters');
          }
          
          setTimeout(() => {
            modem.close();
            process.exit(result2.status === 'success' ? 0 : 1);
          }, 3000);
        });
      }
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

