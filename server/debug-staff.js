const StaffModel = require('./models/staffModel');

async function debugStaff() {
  try {
    console.log('=== DEBUGGING STAFF DATA ===');
    
    // Get all staff from janitor collection
    const staff = await StaffModel.getAllStaff();
    console.log('\n--- Staff from janitor collection ---');
    staff.forEach((s, index) => {
      console.log(`${index + 1}. ID: ${s.id}`);
      console.log(`   Name: ${s.fullName}`);
      console.log(`   Email: ${s.email}`);
      console.log(`   Contact Number: ${s.contactNumber || 'MISSING'}`);
      console.log(`   Role: ${s.role}`);
      console.log(`   Location: ${s.location}`);
      console.log('   ---');
    });
    
    // Get all users
    const users = await StaffModel.getAllUsers();
    console.log('\n--- Users from users collection ---');
    users.forEach((u, index) => {
      console.log(`${index + 1}. ID: ${u.id}`);
      console.log(`   Name: ${u.fullName}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Contact Number: ${u.contactNumber || 'MISSING'}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Location: ${u.location}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('Error debugging staff:', error);
  }
}

debugStaff();
