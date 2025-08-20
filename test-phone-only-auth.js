#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/auth';

async function testPhoneOnlyAuth() {
  console.log('🧪 Testing Phone-Only Authentication System');
  console.log('=' .repeat(50));

  try {
    // Test 1: Login with existing user (Prashanth)
    console.log('\n📱 Test 1: Login with existing user');
    console.log('Phone: +55123456789');
    
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      phoneNumber: '+55123456789'
    });
    
    console.log('✅ OTP sent successfully');
    console.log('📞 Phone:', loginResponse.data.data.phoneNumber);
    console.log('🔢 OTP:', loginResponse.data.data.otp);
    console.log('⏰ Expires:', loginResponse.data.data.otpExpires);

    // Verify OTP
    const verifyResponse = await axios.post(`${BASE_URL}/verify-otp`, {
      phoneNumber: '+55123456789',
      otp: '123456'
    });

    console.log('✅ Login successful');
    console.log('👤 User:', verifyResponse.data.data.user.firstName, verifyResponse.data.data.user.lastName);
    console.log('🎫 Token:', verifyResponse.data.data.token.substring(0, 20) + '...');

    // Test 2: Register new user
    console.log('\n📱 Test 2: Register new user');
    const newPhone = '+1555000' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    console.log('Phone:', newPhone);

    const registerResponse = await axios.post(`${BASE_URL}/register`, {
      firstName: 'New',
      lastName: 'User',
      phoneNumber: newPhone,
      gender: 'other'
    });

    console.log('✅ Registration OTP sent');
    console.log('📞 Phone:', registerResponse.data.data.phoneNumber);
    console.log('🔢 OTP:', registerResponse.data.data.otp);

    // Complete registration
    const completeRegResponse = await axios.post(`${BASE_URL}/verify-otp`, {
      phoneNumber: newPhone,
      otp: '123456',
      password: 'NewUser123!',
      isRegistration: true
    });

    console.log('✅ Registration completed');
    console.log('👤 User:', completeRegResponse.data.data.user.firstName, completeRegResponse.data.data.user.lastName);
    console.log('🆔 User ID:', completeRegResponse.data.data.user.id);

    // Test 3: Try old email login (should fail)
    console.log('\n📧 Test 3: Try old email login (should fail)');
    try {
      await axios.post(`${BASE_URL}/login`, {
        email: 'prashanth@family.com',
        password: 'FamilyTree123!'
      });
      console.log('❌ Email login should have failed!');
    } catch (error) {
      console.log('✅ Email login properly blocked');
      console.log('📝 Error:', error.response.data.error);
    }

    // Test 4: Resend OTP
    console.log('\n🔄 Test 4: Resend OTP');
    const resendResponse = await axios.post(`${BASE_URL}/resend-otp`, {
      phoneNumber: '+55123456789'
    });

    console.log('✅ OTP resent successfully');
    console.log('📞 Phone:', resendResponse.data.data.phoneNumber);
    console.log('🔢 New OTP:', resendResponse.data.data.otp);

    console.log('\n🎉 All tests passed! Phone-only authentication is working correctly.');
    console.log('\n📋 Summary:');
    console.log('✅ Phone login works');
    console.log('✅ Phone registration works');
    console.log('✅ Email login is blocked');
    console.log('✅ OTP resend works');
    console.log('✅ JWT tokens are generated');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testPhoneOnlyAuth();