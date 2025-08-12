#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

const testAPI = async () => {
  try {
    console.log('🧪 Testing Family Tree API...\n');

    // Test health endpoint
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);

    // Test login
    console.log('\n2. Testing Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'prashanth@family.com',
      password: 'FamilyTree123!'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log('✅ Login successful for:', user.firstName, user.lastName);

    // Test family tree
    console.log('\n3. Testing Family Tree...');
    const treeResponse = await axios.get(`${BASE_URL}/family/tree`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const familyData = treeResponse.data.data;
    console.log('✅ Family Tree Retrieved:');
    console.log(`   - Current User: ${familyData.currentUser.firstName} ${familyData.currentUser.lastName}`);
    console.log(`   - Ancestors: ${familyData.ancestors.length}`);
    console.log(`   - Descendants: ${familyData.descendants.length}`);
    console.log(`   - Adjacent (Spouses): ${familyData.adjacent.length}`);
    console.log(`   - Total Family Members: ${familyData.totalMembers}`);

    // Show family structure
    console.log('\n🌳 Family Structure from Prashanth\'s perspective:');
    
    if (familyData.ancestors.length > 0) {
      console.log('\n👴👵 Ancestors:');
      familyData.ancestors.forEach(ancestor => {
        console.log(`   - ${ancestor.user.firstName} ${ancestor.user.lastName} (${ancestor.relationship})`);
      });
    }

    if (familyData.adjacent.length > 0) {
      console.log('\n💑 Spouse:');
      familyData.adjacent.forEach(spouse => {
        console.log(`   - ${spouse.user.firstName} ${spouse.user.lastName} (${spouse.relationship})`);
      });
    }

    if (familyData.descendants.length > 0) {
      console.log('\n👶👧 Descendants:');
      familyData.descendants.forEach(descendant => {
        let parentInfo = '';
        if (descendant.parentInfo) {
          parentInfo = ` (via ${descendant.parentInfo.directParent.name})`;
        }
        console.log(`   - ${descendant.user.firstName} ${descendant.user.lastName} (${descendant.relationship})${parentInfo}`);
      });
    }

    console.log('\n✅ All tests passed! Family Tree API is working correctly! 🎉');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
};

// Only run if this file is executed directly
if (require.main === module) {
  // Check if server is running first
  setTimeout(() => {
    testAPI();
  }, 2000); // Give server time to start
}

module.exports = testAPI;
