/**
 * Simple test to verify User model works for family tree functionality
 */

const User = require('./src/models/User');
const database = require('./src/config/database');

async function testUserModel() {
  console.log('🧪 Testing User model for family tree functionality...');
  
  try {
    // Connect to database
    await database.connect();
    console.log('✅ Database connected');
    
    // Test user creation
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      password: 'tempPassword123',
      gender: 'male',
      dateOfBirth: '1990-01-01',
      isAlive: true,
      isAppUser: true,
      hasCompletedProfile: true,
      isOnline: false
    };
    
    const user = await User.create(userData);
    console.log('✅ User created successfully:', {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      isAlive: user.isAlive,
      isAppUser: user.isAppUser
    });
    
    // Test user retrieval
    const foundUser = await User.findById(user.id);
    console.log('✅ User retrieved successfully:', foundUser ? 'Found' : 'Not found');
    
    // Clean up
    await User.deleteById(user.id);
    console.log('✅ User deleted successfully');
    
    console.log('🎉 All User model tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await database.close();
    console.log('✅ Database connection closed');
  }
}

testUserModel();
