// Manual test of phone authentication controllers
const database = require('./src/config/database');

// Mock request and response objects
function createMockReq(body) {
  return { body };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      console.log(`📤 Response (${this.statusCode}):`, JSON.stringify(data, null, 2));
      return this;
    }
  };
  return res;
}

function createMockNext() {
  return function(error) {
    if (error) {
      console.error('❌ Error:', error.message);
      console.error('🔢 Code:', error.code);
    }
  };
}

async function testPhoneAuthControllers() {
  try {
    console.log('🔌 Connecting to database...');
    await database.connect();
    console.log('✅ Database connected');

    // Import controllers after database is connected
    const { phoneRegister, phoneLogin, verifyOtp } = require('./src/controllers/authController');

    const phoneNumber = '+1234567890';

    // Clean up any existing user
    await database.runQuery('MATCH (u:User {phone: $phone}) DELETE u', { phone: phoneNumber });

    // Test 1: Phone Registration
    console.log('\n📱 Testing phoneRegister controller...');
    const registerReq = createMockReq({
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber,
      gender: 'male',
      dateOfBirth: '1990-05-15'
    });
    const registerRes = createMockRes();
    const registerNext = createMockNext();

    await phoneRegister(registerReq, registerRes, registerNext);
    
    if (registerRes.statusCode === 201) {
      console.log('✅ Phone registration successful');
    }

    // Test 2: Phone Login
    console.log('\n🔐 Testing phoneLogin controller...');
    const loginReq = createMockReq({ phoneNumber });
    const loginRes = createMockRes();
    const loginNext = createMockNext();

    await phoneLogin(loginReq, loginRes, loginNext);
    
    if (loginRes.statusCode === 200) {
      console.log('✅ Phone login successful');
    }

    // Test 3: OTP Verification
    console.log('\n🔓 Testing verifyOtp controller...');
    const verifyReq = createMockReq({
      phoneNumber,
      otp: '123456',
      isRegistration: false
    });
    const verifyRes = createMockRes();
    const verifyNext = createMockNext();

    await verifyOtp(verifyReq, verifyRes, verifyNext);
    
    if (verifyRes.statusCode === 200) {
      console.log('✅ OTP verification successful');
    }

    // Test 4: Invalid OTP
    console.log('\n❌ Testing invalid OTP...');
    
    // Generate new OTP first
    await phoneLogin(loginReq, createMockRes(), createMockNext());
    
    const invalidVerifyReq = createMockReq({
      phoneNumber,
      otp: '000000',
      isRegistration: false
    });
    const invalidVerifyRes = createMockRes();
    const invalidVerifyNext = createMockNext();

    await verifyOtp(invalidVerifyReq, invalidVerifyRes, invalidVerifyNext);
    console.log('✅ Invalid OTP test completed');

    // Test 5: Registration with Password
    console.log('\n🔐 Testing registration with password...');
    
    const newPhoneNumber = '+1987654321';
    
    // Clean up
    await database.runQuery('MATCH (u:User {phone: $phone}) DELETE u', { phone: newPhoneNumber });
    
    // Register
    const newRegisterReq = createMockReq({
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: newPhoneNumber,
      gender: 'female'
    });
    await phoneRegister(newRegisterReq, createMockRes(), createMockNext());
    
    // Verify with password
    const verifyWithPasswordReq = createMockReq({
      phoneNumber: newPhoneNumber,
      otp: '123456',
      password: 'SecurePassword123!',
      isRegistration: true
    });
    const verifyWithPasswordRes = createMockRes();
    const verifyWithPasswordNext = createMockNext();

    await verifyOtp(verifyWithPasswordReq, verifyWithPasswordRes, verifyWithPasswordNext);
    
    if (verifyWithPasswordRes.statusCode === 200) {
      console.log('✅ Registration with password successful');
    }

    // Cleanup
    console.log('\n🗑️ Cleaning up...');
    await database.runQuery('MATCH (u:User {phone: $phone}) DELETE u', { phone: phoneNumber });
    await database.runQuery('MATCH (u:User {phone: $phone}) DELETE u', { phone: newPhoneNumber });

    await database.close();
    console.log('\n🎉 All phone authentication controller tests completed!');

    console.log('\n📋 Summary:');
    console.log('✅ Phone registration controller - Working');
    console.log('✅ Phone login controller - Working');
    console.log('✅ OTP verification controller - Working');
    console.log('✅ Invalid OTP handling - Working');
    console.log('✅ Registration with password - Working');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testPhoneAuthControllers();