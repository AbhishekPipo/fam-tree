const { initDriver, getDriver, closeDriver } = require('../config/db');
const bcrypt = require('bcryptjs');

const createPrashanthUser = async () => {
  await initDriver();
  const driver = getDriver();
  const session = driver.session();

  try {
    console.log('👤 Creating User account for Prashanth...\n');

    // Hash a default password
    const defaultPassword = 'prashanth123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create User node for Prashanth
    const result = await session.run(`
      CREATE (u:User {
        id: randomUUID(), 
        email: $email, 
        password: $password, 
        name: $name,
        createdAt: datetime()
      }) 
      RETURN u
    `, {
      email: 'prashanth@family.com',
      password: hashedPassword,
      name: 'Prashanth Patel'
    });

    const user = result.records[0].get('u').properties;
    
    console.log('✅ User account created successfully!');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Password: ${defaultPassword} (default)`);
    console.log(`   User ID: ${user.id}`);

    // Also check if we can link to the Person node
    const linkResult = await session.run(`
      MATCH (u:User {email: $email}), (p:Person {email: $email})
      CREATE (u)-[:REPRESENTS]->(p)
      RETURN u, p
    `, { email: 'prashanth@family.com' });

    if (linkResult.records.length > 0) {
      console.log('🔗 Linked User account to Person node in family tree');
    }

    console.log('\n📋 Login Credentials:');
    console.log(`   Email: prashanth@family.com`);
    console.log(`   Password: ${defaultPassword}`);

  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await session.close();
    await closeDriver();
  }
};

createPrashanthUser();