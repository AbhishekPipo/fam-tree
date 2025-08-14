const { initDriver, getDriver, closeDriver } = require('../config/db');
const familyService = require('../services/familyService');

const testServiceDirectly = async () => {
  await initDriver();
  
  try {
    console.log('🔍 Testing Family Service Directly...\n');
    
    // Test getFamilyTreeByEmail
    console.log('📧 Testing getFamilyTreeByEmail...');
    const treeDataByEmail = await familyService.getFamilyTreeByEmail('prashanth@family.com');
    
    console.log('📊 Results from getFamilyTreeByEmail:');
    console.log(`   Current User: ${treeDataByEmail.currentUser ? 'Present' : 'Missing'}`);
    console.log(`   Ancestors: ${treeDataByEmail.ancestors ? treeDataByEmail.ancestors.length : 0}`);
    console.log(`   Descendants: ${treeDataByEmail.descendants ? treeDataByEmail.descendants.length : 0}`);
    console.log(`   Spouse: ${treeDataByEmail.spouse ? treeDataByEmail.spouse.length : 0}`);
    console.log(`   Cousins: ${treeDataByEmail.cousins ? treeDataByEmail.cousins.length : 0}`);
    
    // Test getFamilyTree with ID
    console.log('\n🆔 Testing getFamilyTree with ID 38...');
    const treeDataById = await familyService.getFamilyTree(38);
    
    console.log('📊 Results from getFamilyTree:');
    console.log(`   Current User: ${treeDataById.currentUser ? 'Present' : 'Missing'}`);
    console.log(`   Ancestors: ${treeDataById.ancestors ? treeDataById.ancestors.length : 0}`);
    console.log(`   Descendants: ${treeDataById.descendants ? treeDataById.descendants.length : 0}`);
    console.log(`   Spouse: ${treeDataById.spouse ? treeDataById.spouse.length : 0}`);
    console.log(`   Cousins: ${treeDataById.cousins ? treeDataById.cousins.length : 0}`);
    
    // Test direct Neo4j query
    console.log('\n🔍 Testing Direct Neo4j Query...');
    const driver = getDriver();
    const session = driver.session();
    
    const directResult = await session.run(
      'MATCH (p:Person {id: 38})-[:FATHER_OF|MOTHER_OF]->(child) RETURN child.firstName as name'
    );
    
    console.log(`📊 Direct query results: ${directResult.records.length} children found`);
    directResult.records.forEach(record => {
      console.log(`   Child: ${record.get('name')}`);
    });
    
    await session.close();
    
  } catch (error) {
    console.error('❌ Service test failed:', error.message);
  } finally {
    await closeDriver();
  }
};

testServiceDirectly();