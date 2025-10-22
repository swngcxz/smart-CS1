/**
 * Fix Network Registration
 * Attempts to force GSM module to register on network
 */

const gsmService = require('./server/services/gsmService');

async function fixNetworkRegistration() {
    console.log('🔧 Attempting to Fix Network Registration\n');
    
    try {
        await gsmService.initialize();
        console.log('Waiting for initialization...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('\n1. Current Network Status...');
        await executeCommand('AT+CREG?', 'Network Registration Status');
        await sleep(2000);
        
        console.log('\n2. Searching for available networks...');
        console.log('   (This may take 30-60 seconds...)');
        await executeCommand('AT+COPS=?', 'Available Networks');
        await sleep(5000);
        
        console.log('\n3. Setting network to automatic...');
        await executeCommand('AT+COPS=0', 'Set Network Automatic');
        await sleep(5000);
        
        console.log('\n4. Checking registration again...');
        await executeCommand('AT+CREG?', 'Network Registration Status');
        await sleep(2000);
        
        console.log('\n5. Checking operator...');
        await executeCommand('AT+COPS?', 'Current Operator');
        await sleep(2000);
        
        console.log('\n6. Final network check...');
        await executeCommand('AT+CREG?', 'Final Status');
        
        await sleep(2000);
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('If status is still "2,3" (denied), your SIM needs:');
        console.log('  1. To be activated/registered with network');
        console.log('  2. Credits/load (for prepaid)');
        console.log('  3. To be tested in a regular phone first');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        gsmService.close();
        process.exit(0);
        
    } catch (error) {
        console.error('Error:', error);
        gsmService.close();
        process.exit(1);
    }
}

function executeCommand(cmd, description) {
    return new Promise((resolve) => {
        console.log(`\n${description}:`);
        console.log(`Command: ${cmd}`);
        
        gsmService.modem.executeCommand(cmd, (result) => {
            console.log('Response:', JSON.stringify(result, null, 2));
            
            if (cmd === 'AT+CREG?') {
                const dataStr = JSON.stringify(result.data || '');
                if (dataStr.includes('2,1') || dataStr.includes('0,1')) {
                    console.log('✅ SUCCESS! Registered on home network');
                } else if (dataStr.includes('2,5') || dataStr.includes('0,5')) {
                    console.log('✅ SUCCESS! Registered on roaming');
                } else if (dataStr.includes('2,3')) {
                    console.log('❌ DENIED - SIM registration issue');
                } else if (dataStr.includes('2,0')) {
                    console.log('⚠️  Not registered, not searching');
                } else if (dataStr.includes('2,2')) {
                    console.log('⏳ Searching for network...');
                }
            }
            
            resolve();
        });
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

fixNetworkRegistration();
