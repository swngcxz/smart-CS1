const { db } = require('./models/firebase');

async function checkJanitors() {
  try {
    console.log('🔍 Checking available janitors in database...');
    
    const janitorsRef = db.collection('users');
    const snapshot = await janitorsRef.where('role', '==', 'janitor').get();
    
    if (snapshot.empty) {
      console.log('❌ No janitors found in database');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} janitors:`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- ID: ${doc.id}`);
      console.log(`  Name: ${data.fullName}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Contact: ${data.contactNumber}`);
      console.log(`  Role: ${data.role}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('💥 Error checking janitors:', error);
  }
}

checkJanitors();
