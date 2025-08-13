const { User, DirectRelationship } = require('./src/models');

async function testUsers() {
  try {
    console.log('🔍 Testing created users...\n');
    
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'fatherId', 'motherId'],
      order: [['id', 'ASC']]
    });
    
    console.log(`📊 Total users found: ${users.length}\n`);
    
    console.log('👥 USERS LIST:');
    console.log('==============');
    users.forEach(user => {
      console.log(`${user.id}: ${user.firstName} ${user.lastName} (${user.email}) - Father: ${user.fatherId}, Mother: ${user.motherId}`);
    });
    
    console.log('\n💕 RELATIONSHIPS:');
    console.log('=================');
    const relationships = await DirectRelationship.findAll({
      include: [
        { model: User, as: 'user', attributes: ['firstName', 'lastName'] },
        { model: User, as: 'relatedUser', attributes: ['firstName', 'lastName'] }
      ]
    });
    
    relationships.forEach(rel => {
      console.log(`${rel.user.firstName} ${rel.user.lastName} → ${rel.relationshipType} → ${rel.relatedUser.firstName} ${rel.relatedUser.lastName}`);
    });
    
    // Test specific users
    console.log('\n🎯 KEY USERS:');
    console.log('=============');
    const prashanth = await User.findOne({ where: { email: 'prashanth@family.com' } });
    const meera = await User.findOne({ where: { email: 'meera.sharma@family.com' } });
    const amit = await User.findOne({ where: { email: 'amit@family.com' } });
    
    console.log('Prashanth:', prashanth ? `${prashanth.firstName} ${prashanth.lastName} (ID: ${prashanth.id})` : 'NOT FOUND');
    console.log('Meera:', meera ? `${meera.firstName} ${meera.lastName} (ID: ${meera.id})` : 'NOT FOUND');
    console.log('Amit:', amit ? `${amit.firstName} ${amit.lastName} (ID: ${amit.id})` : 'NOT FOUND');
    
  } catch (error) {
    console.error('❌ Error testing users:', error);
  }
}

testUsers().then(() => {
  console.log('\n✅ User test completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});