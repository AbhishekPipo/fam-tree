const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  try {
    console.log('🔧 Fixing passwords...\n');
    
    // Update key users with correct password hash
    const keyUsers = [
      'prashanth@family.com',
      'meera.sharma@family.com', 
      'amit@family.com',
      'anjali@family.com',
      'rohit.sharma@family.com'
    ];
    
    for (const email of keyUsers) {
      const user = await User.findOne({ where: { email } });
      if (user) {
        const password = email === 'meera.sharma@family.com' ? 'TempPassword123!' : 'FamilyTree123!';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await User.update({ password: hashedPassword }, { 
          where: { id: user.id },
          hooks: false // Skip the beforeUpdate hook
        });
        console.log(`✅ Updated password for ${user.firstName} ${user.lastName} (${email})`);
      }
    }
    
    console.log('\n🎉 Passwords fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
  }
}

fixPasswords().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Failed to fix passwords:', error);
  process.exit(1);
});