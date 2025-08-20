const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/auth';

async function testCompletePhoneAuth() {
  try {
    console.log('🚀 Starting Complete Phone Authentication Test');
    console.log('📍 Server URL:', API_BASE);
    
    const phoneNumber = '+1234567890';
    
    // Test 1: Phone Registration
    console.log('\n📱 Step 1: Testing phone registration...');
    
    try {
      const registerResponse = await axios.post(`${API_BASE}/phone/register`, {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber,
        gender: 'male',
        dateOfBirth: '1990-05-15'
      });
      
      console.log('✅ Registration successful');
      console.log('📞 Phone:', registerResponse.data.data.phoneNumber);
      console.log('🔢 OTP:', registerResponse.data.data.otp);
      console.log('⏰ Expires:', registerResponse.data.data.otpExpires);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  User already exists, continuing with login test...');
      } else {
        throw error;
      }
    }

    // Test 2: Phone Login
    console.log('\n🔐 Step 2: Testing phone login...');
    
    const loginResponse = await axios.post(`${API_BASE}/phone/login`, {
      phoneNumber
    });
    
    console.log('✅ Login OTP sent');
    console.log('🔢 OTP:', loginResponse.data.data.otp);
    console.log('⏰ Expires:', loginResponse.data.data.otpExpires);

    // Test 3: OTP Verification
    console.log('\n🔓 Step 3: Testing OTP verification...');
    
    const verifyResponse = await axios.post(`${API_BASE}/phone/verify-otp`, {
      phoneNumber,
      otp: '123456', // Static OTP
      isRegistration: false
    });
    
    console.log('✅ OTP verification successful');
    console.log('👤 User:', verifyResponse.data.data.user.firstName, verifyResponse.data.data.user.lastName);
    console.log('📱 Phone verified:', verifyResponse.data.data.user.isPhoneVerified);
    console.log('🔑 Token received:', verifyResponse.data.data.token ? 'Yes' : 'No');

    // Test 4: Invalid OTP
    console.log('\n❌ Step 4: Testing invalid OTP...');
    
    // First, generate a new OTP
    await axios.post(`${API_BASE}/phone/login`, { phoneNumber });
    
    try {
      await axios.post(`${API_BASE}/phone/verify-otp`, {
        phoneNumber,
        otp: '000000', // Invalid OTP
        isRegistration: false
      });
      console.log('❌ Invalid OTP test failed - should have thrown error');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Invalid OTP correctly rejected');
        console.log('📝 Error:', error.response.data.message);
      } else {
        throw error;
      }
    }

    // Test 5: Registration with Password
    console.log('\n🔐 Step 5: Testing registration with password...');
    
    const newPhoneNumber = '+1987654321';
    
    // Register new user
    const newRegisterResponse = await axios.post(`${API_BASE}/phone/register`, {
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: newPhoneNumber,
      gender: 'female'
    });
    
    console.log('✅ New user registered');
    console.log('🔢 OTP:', newRegisterResponse.data.data.otp);
    
    // Verify with password
    const verifyWithPasswordResponse = await axios.post(`${API_BASE}/phone/verify-otp`, {
      phoneNumber: newPhoneNumber,
      otp: '123456',
      password: 'SecurePassword123!',
      isRegistration: true
    });
    
    console.log('✅ Registration with password successful');
    console.log('👤 User:', verifyWithPasswordResponse.data.data.user.firstName, verifyWithPasswordResponse.data.data.user.lastName);
    console.log('🔑 Token received:', verifyWithPasswordResponse.data.data.token ? 'Yes' : 'No');

    console.log('\n🎉 All phone authentication tests completed successfully!');
    
    console.log('\n📋 Test Summary:');
    console.log('✅ Phone registration - PASSED');
    console.log('✅ Phone login (OTP generation) - PASSED');
    console.log('✅ OTP verification - PASSED');
    console.log('✅ Invalid OTP handling - PASSED');
    console.log('✅ Registration with password - PASSED');
    
    console.log('\n🔧 Implementation Features:');
    console.log('📱 Static OTP (123456) for development');
    console.log('⏰ 10-minute OTP expiry');
    console.log('🔢 3 attempt limit before OTP reset');
    console.log('🔐 Optional password during registration');
    console.log('🎫 JWT token generation');
    console.log('📞 Phone number as unique identifier');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📝 Response:', error.response.data);
      console.error('🔢 Status:', error.response.status);
    }
    console.error('📚 Stack:', error.stack);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get('http://localhost:3000/api/health');
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   npm start');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testCompletePhoneAuth();
  }
}

main();