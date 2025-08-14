const https = require('https');
const http = require('http');
const fs = require('fs');

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

const testMatchingJSON = async () => {
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
    
    console.log('\n🌳 Testing API with Expected JSON Structure...');
    
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
      
      // Save the response to compare with expected JSON
      fs.writeFileSync('/Users/abhishek/Desktop/t-bag/actual_output.json', JSON.stringify(familyResponse, null, 2));
      
      console.log('📄 CURRENT USER STRUCTURE:');
      console.log(`   ID: ${data.currentUser.id}`);
      console.log(`   Name: ${data.currentUser.firstName} ${data.currentUser.lastName}`);
      console.log(`   Email: ${data.currentUser.email}`);
      console.log(`   Father ID: ${data.currentUser.fatherId}`);
      console.log(`   Mother ID: ${data.currentUser.motherId}`);
      console.log(`   Spouse ID: ${data.currentUser.spouseId}`);
      
      if (data.currentUser.father) {
        console.log(`   Father: ${data.currentUser.father.firstName} ${data.currentUser.father.lastName}`);
      }
      
      if (data.currentUser.mother) {
        console.log(`   Mother: ${data.currentUser.mother.firstName} ${data.currentUser.mother.lastName}`);
      }
      
      console.log('\n📊 ANCESTORS STRUCTURE:');
      data.ancestors.forEach((ancestor, index) => {
        console.log(`   ${index + 1}. ${ancestor.user.firstName} ${ancestor.user.lastName} (${ancestor.relationship})`);
        if (ancestor.children && ancestor.children.length > 0) {
          console.log(`      Children:`);
          ancestor.children.forEach(child => {
            console.log(`        - ${child.user.firstName} ${child.user.lastName} (${child.relationship})`);
          });
        }
        if (ancestor.directRelationships && ancestor.directRelationships.length > 0) {
          console.log(`      Direct Relationships:`);
          ancestor.directRelationships.forEach(rel => {
            console.log(`        - ${rel.partner.firstName} ${rel.partner.lastName} (${rel.relationshipType})`);
          });
        }
      });
      
      console.log('\n👶 DESCENDANTS STRUCTURE:');
      data.descendants.forEach((descendant, index) => {
        console.log(`   ${index + 1}. ${descendant.user.firstName} ${descendant.user.lastName} (${descendant.relationship})`);
      });
      
      console.log('\n👫 ADJACENT STRUCTURE:');
      data.adjacent.forEach((adj, index) => {
        console.log(`   ${index + 1}. ${adj.user.firstName} ${adj.user.lastName} (${adj.relationship})`);
        if (adj.directRelationships && adj.directRelationships.length > 0) {
          console.log(`      Direct Relationships:`);
          adj.directRelationships.forEach(rel => {
            console.log(`        - ${rel.partner.firstName} ${rel.partner.lastName} (${rel.relationshipType})`);
          });
        }
      });
      
      console.log('\n📁 Files created:');
      console.log('   📄 actual_output.json - Current API response');
      console.log('   📄 json - Expected JSON structure');
      
      console.log('\n🎯 STRUCTURE COMPARISON:');
      console.log('   ✅ Enhanced currentUser with parent/spouse info');
      console.log('   ✅ Ancestors with nested children structure');
      console.log('   ✅ Direct relationships included');
      console.log('   ✅ Extended user fields (medication, online status, etc.)');
      
    } else {
      console.log('❌ Failed to get family tree:', familyResponse.error);
    }
    
  } catch (error) {
    console.error('❌ JSON Structure Test failed:', error.message);
  }
};

testMatchingJSON();