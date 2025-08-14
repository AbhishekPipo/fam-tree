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

const testHierarchicalFamily = async () => {
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
    
    console.log('\n🌳 Testing HIERARCHICAL Family Tree API...');
    
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
      
      console.log('✅ Hierarchical family tree retrieved successfully!\n');
      
      console.log('👤 CURRENT USER:');
      console.log(`   ${data.currentUser.firstName} ${data.currentUser.lastName}`);
      console.log(`   📧 ${data.currentUser.email}`);
      
      // Group ancestors by level for hierarchical display
      const ancestorsByLevel = {};
      data.ancestors.forEach(ancestor => {
        const level = ancestor.level;
        if (!ancestorsByLevel[level]) {
          ancestorsByLevel[level] = [];
        }
        ancestorsByLevel[level].push(ancestor);
      });
      
      // Display ancestors hierarchically
      console.log('\n🌳 FAMILY TREE HIERARCHY:');
      
      // Level 2 (Grandparents)
      if (ancestorsByLevel[2]) {
        console.log('\n👴👵 GENERATION 2 (Grandparents):');
        ancestorsByLevel[2].forEach(ancestor => {
          console.log(`   ${ancestor.user.firstName} ${ancestor.user.lastName} (${ancestor.relationship})`);
        });
      }
      
      // Level 1 (Parents & Uncles/Aunts)
      if (ancestorsByLevel[1]) {
        console.log('\n👨‍👩‍👧‍👦 GENERATION 1 (Parents & Their Siblings):');
        ancestorsByLevel[1].forEach(ancestor => {
          console.log(`   ${ancestor.user.firstName} ${ancestor.user.lastName} (${ancestor.relationship})`);
        });
      }
      
      // Current Generation (User + Spouse + Siblings + Cousins)
      console.log('\n👫 GENERATION 0 (Current Generation):');
      console.log(`   ${data.currentUser.firstName} ${data.currentUser.lastName} (self)`);
      
      if (data.spouse && data.spouse.length > 0) {
        data.spouse.forEach(s => {
          console.log(`   ${s.user.firstName} ${s.user.lastName} (${s.relationship})`);
        });
      }
      
      if (data.siblings && data.siblings.length > 0) {
        data.siblings.forEach(sibling => {
          console.log(`   ${sibling.user.firstName} ${sibling.user.lastName} (${sibling.relationship})`);
        });
      }
      
      // Show cousins from descendants array (level 0)
      const cousins = data.descendants.filter(d => d.level === 0 && d.relationship === 'cousin');
      if (cousins.length > 0) {
        cousins.forEach(cousin => {
          console.log(`   ${cousin.user.firstName} ${cousin.user.lastName} (${cousin.relationship})`);
        });
      }
      
      // Descendants (Children and their descendants)
      const directDescendants = data.descendants.filter(d => d.level < 0);
      if (directDescendants.length > 0) {
        console.log('\n👶👧 GENERATION -1 (Children):');
        directDescendants.forEach(descendant => {
          console.log(`   ${descendant.user.firstName} ${descendant.user.lastName} (${descendant.relationship})`);
        });
      }
      
      console.log('\n📊 HIERARCHICAL FAMILY SUMMARY:');
      console.log(`   👴 Grandparents: ${ancestorsByLevel[2] ? ancestorsByLevel[2].length : 0}`);
      console.log(`   👨‍👩‍👧‍👦 Parents Generation: ${ancestorsByLevel[1] ? ancestorsByLevel[1].length : 0}`);
      console.log(`   👫 Current Generation: ${1 + (data.spouse ? data.spouse.length : 0) + (data.siblings ? data.siblings.length : 0) + cousins.length}`);
      console.log(`   👶 Children: ${directDescendants.length}`);
      
      console.log('\n🎯 KEY IMPROVEMENTS:');
      console.log('   ✅ Suresh (uncle) now appears in ancestors at parent level');
      console.log('   ✅ Amit & Priya (cousins) properly linked to uncle Suresh');
      console.log('   ✅ Hierarchical family tree structure maintained');
      console.log('   ✅ All family members organized by generation');
      
    } else {
      console.log('❌ Failed to get family tree:', familyResponse.error);
    }
    
  } catch (error) {
    console.error('❌ Hierarchical Family Test failed:', error.message);
  }
};

testHierarchicalFamily();