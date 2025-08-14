const { initDriver, getDriver, closeDriver } = require('../config/db');

const verifyFamilyData = async () => {
  await initDriver();
  const driver = getDriver();
  const session = driver.session();

  try {
    console.log('=== Family Tree Data Verification ===\n');

    // Count persons
    const personCount = await session.run('MATCH (p:Person) RETURN count(p) as totalPersons');
    console.log(`✅ Total persons: ${personCount.records[0].get('totalPersons').toNumber()}`);

    // Count relationships by type
    const relationshipCount = await session.run('MATCH ()-[r]->() RETURN type(r) as relationshipType, count(r) as count ORDER BY count DESC');
    console.log('\n📊 Relationships by type:');
    relationshipCount.records.forEach(record => {
      console.log(`   ${record.get('relationshipType')}: ${record.get('count').toNumber()}`);
    });

    // Show all family members
    const allPersons = await session.run(`
      MATCH (p:Person) 
      RETURN p.id as id, p.firstName as firstName, p.lastName as lastName, p.gender as gender, p.dateOfBirth as dob, p.location as location, p.email as email
      ORDER BY p.id
    `);
    
    console.log('\n👥 All Family Members:');
    allPersons.records.forEach(record => {
      const id = record.get('id').toNumber();
      const firstName = record.get('firstName');
      const lastName = record.get('lastName');
      const gender = record.get('gender');
      const dob = record.get('dob');
      const location = record.get('location');
      const email = record.get('email');
      
      console.log(`   ${id}: ${firstName} ${lastName} (${gender})`);
      if (dob) console.log(`      Born: ${dob}`);
      if (location) console.log(`      Location: ${location}`);
      if (email) console.log(`      Email: ${email}`);
    });

    // Show marriages
    const marriages = await session.run(`
      MATCH (p1:Person)-[:MARRIED_TO]->(p2:Person)
      WHERE p1.id < p2.id
      RETURN p1.firstName + ' ' + p1.lastName as spouse1, p2.firstName + ' ' + p2.lastName as spouse2
    `);
    
    console.log('\n💑 Marriages:');
    marriages.records.forEach(record => {
      console.log(`   ${record.get('spouse1')} ⚭ ${record.get('spouse2')}`);
    });

    // Show parent-child relationships
    const parentChild = await session.run(`
      MATCH (parent:Person)-[r:FATHER_OF|MOTHER_OF]->(child:Person)
      RETURN parent.firstName + ' ' + parent.lastName as parent, 
             type(r) as relationship,
             child.firstName + ' ' + child.lastName as child
      ORDER BY parent.id, child.id
    `);
    
    console.log('\n👨‍👩‍👧‍👦 Parent-Child Relationships:');
    parentChild.records.forEach(record => {
      const parent = record.get('parent');
      const relationship = record.get('relationship');
      const child = record.get('child');
      const relationSymbol = relationship === 'FATHER_OF' ? '👨' : '👩';
      console.log(`   ${parent} ${relationSymbol} → ${child}`);
    });

    // Show family generations
    console.log('\n🌳 Family Tree by Generation:');
    
    // Generation 1 (Grandparents)
    const grandparents = await session.run(`
      MATCH (gp:Person)
      WHERE NOT (gp)<-[:FATHER_OF|MOTHER_OF]-()
      RETURN gp.firstName + ' ' + gp.lastName as name
      ORDER BY gp.id
    `);
    console.log('   Generation 1 (Grandparents):');
    grandparents.records.forEach(record => {
      console.log(`     ${record.get('name')}`);
    });

    // Generation 2 (Parents)
    const parents = await session.run(`
      MATCH (gp:Person)-[:FATHER_OF|MOTHER_OF]->(p:Person)-[:FATHER_OF|MOTHER_OF]->()
      RETURN DISTINCT p.firstName + ' ' + p.lastName as name
      ORDER BY p.firstName
    `);
    console.log('   Generation 2 (Parents):');
    parents.records.forEach(record => {
      console.log(`     ${record.get('name')}`);
    });

    // Generation 3 (Current generation)
    const currentGen = await session.run(`
      MATCH (p:Person)-[:FATHER_OF|MOTHER_OF]->(c:Person)
      WHERE NOT (c)-[:FATHER_OF|MOTHER_OF]->()
      RETURN DISTINCT p.firstName + ' ' + p.lastName as parent, 
             collect(c.firstName + ' ' + c.lastName) as children
    `);
    console.log('   Generation 3 (Current Adults):');
    currentGen.records.forEach(record => {
      const parent = record.get('parent');
      console.log(`     ${parent}`);
    });

    // Generation 4 (Children)
    const children = await session.run(`
      MATCH (c:Person)
      WHERE NOT (c)-[:FATHER_OF|MOTHER_OF]->()
      AND (c)<-[:FATHER_OF|MOTHER_OF]-()
      RETURN c.firstName + ' ' + c.lastName as name, c.dateOfBirth as dob
      ORDER BY c.dateOfBirth DESC
    `);
    console.log('   Generation 4 (Children):');
    children.records.forEach(record => {
      const name = record.get('name');
      const dob = record.get('dob');
      console.log(`     ${name} ${dob ? `(born ${dob})` : ''}`);
    });

    console.log('\n✅ Family tree data verification completed successfully!');

  } catch (error) {
    console.error('❌ Error verifying family data:', error);
  } finally {
    await session.close();
    await closeDriver();
  }
};

verifyFamilyData();