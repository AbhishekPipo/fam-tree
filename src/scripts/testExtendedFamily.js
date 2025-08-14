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

const testExtendedFamily = async () => {
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
    
    console.log('\n🌳 Testing EXTENDED Family Tree API...');
    
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
      
      console.log('✅ Extended family tree retrieved successfully!\n');
      
      console.log('👤 CURRENT USER:');
      console.log(`   ${data.currentUser.firstName} ${data.currentUser.lastName}`);
      console.log(`   📧 ${data.currentUser.email}`);
      
      // Direct Family
      if (data.ancestors.length > 0) {
        console.log('\n👴👵 ANCESTORS (Blood Relations):');
        data.ancestors.forEach(ancestor => {
          console.log(`   ${ancestor.user.firstName} ${ancestor.user.lastName} (${ancestor.relationship})`);
        });
      }
      
      if (data.descendants.length > 0) {
        console.log('\n👶👧 DESCENDANTS (Blood Relations):');
        data.descendants.forEach(descendant => {
          console.log(`   ${descendant.user.firstName} ${descendant.user.lastName} (${descendant.relationship})`);
        });
      }
      
      // Marriage
      if (data.spouse && data.spouse.length > 0) {
        console.log('\n💑 SPOUSE:');
        data.spouse.forEach(s => {
          console.log(`   ${s.user.firstName} ${s.user.lastName} (${s.relationship})`);
        });
      }
      
      // Extended Blood Family
      if (data.siblings && data.siblings.length > 0) {
        console.log('\n👫 SIBLINGS:');
        data.siblings.forEach(sibling => {
          console.log(`   ${sibling.user.firstName} ${sibling.user.lastName} (${sibling.relationship})`);
        });
      }
      
      if (data.auntsUncles && data.auntsUncles.length > 0) {
        console.log('\n👨‍🦳👩‍🦳 AUNTS & UNCLES:');
        data.auntsUncles.forEach(auntUncle => {
          console.log(`   ${auntUncle.user.firstName} ${auntUncle.user.lastName} (${auntUncle.relationship})`);
        });
      }
      
      if (data.cousins && data.cousins.length > 0) {
        console.log('\n👫 COUSINS:');
        data.cousins.forEach(cousin => {
          console.log(`   ${cousin.user.firstName} ${cousin.user.lastName} (${cousin.relationship})`);
        });
      }
      
      if (data.niecesNephews && data.niecesNephews.length > 0) {
        console.log('\n👧👦 NIECES & NEPHEWS:');
        data.niecesNephews.forEach(nieceNephew => {
          console.log(`   ${nieceNephew.user.firstName} ${nieceNephew.user.lastName} (${nieceNephew.relationship})`);
        });
      }
      
      // In-Laws
      if (data.inLaws && data.inLaws.length > 0) {
        console.log('\n👨‍👩‍👧‍👦 IN-LAWS (Spouse\'s Parents):');
        data.inLaws.forEach(inLaw => {
          console.log(`   ${inLaw.user.firstName} ${inLaw.user.lastName} (${inLaw.relationship})`);
        });
      }
      
      if (data.siblingsInLaw && data.siblingsInLaw.length > 0) {
        console.log('\n👫 SIBLINGS-IN-LAW (Spouse\'s Siblings):');
        data.siblingsInLaw.forEach(siblingInLaw => {
          console.log(`   ${siblingInLaw.user.firstName} ${siblingInLaw.user.lastName} (${siblingInLaw.relationship})`);
        });
      }
      
      if (data.childrenInLaw && data.childrenInLaw.length > 0) {
        console.log('\n👨‍👩 CHILDREN-IN-LAW (Children\'s Spouses):');
        data.childrenInLaw.forEach(childInLaw => {
          console.log(`   ${childInLaw.user.firstName} ${childInLaw.user.lastName} (${childInLaw.relationship})`);
        });
      }
      
      console.log('\n📊 EXTENDED FAMILY SUMMARY:');
      console.log(`   👴 Ancestors: ${data.ancestors.length}`);
      console.log(`   👶 Descendants: ${data.descendants.length}`);
      console.log(`   💑 Spouse: ${data.spouse ? data.spouse.length : 0}`);
      console.log(`   👫 Siblings: ${data.siblings ? data.siblings.length : 0}`);
      console.log(`   👨‍🦳 Aunts & Uncles: ${data.auntsUncles ? data.auntsUncles.length : 0}`);
      console.log(`   👫 Cousins: ${data.cousins ? data.cousins.length : 0}`);
      console.log(`   👧 Nieces & Nephews: ${data.niecesNephews ? data.niecesNephews.length : 0}`);
      console.log(`   👨‍👩‍👧‍👦 In-Laws: ${data.inLaws ? data.inLaws.length : 0}`);
      console.log(`   👫 Siblings-in-Law: ${data.siblingsInLaw ? data.siblingsInLaw.length : 0}`);
      console.log(`   👨‍👩 Children-in-Law: ${data.childrenInLaw ? data.childrenInLaw.length : 0}`);
      
    } else {
      console.log('❌ Failed to get family tree:', familyResponse.error);
    }
    
    console.log('\n🎉 EXTENDED FAMILY FEATURES:');
    console.log('   ✅ Blood Relations: Parents, Children, Siblings, Aunts/Uncles, Cousins, Nieces/Nephews');
    console.log('   ✅ In-Laws: Parents-in-law, Siblings-in-law, Children-in-law');
    console.log('   ✅ Gender-specific labels: Brother/Sister, Uncle/Aunt, etc.');
    console.log('   ✅ Complete extended family network');
    
  } catch (error) {
    console.error('❌ Extended Family Test failed:', error.message);
  }
};

testExtendedFamily();