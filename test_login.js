const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    console.log('🔐 Testing login...\n');
    
    const user = await User.findOne({ where: { email: 'prashanth@family.com' } });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`👤 Found user: ${user.firstName} ${user.lastName}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Stored password hash: ${user.password.substring(0, 20)}...`);
    
    const testPassword = 'FamilyTree123!';
    console.log(`🧪 Testing password: ${testPassword}`);
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log(`✅ Password valid: ${isValid}`);
    
    if (!isValid) {
      // Try creating a new hash to compare
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log(`🔄 New hash: ${newHash.substring(0, 20)}...`);
      
      const isNewValid = await bcrypt.compare(testPassword, newHash);
      console.log(`✅ New hash valid: ${isNewValid}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing login:', error);
  }
}

testLogin().then(() => {
  console.log('\n✅ Login test completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});