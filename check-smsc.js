/**
 * Check SMS Center (SMSC) Configuration
 * This checks if your GSM module has the correct SMSC number
 */

const gsmService = require('./server/services/gsmService');

async function checkSMSC() {
    console.log('📞 Checking SMS Center (SMSC) Configuration\n');
    
    try {
        await gsmService.initialize();
        console.log('Waiting for initialization...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('\n1. Checking Network Registration...');
        gsmService.modem.executeCommand('AT+CREG?', (result) => {
            console.log('Network Registration:', result);
            if (result.status === 'success') {
                const dataStr = JSON.stringify(result.data || result.message || '');
                console.log('Data:', dataStr);
                
                if (dataStr.includes('0,1') || dataStr.includes('2,1')) {
                    console.log('✅ Registered on home network');
                } else if (dataStr.includes('0,5') || dataStr.includes('2,5')) {
                    console.log('✅ Registered on roaming network');
                } else if (dataStr.includes('2,3')) {
                    console.log('❌ NETWORK REGISTRATION DENIED!');
                    console.log('   This is why SMS is not working!');
                } else if (dataStr.includes('0,0') || dataStr.includes('2,0')) {
                    console.log('❌ Not registered - searching for network');
                } else if (dataStr.includes('2,2')) {
                    console.log('⚠️  Searching for network...');
                } else {
                    console.log('⚠️  Not registered on network!');
                }
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n2. Checking SMS Center Number...');
        gsmService.modem.executeCommand('AT+CSCA?', (result) => {
            console.log('SMSC Result:', result);
            
            if (result.status === 'success') {
                console.log('\nSMSC is configured:');
                console.log(result.data || result.message);
                
                const smscMatch = (result.data || result.message || '').match(/\+63\d+/);
                if (smscMatch) {
                    const smscNumber = smscMatch[0];
                    console.log('\n📞 Current SMSC:', smscNumber);
                    
                    // Check which network
                    if (smscNumber.includes('918000')) {
                        console.log('✅ Globe SMSC detected');
                    } else if (smscNumber.includes('918900')) {
                        console.log('✅ Smart SMSC detected');
                    } else if (smscNumber.includes('920930')) {
                        console.log('✅ Sun SMSC detected');
                    } else {
                        console.log('⚠️  Unknown SMSC - might need to set manually');
                    }
                } else {
                    console.log('⚠️  No SMSC number found!');
                }
            } else {
                console.log('❌ Could not get SMSC');
            }
            
            setTimeout(() => {
                console.log('\n3. Checking Signal Quality...');
                gsmService.modem.executeCommand('AT+CSQ', (result) => {
                    console.log('Signal:', result);
                    
                    setTimeout(() => {
                        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('SMSC Numbers for Philippines:');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('Globe:  +639180000101');
                        console.log('Smart:  +639189001211');
                        console.log('Sun:    +639209300000');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        
                        console.log('\nTo set SMSC manually:');
                        console.log('1. Open server/services/gsmService.js');
                        console.log('2. Find the constructor options');
                        console.log('3. Add: customInitCommand: \'AT+CSCA="+639180000101",145\'');
                        console.log('4. Restart the server\n');
                        
                        gsmService.close();
                        process.exit(0);
                    }, 2000);
                });
            }, 2000);
        });
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSMSC();
