const { initDriver, getDriver, closeDriver } = require('../config/db');

const testInLawRelationships = async () => {
  await initDriver();
  const driver = getDriver();
  const session = driver.session();

  try {
    console.log('🔍 Testing In-Law Relationships for Prashanth...\n');

    // Test: Get Prashanth's in-laws (Anjali's parents)
    console.log('👨‍👩‍👧‍👦 Looking for Prashanth\'s In-Laws (Anjali\'s parents):');
    const inLawsQuery = `
      MATCH (prashanth:Person {id: 38})-[:MARRIED_TO]->(anjali:Person)<-[:FATHER_OF|MOTHER_OF]-(inLaw)
      RETURN inLaw.firstName + ' ' + inLaw.lastName as name, inLaw.gender as gender
    `;
    const inLawsResult = await session.run(inLawsQuery);
    
    if (inLawsResult.records.length > 0) {
      inLawsResult.records.forEach(record => {
        const name = record.get('name');
        const gender = record.get('gender');
        const relationship = gender === 'Male' ? 'father-in-law' : 'mother-in-law';
        console.log(`   ${name} (${relationship})`);
      });
    } else {
      console.log('   ❌ No in-laws found - Anjali\'s parents not in database');
    }

    // Test: Get Prashanth's siblings-in-law (Anjali's siblings)
    console.log('\n👫 Looking for Prashanth\'s Siblings-in-Law (Anjali\'s siblings):');
    const siblingsInLawQuery = `
      MATCH (prashanth:Person {id: 38})-[:MARRIED_TO]->(anjali:Person)<-[:FATHER_OF|MOTHER_OF]-(parent)-[:FATHER_OF|MOTHER_OF]->(siblingInLaw)
      WHERE siblingInLaw <> anjali
      RETURN siblingInLaw.firstName + ' ' + siblingInLaw.lastName as name, siblingInLaw.gender as gender
    `;
    const siblingsInLawResult = await session.run(siblingsInLawQuery);
    
    if (siblingsInLawResult.records.length > 0) {
      siblingsInLawResult.records.forEach(record => {
        const name = record.get('name');
        const gender = record.get('gender');
        const relationship = gender === 'Male' ? 'brother-in-law' : 'sister-in-law';
        console.log(`   ${name} (${relationship})`);
      });
    } else {
      console.log('   ❌ No siblings-in-law found - Anjali\'s siblings not in database');
    }

    // Test: Get children-in-law (spouses of Prashanth's children)
    console.log('\n👨‍👩 Looking for Prashanth\'s Children-in-Law (spouses of Arjun/Simran):');
    const childrenInLawQuery = `
      MATCH (prashanth:Person {id: 38})-[:FATHER_OF]->(child)-[:MARRIED_TO]->(childInLaw)
      RETURN child.firstName + ' ' + child.lastName as childName, 
             childInLaw.firstName + ' ' + childInLaw.lastName as inLawName, 
             childInLaw.gender as gender
    `;
    const childrenInLawResult = await session.run(childrenInLawQuery);
    
    if (childrenInLawResult.records.length > 0) {
      childrenInLawResult.records.forEach(record => {
        const childName = record.get('childName');
        const inLawName = record.get('inLawName');
        const gender = record.get('gender');
        const relationship = gender === 'Male' ? 'son-in-law' : 'daughter-in-law';
        console.log(`   ${inLawName} (${relationship} - married to ${childName})`);
      });
    } else {
      console.log('   ❌ No children-in-law found - Arjun and Simran are not married yet (too young!)');
    }

    // Show what we DO have for Prashanth
    console.log('\n✅ CURRENT EXTENDED FAMILY FOR PRASHANTH:');
    
    // Uncle's family (Suresh's family)
    console.log('\n👨‍👩‍👧‍👦 Uncle Suresh\'s Family:');
    const unclesFamilyQuery = `
      MATCH (suresh:Person {id: 36})-[:MARRIED_TO]->(spouse)
      RETURN spouse.firstName + ' ' + spouse.lastName as name
      UNION
      MATCH (suresh:Person {id: 36})-[:FATHER_OF]->(child)
      RETURN child.firstName + ' ' + child.lastName as name
    `;
    const unclesFamilyResult = await session.run(unclesFamilyQuery);
    
    unclesFamilyResult.records.forEach(record => {
      console.log(`   ${record.get('name')}`);
    });

    console.log('\n💡 TO GET MORE IN-LAW RELATIONSHIPS:');
    console.log('   📝 Add Anjali\'s parents to the database');
    console.log('   📝 Add Anjali\'s siblings to the database');
    console.log('   📝 Add spouses for adult children when they marry');
    console.log('   📝 Add more extended family members');

  } catch (error) {
    console.error('❌ Error testing in-law relationships:', error);
  } finally {
    await session.close();
    await closeDriver();
  }
};

testInLawRelationships();