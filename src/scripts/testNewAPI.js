const axios = require('axios');

const testNewAPI = async () => {
  const baseURL = 'http://localhost:3000/api';
  
  try {
    console.log('🔐 Testing Login...');
    
    // 1. Login to get JWT token
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'prashanth@family.com',
      password: 'prashanth123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`Token: ${token.substring(0, 20)}...`);
    
    console.log('\n🌳 Testing Family Tree API (NEW - without userId in URL)...');
    
    // 2. Get family tree using JWT token (no userId in URL)
    const familyResponse = await axios.get(`${baseURL}/family/tree`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Family tree retrieved successfully!');
    console.log('📊 Family Tree Data:');
    console.log(`   Current User: ${familyResponse.data.data.currentUser.firstName} ${familyResponse.data.data.currentUser.lastName}`);
    console.log(`   Ancestors: ${familyResponse.data.data.ancestors.length}`);
    console.log(`   Descendants: ${familyResponse.data.data.descendants.length}`);
    console.log(`   Spouse: ${familyResponse.data.data.adjacent.filter(a => a.relationship === 'spouse').length}`);
    console.log(`   Cousins: ${familyResponse.data.data.adjacent.filter(a => a.relationship === 'cousin').length}`);
    
    // Show some family members
    if (familyResponse.data.data.ancestors.length > 0) {
      console.log('\n👴 Ancestors:');
      familyResponse.data.data.ancestors.forEach(ancestor => {
        console.log(`   ${ancestor.user.firstName} ${ancestor.user.lastName} (${ancestor.relationship})`);
      });
    }
    
    if (familyResponse.data.data.descendants.length > 0) {
      console.log('\n👶 Descendants:');
      familyResponse.data.data.descendants.forEach(descendant => {
        console.log(`   ${descendant.user.firstName} ${descendant.user.lastName} (${descendant.relationship})`);
      });
    }
    
    if (familyResponse.data.data.adjacent.length > 0) {
      console.log('\n👫 Adjacent Family:');
      familyResponse.data.data.adjacent.forEach(adj => {
        console.log(`   ${adj.user.firstName} ${adj.user.lastName} (${adj.relationship})`);
      });
    }
    
    console.log('\n✅ API Test completed successfully!');
    console.log('\n🎉 NEW API BENEFITS:');
    console.log('   ✅ No userId in URL - more secure');
    console.log('   ✅ Uses JWT token for user identification');
    console.log('   ✅ Prevents unauthorized access to other users\' data');
    console.log('   ✅ Cleaner API design');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
  }
};

testNewAPI();