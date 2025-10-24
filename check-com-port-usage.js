/**
 * Check COM Port Usage
 * Identifies which process is using COM12
 */

const { SerialPort } = require('serialport');

async function checkCOMPorts() {
  console.log('\n========================================');
  console.log('🔍 CHECKING COM PORT AVAILABILITY');
  console.log('========================================\n');

  try {
    // List all available ports
    console.log('Available Serial Ports:');
    const ports = await SerialPort.list();
    
    if (ports.length === 0) {
      console.log('❌ No serial ports found');
      return;
    }

    ports.forEach((port, index) => {
      console.log(`\n${index + 1}. ${port.path}`);
      console.log(`   Manufacturer: ${port.manufacturer || 'Unknown'}`);
      console.log(`   Serial Number: ${port.serialNumber || 'Unknown'}`);
      console.log(`   PnP ID: ${port.pnpId || 'Unknown'}`);
      console.log(`   Vendor ID: ${port.vendorId || 'Unknown'}`);
      console.log(`   Product ID: ${port.productId || 'Unknown'}`);
    });

    // Check if COM12 is in the list
    const com12 = ports.find(p => p.path === 'COM12');
    
    console.log('\n========================================');
    if (com12) {
      console.log('✅ COM12 is available');
      console.log('   Details:', JSON.stringify(com12, null, 2));
      
      // Try to open COM12
      console.log('\n🔧 Attempting to open COM12...');
      
      try {
        const testPort = new SerialPort({
          path: 'COM12',
          baudRate: 9600,
          autoOpen: false
        });

        testPort.open((err) => {
          if (err) {
            console.error('❌ Failed to open COM12:', err.message);
            console.log('\n🔍 POSSIBLE CAUSES:');
            console.log('   1. Another process is using COM12');
            console.log('   2. GSM test server is running (start-gsm-test-admin.bat)');
            console.log('   3. Main server already has COM12 open');
            console.log('\n💡 SOLUTION:');
            console.log('   - Kill all Node.js processes: taskkill /F /IM node.exe');
            console.log('   - Restart only the main server: node server/index.js');
          } else {
            console.log('✅ Successfully opened COM12');
            testPort.close((closeErr) => {
              if (closeErr) {
                console.error('Error closing port:', closeErr.message);
              } else {
                console.log('✅ Successfully closed COM12');
              }
            });
          }
        });
        
      } catch (openError) {
        console.error('❌ Error opening COM12:', openError.message);
      }
      
    } else {
      console.log('❌ COM12 is NOT in the available ports list');
      console.log('\n🔍 POSSIBLE CAUSES:');
      console.log('   1. GSM module not connected via USB');
      console.log('   2. COM port number changed (check Device Manager)');
      console.log('   3. USB cable issue');
      console.log('   4. Driver not installed');
      console.log('\n💡 SOLUTION:');
      console.log('   1. Check Device Manager → Ports (COM & LPT)');
      console.log('   2. Verify Silicon Labs CP210x USB to UART Bridge');
      console.log('   3. Note the actual COM port number');
      console.log('   4. Update gsmService.js if port number changed');
    }
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error checking COM ports:', error);
  }
}

checkCOMPorts();

