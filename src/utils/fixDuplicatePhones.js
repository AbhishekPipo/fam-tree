// Script to find and fix duplicate phone numbers

const database = require('../config/database');

async function fixDuplicatePhones() {
  try {
    console.log('🔍 Checking for duplicate phone numbers...');
    
    await database.connect();
    
    // Find duplicate phone numbers
    const duplicatesResult = await database.runQuery(`
      MATCH (u:User)
      WHERE u.phone IS NOT NULL
      WITH u.phone as phone, collect(u) as users
      WHERE size(users) > 1
      RETURN phone, users
    `);
    
    if (duplicatesResult.records.length === 0) {
      console.log('✅ No duplicate phone numbers found');
      return;
    }
    
    console.log(`Found ${duplicatesResult.records.length} duplicate phone numbers:`);
    
    for (const record of duplicatesResult.records) {
      const phone = record.get('phone');
      const users = record.get('users');
      
      console.log(`\n📞 Phone: ${phone} (${users.length} users)`);
      
      // Show details of each user
      for (let i = 0; i < users.length; i++) {
        const user = users[i].properties;
        console.log(`  ${i + 1}. ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        console.log(`     Created: ${user.createdAt}`);
        console.log(`     Phone Verified: ${user.isPhoneVerified}`);
      }
      
      // Keep the first user (oldest), delete the rest
      const usersToDelete = users.slice(1);
      console.log(`\n🗑️  Deleting ${usersToDelete.length} duplicate users...`);
      
      for (const userToDelete of usersToDelete) {
        const userId = userToDelete.properties.id;
        await database.runQuery(`
          MATCH (u:User {id: $userId})
          DETACH DELETE u
        `, { userId });
        console.log(`     ✅ Deleted user: ${userToDelete.properties.firstName} ${userToDelete.properties.lastName}`);
      }
    }
    
    console.log('\n✅ Duplicate cleanup completed!');
    
    // Now try to create the phone unique constraint
    console.log('\n📋 Creating phone unique constraint...');
    try {
      await database.runQuery('CREATE CONSTRAINT user_phone_unique IF NOT EXISTS FOR (u:User) REQUIRE u.phone IS UNIQUE');
      console.log('✅ Phone unique constraint created successfully!');
    } catch (error) {
      console.log(`❌ Failed to create phone constraint: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await database.close();
  }
}

module.exports = fixDuplicatePhones;

// Run if executed directly
if (require.main === module) {
  fixDuplicatePhones()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
