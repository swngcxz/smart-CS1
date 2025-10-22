/**
 * Check Network Registration and Send Test SMS
 * This will verify network registration and send SMS in TEXT mode
 */

const serialportgsm = require('serialport-gsm');

const modem = serialportgsm.Modem();
const PORT = 'COM12';
const YOUR_PHONE = '+639606388228'; // Your phone number

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Network Registration Check & SMS Test                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

modem.open(PORT, {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  autoDeleteOnReceive: false, // Keep messages
  enableConcatenation: true,
  incomingCallIndication: true,
  incomingSMSIndication: true,
  customInitCommand: 'AT+CSCA="+639189001211",145', // Smart Philippines SMSC
  logger: console
});

modem.on('open', async () => {
  console.log('✅ Port opened\n');
  
  // Initialize modem
  modem.initializeModem(async (result) => {
    if (result.status !== 'success') {
      console.error('❌ Failed to initialize:', result);
      process.exit(1);
    }
    
    console.log('✅ Modem initialized\n');
    
    // Check network registration
    console.log('📡 Checking network registration...');
    modem.executeCommand('AT+CREG?', (result) => {
      console.log('Network Registration:', result);
      if (result.data) {
        const dataStr = JSON.stringify(result.data);
        const match = dataStr.match(/(\d+),(\d+)/);
        if (match) {
          const n = match[1];
          const stat = match[2];
          console.log(`  Mode: ${n}, Status: ${stat}`);
          
          const statusMap = {
            '0': 'Not registered, not searching',
            '1': 'Registered, home network ✅',
            '2': 'Not registered, searching...',
            '3': 'Registration denied',
            '4': 'Unknown',
            '5': 'Registered, roaming ✅'
          };
          console.log(`  Meaning: ${statusMap[stat] || 'Unknown'}\n`);
          
          if (stat === '1' || stat === '5') {
            console.log('✅ Network registered!\n');
            sendTestSMS();
          } else {
            console.log('❌ Not registered on network');
            console.log('Trying to register...\n');
            
            // Force network registration
            modem.executeCommand('AT+COPS=0', (result) => {
              console.log('Auto network selection:', result);
              setTimeout(() => {
                sendTestSMS();
              }, 5000);
            });
          }
        }
      }
    });
  });
});

function sendTestSMS() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📤 Sending SMS in TEXT mode (not PDU)...');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const testMessage = `Test SMS ${Date.now()} - Smart Bin System`;
  
  console.log(`To: ${YOUR_PHONE}`);
  console.log(`Message: ${testMessage}\n`);
  
  // Send in TEXT mode (false = TEXT mode, not PDU)
  modem.sendSMS(YOUR_PHONE, testMessage, false, (result) => {
    console.log('\n📊 SMS Result:', result);
    
    if (result.status === 'success') {
      console.log('\n✅ SMS SENT SUCCESSFULLY IN TEXT MODE!');
      console.log('📱 Check your phone for the message');
    } else {
      console.log('\n❌ SMS FAILED:', result.message || result.data);
      console.log('\n🔄 Trying PDU mode...\n');
      
      // Try PDU mode as fallback
      modem.sendSMS(YOUR_PHONE, testMessage, true, (result2) => {
        console.log('PDU Mode Result:', result2);
        if (result2.status === 'success') {
          console.log('✅ PDU mode succeeded');
        } else {
          console.log('❌ PDU mode also failed');
        }
        
        setTimeout(() => {
          modem.close();
          process.exit(0);
        }, 2000);
      });
      return;
    }
    
    setTimeout(() => {
      modem.close();
      process.exit(0);
    }, 2000);
  });
}

modem.on('error', (error) => {
  console.error('❌ Modem error:', error);
});

modem.on('close', () => {
  console.log('\n📴 Modem connection closed');
});

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Interrupted by user');
  if (modem) {
    modem.close();
  }
  process.exit(0);
});

console.log('⏳ Connecting to GSM module...\n');

