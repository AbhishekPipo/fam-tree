const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data
const testUser = {
  firstName: 'John',
  middleName: 'Michael',
  lastName: 'Doe',
  phoneNumber: '+1234567890',
  gender: 'male',
  dateOfBirth: '1990-05-15'
};

const profileData = {
  dateOfBirth: '1990-05-15',
  location: 'New York, USA',
  occupation: 'Software Engineer',
  employer: 'Tech Corp Inc.',
  biography: 'A passionate software engineer with expertise in full-stack development.',
  address: {
    street: '123 Main Street',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postalCode: '10001'
  },
  preferences: {
    language: 'en',
    timezone: 'America/New_York',
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      showEmail: false,
      showPhone: false,
      showBirthDate: true
    }
  }
};

async function testCompleteProfileFlow() {
  try {
    console.log('🚀 Testing Complete Profile Flow...\n');

    // Step 1: Register user
    console.log('1️⃣ Registering user...');
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    console.log('✅ Registration initiated:', {
      success: registerResponse.data.success,
      message: registerResponse.data.message,
      phoneNumber: registerResponse.data.data.phoneNumber,
      registrationId: registerResponse.data.data.registrationId
    });
    console.log('📱 OTP:', registerResponse.data.data.otp);

    // Step 2: Verify OTP to complete registration
    console.log('\n2️⃣ Verifying OTP to complete registration...');
    const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      phoneNumber: testUser.phoneNumber,
      otp: registerResponse.data.data.otp,
      isRegistration: true
    });
    console.log('✅ Registration completed:', {
      success: verifyResponse.data.success,
      message: verifyResponse.data.message,
      userId: verifyResponse.data.data.user.id,
      hasCompletedProfile: verifyResponse.data.data.user.hasCompletedProfile,
      requiresProfileCompletion: verifyResponse.data.data.requiresProfileCompletion
    });

    const token = verifyResponse.data.data.token;

    // Step 3: Complete profile with additional details
    console.log('\n3️⃣ Completing profile with additional details...');
    const completeProfileResponse = await axios.post(
      `${BASE_URL}/api/auth/complete-profile`,
      profileData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Profile completed:', {
      success: completeProfileResponse.data.success,
      message: completeProfileResponse.data.message,
      hasCompletedProfile: completeProfileResponse.data.data.user.hasCompletedProfile,
      location: completeProfileResponse.data.data.user.location,
      occupation: completeProfileResponse.data.data.user.occupation
    });

    // Step 4: Get updated profile
    console.log('\n4️⃣ Fetching updated profile...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Profile fetched:', {
      success: profileResponse.data.success,
      user: {
        id: profileResponse.data.data.user.id,
        fullName: `${profileResponse.data.data.user.firstName} ${profileResponse.data.data.user.lastName}`,
        phone: profileResponse.data.data.user.phone,
        hasCompletedProfile: profileResponse.data.data.user.hasCompletedProfile,
        location: profileResponse.data.data.user.location,
        occupation: profileResponse.data.data.user.occupation,
        employer: profileResponse.data.data.user.employer
      }
    });

    console.log('\n🎉 Complete Profile Flow Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Test login flow
async function testLoginFlow() {
  try {
    console.log('\n🔐 Testing Login Flow...\n');

    // Step 1: Login with existing phone number
    console.log('1️⃣ Initiating login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      phoneNumber: testUser.phoneNumber
    });
    console.log('✅ Login OTP sent:', {
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      otp: loginResponse.data.data.otp
    });

    // Step 2: Verify OTP for login
    console.log('\n2️⃣ Verifying OTP for login...');
    const verifyLoginResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      phoneNumber: testUser.phoneNumber,
      otp: loginResponse.data.data.otp,
      isRegistration: false
    });
    console.log('✅ Login successful:', {
      success: verifyLoginResponse.data.success,
      message: verifyLoginResponse.data.message,
      userId: verifyLoginResponse.data.data.user.id,
      hasCompletedProfile: verifyLoginResponse.data.data.user.hasCompletedProfile
    });

    console.log('\n🎉 Login Flow Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Login test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run tests
async function runTests() {
  await testCompleteProfileFlow();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  await testLoginFlow();
}

if (require.main === module) {
  runTests();
}

module.exports = {
  testCompleteProfileFlow,
  testLoginFlow,
  runTests
};
