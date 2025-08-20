const database = require('./src/config/database');

async function testDatabase() {
  try {
    console.log('Connecting to database...');
    await database.connect();
    console.log('✅ Database connected');
    
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await database.runQuery('RETURN 1 as test');
    console.log('✅ Database connection successful');
    
    // Test creating a simple user
    const testUser = {
      id: 'test-user-123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      gender: 'male',
      isPhoneVerified: false,
      phoneOtp: '123456',
      phoneOtpExpires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      phoneOtpAttempts: 0,
      role: 'member',
      isActive: true,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Testing user creation...');
    const createResult = await database.runQuery(`
      MERGE (u:User:Person {id: $id})
      SET u += $properties
      RETURN u
    `, {
      id: testUser.id,
      properties: testUser
    });
    
    console.log('✅ User creation successful');
    
    // Test finding user by phone
    console.log('Testing find by phone...');
    const findResult = await database.runQuery(`
      MATCH (u:User {phone: $phone}) 
      RETURN u
    `, { phone: '+1234567890' });
    
    if (findResult.records.length > 0) {
      console.log('✅ User found by phone number');
      const userData = database.constructor.extractNodeProperties(findResult.records[0], 'u');
      console.log('User data:', userData);
    }
    
    // Cleanup
    await database.runQuery('MATCH (u:User {id: $id}) DELETE u', { id: testUser.id });
    console.log('✅ Cleanup completed');
    
    await database.close();
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDatabase();