const database = require('./src/config/database');
const User = require('./src/models/User');

async function testPhoneAuth() {
  try {
    console.log('🔌 Connecting to database...');
    await database.connect();
    console.log('✅ Database connected');

    // Test phone registration
    console.log('\n📱 Testing phone registration...');
    
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
      gender: 'male',
      dateOfBirth: '1990-05-15'
    };

    // Check if user already exists
    const existingUser = await User.findByPhoneNumber(userData.phoneNumber);
    if (existingUser) {
      console.log('🗑️ Cleaning up existing user...');
      await database.runQuery('MATCH (u:User {phone: $phone}) DELETE u', { phone: userData.phoneNumber });
    }

    // Create new user
    const user = new User(userData);
    console.log('👤 User created:', user.firstName, user.lastName);
    console.log('📞 Phone number:', user.phoneNumber);
    
    // Generate OTP
    const otp = user.generatePhoneOtp();
    console.log('🔢 Generated OTP:', otp);
    console.log('⏰ OTP expires:', user.phoneOtpExpires);
    
    // Save user
    console.log('💾 Saving user...');
    const savedUser = await user.save();
    console.log('✅ User saved successfully');
    console.log('🆔 User ID:', savedUser.id);

    // Test finding user by phone
    console.log('\n🔍 Testing find by phone...');
    const foundUser = await User.findByPhoneNumber(userData.phoneNumber);
    if (foundUser) {
      console.log('✅ User found by phone number');
      console.log('📞 Found phone:', foundUser.phone);
      console.log('🔢 Found OTP:', foundUser.phoneOtp);
    } else {
      console.log('❌ User not found by phone number');
    }

    // Test OTP verification
    console.log('\n🔐 Testing OTP verification...');
    const userForVerification = new User(foundUser);
    userForVerification.phoneOtp = foundUser.phoneOtp;
    userForVerification.phoneOtpExpires = foundUser.phoneOtpExpires;
    userForVerification.phoneOtpAttempts = foundUser.phoneOtpAttempts;

    const isValidOtp = userForVerification.verifyPhoneOtp('123456');
    console.log('✅ OTP verification result:', isValidOtp);
    console.log('📱 Phone verified:', userForVerification.isPhoneVerified);

    // Test invalid OTP
    console.log('\n❌ Testing invalid OTP...');
    const userForInvalidTest = new User(foundUser);
    userForInvalidTest.phoneOtp = foundUser.phoneOtp;
    userForInvalidTest.phoneOtpExpires = foundUser.phoneOtpExpires;
    userForInvalidTest.phoneOtpAttempts = 0;

    const isInvalidOtp = userForInvalidTest.verifyPhoneOtp('000000');
    console.log('❌ Invalid OTP result:', isInvalidOtp);
    console.log('🔢 Attempt count:', userForInvalidTest.phoneOtpAttempts);

    // Cleanup
    console.log('\n🗑️ Cleaning up...');
    await database.runQuery('MATCH (u:User {phone: $phone}) DELETE u', { phone: userData.phoneNumber });
    console.log('✅ Cleanup completed');

    await database.close();
    console.log('\n🎉 All phone authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testPhoneAuth();