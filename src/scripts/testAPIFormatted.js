const https = require('https');
const http = require('http');

const makeRequest = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

const testAPI = async () => {
  try {
    console.log('🔐 Testing Login...');
    
    // 1. Login
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = {
      email: 'prashanth@family.com',
      password: 'prashanth123'
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    const token = loginResponse.token;
    
    console.log('✅ Login successful');
    console.log(`📧 Email: prashanth@family.com`);
    console.log(`🔑 Token: ${token.substring(0, 30)}...`);
    
    console.log('\n🌳 Testing Family Tree API (NEW - without userId in URL)...');
    
    // 2. Get family tree
    const familyOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/family/tree',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const familyResponse = await makeRequest(familyOptions);
    
    if (familyResponse.success) {
      const data = familyResponse.data;
      
      console.log('✅ Family tree retrieved successfully!\n');
      
      console.log('👤 CURRENT USER:');
      console.log(`   ${data.currentUser.firstName} ${data.currentUser.lastName}`);
      console.log(`   📧 ${data.currentUser.email}`);
      console.log(`   🎂 Born: ${data.currentUser.dateOfBirth}`);
      console.log(`   📍 Location: ${data.currentUser.location}`);
      
      if (data.ancestors.length > 0) {
        console.log('\n👴👵 ANCESTORS:');
        data.ancestors.forEach(ancestor => {
          console.log(`   ${ancestor.user.firstName} ${ancestor.user.lastName} (${ancestor.relationship})`);
          if (ancestor.user.dateOfBirth) {
            console.log(`      🎂 Born: ${ancestor.user.dateOfBirth}`);
          }
          if (ancestor.user.location) {
            console.log(`      📍 ${ancestor.user.location}`);
          }
        });
      }
      
      if (data.descendants.length > 0) {
        console.log('\n👶👧 DESCENDANTS:');
        data.descendants.forEach(descendant => {
          console.log(`   ${descendant.user.firstName} ${descendant.user.lastName} (${descendant.relationship})`);
          if (descendant.user.dateOfBirth) {
            console.log(`      🎂 Born: ${descendant.user.dateOfBirth}`);
          }
          if (descendant.user.email) {
            console.log(`      📧 ${descendant.user.email}`);
          }
        });
      }
      
      const spouse = data.adjacent.filter(a => a.relationship === 'spouse');
      const cousins = data.adjacent.filter(a => a.relationship === 'cousin');
      
      if (spouse.length > 0) {
        console.log('\n💑 SPOUSE:');
        spouse.forEach(s => {
          console.log(`   ${s.user.firstName} ${s.user.lastName}`);
          if (s.user.email) {
            console.log(`      📧 ${s.user.email}`);
          }
        });
      }
      
      if (cousins.length > 0) {
        console.log('\n👫 COUSINS:');
        // Remove duplicates
        const uniqueCousins = cousins.filter((cousin, index, self) => 
          index === self.findIndex(c => c.user.id === cousin.user.id)
        );
        uniqueCousins.forEach(cousin => {
          console.log(`   ${cousin.user.firstName} ${cousin.user.lastName}`);
          if (cousin.user.email) {
            console.log(`      📧 ${cousin.user.email}`);
          }
        });
      }
      
      console.log('\n📊 SUMMARY:');
      console.log(`   👴 Ancestors: ${data.ancestors.length}`);
      console.log(`   👶 Descendants: ${data.descendants.length}`);
      console.log(`   💑 Spouse: ${spouse.length}`);
      console.log(`   👫 Cousins: ${cousins.filter((cousin, index, self) => index === self.findIndex(c => c.user.id === cousin.user.id)).length}`);
      
    } else {
      console.log('❌ Failed to get family tree:', familyResponse.error);
    }
    
    console.log('\n🎉 NEW API BENEFITS:');
    console.log('   ✅ No userId in URL - more secure');
    console.log('   ✅ Uses JWT token for user identification');
    console.log('   ✅ Prevents unauthorized access to other users\' data');
    console.log('   ✅ Cleaner API design: GET /api/family/tree');
    console.log('   ✅ Frontend doesn\'t need to manage user IDs');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }
};

testAPI();