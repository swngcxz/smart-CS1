/**
 * Send SMS and Wait for Delivery Confirmation
 */

const serialportgsm = require('serialport-gsm');

const modem = serialportgsm.Modem();
const PORT = 'COM12';
const YOUR_PHONE = '+639606388228';

console.log('═══════════════════════════════════════════════════════════');
console.log('   SMS Test with Delivery Confirmation');
console.log('═══════════════════════════════════════════════════════════\n');

let deliveryReceived = false;

modem.open(PORT, {
  baudRate: 9600,
  customInitCommand: 'AT+CSCA="+639189001211",145',
  logger: {
    info: (msg) => {
      console.log('[INFO]', msg);
      // Watch for CMGS response (actual send confirmation)
      if (msg.includes('+CMGS:')) {
        console.log('\n✅✅✅ DELIVERY CONFIRMATION RECEIVED! ✅✅✅');
        console.log('📱 SMS was actually sent to the network!');
        deliveryReceived = true;
      }
    },
    error: (msg) => console.error('[ERROR]', msg),
    warn: (msg) => console.warn('[WARN]', msg),
    debug: (msg) => {} // Silent debug
  }
});

modem.on('open', () => {
  console.log('✅ Connected to', PORT, '\n');
  
  modem.initializeModem((result) => {
    if (result.status !== 'success') {
      console.error('❌ Init failed:', result);
      process.exit(1);
    }
    
    console.log('✅ Modem ready\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📤 Sending SMS...');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`To: ${YOUR_PHONE}`);
    
    const testMsg = `Smart Bin Test ${new Date().toLocaleTimeString()}`;
    console.log(`Message: ${testMsg}\n`);
    
    // Send SMS (TEXT mode)
    modem.sendSMS(YOUR_PHONE, testMsg, false, (result) => {
      console.log('\n📊 Initial Response:', result);
      
      if (result.status === 'success') {
        console.log('✅ Message queued in GSM module');
        console.log('⏳ Waiting for delivery confirmation...\n');
        
        // Wait 15 seconds for delivery confirmation
        setTimeout(() => {
          if (deliveryReceived) {
            console.log('\n╔════════════════════════════════════════════╗');
            console.log('║   ✅ SMS SENT SUCCESSFULLY!              ║');
            console.log('║   Check your phone now                   ║');
            console.log('╚════════════════════════════════════════════╝\n');
          } else {
            console.log('\n╔════════════════════════════════════════════╗');
            console.log('║   ⚠️  WARNING: No delivery confirmation  ║');
            console.log('║   Message may not have been sent         ║');
            console.log('║                                          ║');
            console.log('║   Possible issues:                       ║');
            console.log('║   - Network problems                     ║');
            console.log('║   - Incorrect SMSC                       ║');
            console.log('║   - No SIM credit/validity               ║');
            console.log('║   - Recipient number blocked             ║');
            console.log('╚════════════════════════════════════════════╝\n');
          }
          
          modem.close();
          process.exit(deliveryReceived ? 0 : 1);
        }, 15000);
      } else {
        console.error('\n❌ Failed to queue message:', result.message);
        modem.close();
        process.exit(1);
      }
    });
  });
});

modem.on('onNewMessage', (message) => {
  console.log('📨 Received message:', message);
});

modem.on('error', (error) => {
  console.error('❌ Error:', error);
});

process.on('SIGINT', () => {
  console.log('\n\n⏹️  Interrupted');
  modem.close();
  process.exit(1);
});

console.log('⏳ Connecting...\n');

