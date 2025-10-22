/**
 * Check SMSC Configuration and SIM Balance/Info
 */

const serialportgsm = require('serialport-gsm');

const modem = serialportgsm.Modem();
const PORT = 'COM12';

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║       SMSC & SIM Credit/Validity Checker                ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

modem.open(PORT, { baudRate: 9600, logger: console });

modem.on('open', () => {
  console.log('✅ Connected\n');
  
  modem.initializeModem((result) => {
    if (result.status !== 'success') {
      console.error('❌ Failed to initialize');
      process.exit(1);
    }
    
    console.log('✅ Modem initialized\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Check SMSC
    console.log('1️⃣  Checking SMS Center (SMSC)...');
    modem.executeCommand('AT+CSCA?', (result) => {
      console.log('   Result:', result);
      if (result.status === 'success' && result.data) {
        const dataStr = JSON.stringify(result.data);
        console.log('   📡 SMSC:', dataStr);
        
        if (dataStr.includes('639189001211')) {
          console.log('   ✅ SMSC is correct for Smart Philippines');
        } else {
          console.log('   ⚠️  SMSC might be incorrect!');
          console.log('   💡 Expected: +639189001211');
        }
      }
      console.log('\n');
      
      // 2. Check network operator
      console.log('2️⃣  Checking network operator...');
      modem.executeCommand('AT+COPS?', (result) => {
        console.log('   Result:', result);
        if (result.data) {
          const dataStr = JSON.stringify(result.data);
          console.log('   📡 Operator:', dataStr);
        }
        console.log('\n');
        
        // 3. Check SIM phone number
        console.log('3️⃣  Checking SIM phone number...');
        modem.executeCommand('AT+CNUM', (result) => {
          console.log('   Result:', result);
          if (result.data) {
            console.log('   📞 Your SIM number:', JSON.stringify(result.data));
          } else {
            console.log('   ⚠️  SIM number not stored (normal for some SIMs)');
          }
          console.log('\n');
          
          // 4. Check balance (try USSD)
          console.log('4️⃣  Attempting to check balance via USSD...');
          console.log('   💡 Trying Smart balance check: *214#\n');
          
          modem.executeCommand('AT+CUSD=1,"*214#",15', (result) => {
            console.log('   USSD Result:', result);
            
            setTimeout(() => {
              console.log('\n═══════════════════════════════════════════════════════════');
              console.log('\n📋 RECOMMENDATIONS:');
              console.log('\n1. Check if your Smart SIM has:');
              console.log('   - Load/Credit for sending SMS');
              console.log('   - Valid expiration date');
              console.log('   - SMS service enabled');
              console.log('\n2. Try manually checking balance:');
              console.log('   - Insert SIM in phone');
              console.log('   - Dial *214# for balance');
              console.log('   - Dial *888# for service menu');
              console.log('\n3. If SIM has no load:');
              console.log('   - Buy load/reload SIM');
              console.log('   - Minimum P10-20 should be enough for testing');
              console.log('\n4. Alternative: Try Globe/TM SMSC if Smart fails:');
              console.log('   - Globe SMSC: +639050000');
              console.log('   - Command: AT+CSCA="+639050000",145');
              console.log('\n═══════════════════════════════════════════════════════════\n');
              
              modem.close();
              process.exit(0);
            }, 3000);
          }, true);
        });
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

