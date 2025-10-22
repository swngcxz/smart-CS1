/**
 * Test SIM Card Detection
 * Checks if SIM card is properly inserted and detected
 */

const gsmService = require('./server/services/gsmService');

async function testSIMDetection() {
    console.log('🔍 Testing SIM Card Detection\n');
    console.log('━'.repeat(60));
    
    try {
        console.log('Initializing GSM module...');
        await gsmService.initialize();
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('\n📋 Running SIM Detection Tests...\n');
        
        // Test 1: Check SIM status
        console.log('Test 1: Checking SIM Status (AT+CPIN?)');
        console.log('─'.repeat(60));
        await new Promise((resolve) => {
            gsmService.modem.executeCommand('AT+CPIN?', (result) => {
                console.log('Response:', JSON.stringify(result, null, 2));
                
                if (result.status === 'ERROR') {
                    const error = result.data || result.message || '';
                    if (error.includes('CME ERROR: 10')) {
                        console.log('❌ SIM CARD NOT DETECTED!');
                        console.log('   Error Code: CME ERROR 10 = SIM not inserted');
                        console.log('\n   Actions needed:');
                        console.log('   1. Power off GSM module');
                        console.log('   2. Remove and reinsert SIM card');
                        console.log('   3. Ensure proper orientation');
                        console.log('   4. Push until it clicks');
                        console.log('   5. Power on and test again');
                    } else if (error.includes('CME ERROR: 13')) {
                        console.log('❌ SIM FAILURE!');
                        console.log('   SIM card may be damaged');
                    } else if (error.includes('CME ERROR: 14')) {
                        console.log('❌ SIM BUSY!');
                        console.log('   SIM card is busy, wait and retry');
                    } else {
                        console.log('❌ ERROR:', error);
                    }
                } else if (result.status === 'success') {
                    const data = JSON.stringify(result.data || '');
                    if (data.includes('READY')) {
                        console.log('✅ SIM CARD DETECTED AND READY!');
                    } else if (data.includes('SIM PIN')) {
                        console.log('⚠️  SIM requires PIN');
                    } else if (data.includes('SIM PUK')) {
                        console.log('❌ SIM locked with PUK');
                    } else {
                        console.log('⚠️  Unknown SIM status:', data);
                    }
                }
                resolve();
            });
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test 2: Get SIM IMSI
        console.log('\nTest 2: Getting SIM IMSI (AT+CIMI)');
        console.log('─'.repeat(60));
        await new Promise((resolve) => {
            gsmService.modem.executeCommand('AT+CIMI', (result) => {
                console.log('Response:', JSON.stringify(result, null, 2));
                
                if (result.status === 'ERROR') {
                    console.log('❌ Cannot read SIM IMSI - SIM not properly inserted');
                } else if (result.status === 'success') {
                    console.log('✅ SIM IMSI read successfully');
                }
                resolve();
            });
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test 3: Get SIM serial number
        console.log('\nTest 3: Getting SIM Serial Number (AT+CCID)');
        console.log('─'.repeat(60));
        await new Promise((resolve) => {
            gsmService.modem.executeCommand('AT+CCID', (result) => {
                console.log('Response:', JSON.stringify(result, null, 2));
                
                if (result.status === 'ERROR') {
                    console.log('❌ Cannot read SIM serial - SIM not properly inserted');
                } else if (result.status === 'success') {
                    console.log('✅ SIM serial read successfully');
                }
                resolve();
            });
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Summary
        console.log('\n' + '━'.repeat(60));
        console.log('📊 DIAGNOSIS SUMMARY');
        console.log('━'.repeat(60));
        
        const status = gsmService.getStatus();
        console.log('SIM Status:', status.simStatus);
        console.log('Connection:', status.isConnected ? '✅ Connected' : '❌ Disconnected');
        console.log('Initialized:', status.isInitialized ? '✅ Yes' : '❌ No');
        console.log('Signal:', status.signalStrength + '/31');
        
        console.log('\n' + '━'.repeat(60));
        console.log('🔧 TROUBLESHOOTING CHECKLIST');
        console.log('━'.repeat(60));
        console.log('[ ] Power off GSM module');
        console.log('[ ] Remove SIM card completely');
        console.log('[ ] Inspect SIM for damage');
        console.log('[ ] Clean SIM contacts');
        console.log('[ ] Check SIM slot for debris');
        console.log('[ ] Reinsert SIM with correct orientation');
        console.log('[ ] Ensure SIM clicks into place');
        console.log('[ ] Power on GSM module');
        console.log('[ ] Wait 30 seconds');
        console.log('[ ] Run this test again');
        console.log('━'.repeat(60) + '\n');
        
    } catch (error) {
        console.error('Test error:', error.message);
    } finally {
        gsmService.close();
        process.exit(0);
    }
}

testSIMDetection();
