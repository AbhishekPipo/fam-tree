const { initDriver, getDriver, closeDriver } = require('../config/db');

const checkUsers = async () => {
  await initDriver();
  const driver = getDriver();
  const session = driver.session();

  try {
    console.log('🔍 Checking for User nodes (authentication)...\n');

    // Check for User nodes
    const users = await session.run('MATCH (u:User) RETURN u.email as email, u.name as name, u.id as id');
    
    if (users.records.length > 0) {
      console.log('👤 Found User nodes:');
      users.records.forEach(record => {
        console.log(`   Email: ${record.get('email')}`);
        console.log(`   Name: ${record.get('name')}`);
        console.log(`   ID: ${record.get('id')}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ No User nodes found in database');
    }

    console.log('\n🔍 Checking for Person nodes with emails...\n');

    // Check for Person nodes with emails
    const persons = await session.run(`
      MATCH (p:Person) 
      WHERE p.email IS NOT NULL 
      RETURN p.firstName as firstName, p.lastName as lastName, p.email as email, p.id as id
      ORDER BY p.firstName
    `);
    
    if (persons.records.length > 0) {
      console.log('👥 Found Person nodes with emails:');
      persons.records.forEach(record => {
        console.log(`   Name: ${record.get('firstName')} ${record.get('lastName')}`);
        console.log(`   Email: ${record.get('email')}`);
        console.log(`   ID: ${record.get('id').toNumber()}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ No Person nodes with emails found');
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await session.close();
    await closeDriver();
  }
};

checkUsers();