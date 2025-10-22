/**
 * Check SMS Capability and Network Status
 */

const serialportgsm = require('serialport-gsm');

const modem = serialportgsm.Modem();
const PORT = 'COM12';

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║       SMS Capability & Network Status Check             ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

modem.open(PORT, { baudRate: 9600, logger: console });

modem.on('open', () => {
  console.log('✅ Connected\n');
  
  modem.initializeModem((result) => {
    if (result.status !== 'success') {
      console.error('❌ Init failed');
      process.exit(1);
    }
    
    console.log('✅ Modem initialized\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // 1. Check SMS Center
    console.log('1️⃣  SMS Center (SMSC):');
    modem.executeCommand('AT+CSCA?', (result) => {
      console.log('   ', result.data || result);
      
      // 2. Check message format
      console.log('\n2️⃣  Message Format:');
      modem.executeCommand('AT+CMGF?', (result) => {
        console.log('   ', result.data || result);
        console.log('    (0=PDU mode, 1=TEXT mode)');
        
        // 3. Try to set TEXT mode
        console.log('\n3️⃣  Attempting to set TEXT mode...');
        modem.executeCommand('AT+CMGF=1', (result) => {
          console.log('   ', result.data || result);
          
          // 4. Check network operator
          console.log('\n4️⃣  Network Operator:');
          modem.executeCommand('AT+COPS?', (result) => {
            console.log('   ', result.data || result);
            
            // 5. Check SMS service
            console.log('\n5️⃣  SMS Service Status:');
            modem.executeCommand('AT+CSMS?', (result) => {
              console.log('   ', result.data || result);
              
              // 6. Check SMS capabilities
              console.log('\n6️⃣  SMS Capabilities:');
              modem.executeCommand('AT+CSMS=?', (result) => {
                console.log('   ', result.data || result);
                
                console.log('\n═══════════════════════════════════════════════════════════');
                console.log('\n📋 DIAGNOSIS:');
                console.log('\n   The Error 325 (+CMS ERROR: 325) typically means:');
                console.log('   - "No network service" or');
                console.log('   - "Invalid message format" or');
                console.log('   - "SIM restrictions on SMS sending"');
                console.log('\n💡 POSSIBLE SOLUTIONS:');
                console.log('   1. Check SIM has load/credit');
                console.log('   2. Check SIM validity (not expired)');
                console.log('   3. Check if SIM is SMS-enabled');
                console.log('   4. Try another SIM card');
                console.log('   5. Check with Smart/Globe if SMS is blocked');
                console.log('\n═══════════════════════════════════════════════════════════\n');
                
                modem.close();
                process.exit(0);
              });
            });
          });
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

