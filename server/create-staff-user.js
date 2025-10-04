const { db } = require('./models/firebase');
const bcrypt = require('bcrypt');

async function createStaffUser() {
  try {
    console.log('Creating staff user...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const staffUserData = {
      fullName: 'Test Staff User',
      email: 'staff@test.com',
      password: hashedPassword,
      role: 'staff',
      location: 'General',
      status: 'active',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivity: 'Recently active',
      contactNumber: '1234567890'
    };
    
    const docRef = await db.collection('users').add(staffUserData);
    console.log('✅ Staff user created successfully with ID:', docRef.id);
    
    // Also create an admin user
    const adminUserData = {
      ...staffUserData,
      fullName: 'Test Admin User',
      email: 'admin@test.com',
      role: 'admin'
    };
    
    const adminRef = await db.collection('users').add(adminUserData);
    console.log('✅ Admin user created successfully with ID:', adminRef.id);
    
    console.log('Both users created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating staff user:', error);
    process.exit(1);
  }
}

createStaffUser();
