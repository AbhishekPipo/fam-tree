#!/usr/bin/env node

/**
 * Test script for Phone Authentication
 * This script demonstrates the phone number authentication flow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/auth';

// Test data
const testUser = {
  firstName: 'John',
  lastName: 'Doe',
  phoneNumber: '+1234567890',
  gender: 'male',
  dateOfBirth: '1990-05-15'
};

const testPassword = 'TestPass123!';

async function testPhoneAuthentication() {
  console.log('🧪 Testing Phone Authentication Flow\n');

  try {
    // Step 1: Register with phone number
    console.log('📱 Step 1: Registering with phone number...');
    const registerResponse = await axios.post(`${BASE_URL}/phone/register`, testUser);
    
    console.log('✅ Registration successful!');
    console.log('📞 Phone Number:', registerResponse.data.data.phoneNumber);
    console.log('🔢 OTP (Development):', registerResponse.data.data.otp);
    console.log('⏰ OTP Expires:', registerResponse.data.data.otpExpires);
    console.log('');

    // Step 2: Verify OTP and complete registration
    console.log('🔐 Step 2: Verifying OTP and setting password...');
    const verifyResponse = await axios.post(`${BASE_URL}/phone/verify-otp`, {
      phoneNumber: testUser.phoneNumber,
      otp: '123456', // Static OTP
      password: testPassword,
      isRegistration: true
    });

    console.log('✅ OTP verification successful!');
    console.log('👤 User ID:', verifyResponse.data.data.user.id);
    console.log('🎫 Token:', verifyResponse.data.data.token.substring(0, 20) + '...');
    console.log('');

    // Step 3: Test login with phone number
    console.log('🔑 Step 3: Testing login with phone number...');
    const loginResponse = await axios.post(`${BASE_URL}/phone/login`, {
      phoneNumber: testUser.phoneNumber
    });

    console.log('✅ Login OTP sent!');
    console.log('🔢 OTP (Development):', loginResponse.data.data.otp);
    console.log('');

    // Step 4: Verify login OTP
    console.log('🔓 Step 4: Verifying login OTP...');
    const loginVerifyResponse = await axios.post(`${BASE_URL}/phone/verify-otp`, {
      phoneNumber: testUser.phoneNumber,
      otp: '123456', // Static OTP
      isRegistration: false
    });

    console.log('✅ Login successful!');
    console.log('👤 User:', loginVerifyResponse.data.data.user.firstName, loginVerifyResponse.data.data.user.lastName);
    console.log('📱 Phone Verified:', loginVerifyResponse.data.data.user.isPhoneVerified);
    console.log('🎫 New Token:', loginVerifyResponse.data.data.token.substring(0, 20) + '...');
    console.log('');

    // Step 5: Test resend OTP
    console.log('🔄 Step 5: Testing OTP resend...');
    const resendResponse = await axios.post(`${BASE_URL}/phone/resend-otp`, {
      phoneNumber: testUser.phoneNumber
    });

    console.log('✅ OTP resent successfully!');
    console.log('🔢 New OTP (Development):', resendResponse.data.data.otp);
    console.log('');

    console.log('🎉 All phone authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.data?.details) {
      console.error('📋 Validation errors:', error.response.data.details);
    }
  }
}

// Test error cases
async function testErrorCases() {
  console.log('\n🧪 Testing Error Cases\n');

  try {
    // Test duplicate phone registration
    console.log('📱 Testing duplicate phone registration...');
    await axios.post(`${BASE_URL}/phone/register`, testUser);
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✅ Correctly rejected duplicate phone number');
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }

  try {
    // Test invalid OTP
    console.log('🔐 Testing invalid OTP...');
    await axios.post(`${BASE_URL}/phone/verify-otp`, {
      phoneNumber: testUser.phoneNumber,
      otp: '000000',
      isRegistration: false
    });
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected invalid OTP');
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }

  try {
    // Test non-existent phone number
    console.log('📞 Testing non-existent phone number...');
    await axios.post(`${BASE_URL}/phone/login`, {
      phoneNumber: '+9999999999'
    });
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Correctly rejected non-existent phone number');
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }

  console.log('\n🎉 Error case tests completed!');
}

// Main execution
async function main() {
  console.log('🚀 Starting Phone Authentication Tests');
  console.log('📍 Server URL:', BASE_URL);
  console.log('⚠️  Make sure the server is running on port 3000\n');

  await testPhoneAuthentication();
  await testErrorCases();

  console.log('\n✨ All tests completed!');
  console.log('\n📝 API Endpoints tested:');
  console.log('   POST /api/auth/phone/register');
  console.log('   POST /api/auth/phone/login');
  console.log('   POST /api/auth/phone/verify-otp');
  console.log('   POST /api/auth/phone/resend-otp');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testPhoneAuthentication, testErrorCases };