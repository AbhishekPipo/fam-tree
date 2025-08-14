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

const testSimpleStructure = async () => {
  try {
    console.log('🔐 Testing Login...');
    
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
    
    console.log('\n🔍 Testing Simple Structure...');
    
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
      
      console.log('📊 DATA COUNTS:');
      console.log(`   👤 Current User: ${data.currentUser ? 'Present' : 'Missing'}`);
      console.log(`   👴 Ancestors: ${data.ancestors ? data.ancestors.length : 0}`);
      console.log(`   👶 Descendants: ${data.descendants ? data.descendants.length : 0}`);
      console.log(`   👫 Adjacent: ${data.adjacent ? data.adjacent.length : 0}`);
      
      if (data.currentUser) {
        console.log('\n👤 CURRENT USER:');
        console.log(`   Name: ${data.currentUser.firstName} ${data.currentUser.lastName}`);
        console.log(`   Email: ${data.currentUser.email}`);
        console.log(`   Father: ${data.currentUser.father ? data.currentUser.father.firstName + ' ' + data.currentUser.father.lastName : 'Not found'}`);
        console.log(`   Mother: ${data.currentUser.mother ? data.currentUser.mother.firstName + ' ' + data.currentUser.mother.lastName : 'Not found'}`);
      }
      
      console.log('\n🔍 DEBUGGING EMPTY ARRAYS:');
      console.log('   This suggests the Neo4j queries are not returning data');
      console.log('   Let\'s check if the relationships exist in the database');
      
    } else {
      console.log('❌ Failed to get family tree:', familyResponse.error);
    }
    
  } catch (error) {
    console.error('❌ Simple Structure Test failed:', error.message);
  }
};

testSimpleStructure();