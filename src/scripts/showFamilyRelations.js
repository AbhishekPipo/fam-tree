const { initDriver, getDriver, closeDriver } = require('../config/db');

const showFamilyRelations = async () => {
  await initDriver();
  const driver = getDriver();
  const session = driver.session();

  try {
    console.log('🌳 FAMILY TREE RELATIONSHIPS\n');

    // Show parent-child relationships
    const parentChild = await session.run(`
      MATCH (parent:Person)-[r:FATHER_OF|MOTHER_OF]->(child:Person)
      RETURN parent.firstName + ' ' + parent.lastName as parent, 
             type(r) as relationship,
             child.firstName + ' ' + child.lastName as child
    `);
    
    console.log('👨‍👩‍👧‍👦 Parent → Child Relationships:');
    parentChild.records.forEach(record => {
      const parent = record.get('parent');
      const relationship = record.get('relationship');
      const child = record.get('child');
      const relationSymbol = relationship === 'FATHER_OF' ? '👨' : '👩';
      console.log(`   ${parent} ${relationSymbol} → ${child}`);
    });

    // Show family structure by generation
    console.log('\n📊 FAMILY STRUCTURE BY GENERATION:\n');

    // Grandparents (no parents)
    const grandparents = await session.run(`
      MATCH (gp:Person)
      WHERE NOT (gp)<-[:FATHER_OF|MOTHER_OF]-()
      RETURN gp.firstName + ' ' + gp.lastName as name, gp.dateOfBirth as dob
      ORDER BY gp.id
    `);
    console.log('🏛️  Generation 1 - Grandparents:');
    grandparents.records.forEach(record => {
      const name = record.get('name');
      const dob = record.get('dob');
      console.log(`     ${name} ${dob ? `(${dob})` : ''}`);
    });

    // Parents (have parents and children)
    const parents = await session.run(`
      MATCH (p:Person)
      WHERE (p)<-[:FATHER_OF|MOTHER_OF]-() AND (p)-[:FATHER_OF|MOTHER_OF]->()
      RETURN p.firstName + ' ' + p.lastName as name, p.dateOfBirth as dob
      ORDER BY p.id
    `);
    console.log('\n👫 Generation 2 - Parents:');
    parents.records.forEach(record => {
      const name = record.get('name');
      const dob = record.get('dob');
      console.log(`     ${name} ${dob ? `(${dob})` : ''}`);
    });

    // Current adults (have parents but no children, or have children but are not grandparents)
    const currentAdults = await session.run(`
      MATCH (p:Person)
      WHERE (p)<-[:FATHER_OF|MOTHER_OF]-() 
      AND NOT (p)-[:FATHER_OF|MOTHER_OF]->()
      OR ((p)-[:FATHER_OF|MOTHER_OF]->() AND NOT EXISTS {
        MATCH (p)-[:FATHER_OF|MOTHER_OF]->(child)-[:FATHER_OF|MOTHER_OF]->()
      })
      RETURN DISTINCT p.firstName + ' ' + p.lastName as name, p.dateOfBirth as dob, p.email as email
      ORDER BY p.id
    `);
    console.log('\n🧑‍🤝‍🧑 Generation 3 - Current Adults:');
    currentAdults.records.forEach(record => {
      const name = record.get('name');
      const dob = record.get('dob');
      const email = record.get('email');
      console.log(`     ${name} ${dob ? `(${dob})` : ''} ${email ? `- ${email}` : ''}`);
    });

    // Children (have parents but no children)
    const children = await session.run(`
      MATCH (c:Person)
      WHERE (c)<-[:FATHER_OF|MOTHER_OF]-() AND NOT (c)-[:FATHER_OF|MOTHER_OF]->()
      RETURN c.firstName + ' ' + c.lastName as name, c.dateOfBirth as dob, c.email as email
      ORDER BY c.dateOfBirth DESC
    `);
    console.log('\n👶 Generation 4 - Children:');
    children.records.forEach(record => {
      const name = record.get('name');
      const dob = record.get('dob');
      const email = record.get('email');
      console.log(`     ${name} ${dob ? `(${dob})` : ''} ${email ? `- ${email}` : ''}`);
    });

    // Show complete family paths
    console.log('\n🔗 COMPLETE FAMILY LINEAGES:\n');
    const lineages = await session.run(`
      MATCH path = (grandparent:Person)-[:FATHER_OF|MOTHER_OF*2..3]->(descendant:Person)
      WHERE NOT (grandparent)<-[:FATHER_OF|MOTHER_OF]-()
      RETURN [node in nodes(path) | node.firstName + ' ' + node.lastName] as lineage
    `);
    
    lineages.records.forEach(record => {
      const lineage = record.get('lineage');
      console.log(`   ${lineage.join(' → ')}`);
    });

    console.log('\n✅ Family relationships displayed successfully!');

  } catch (error) {
    console.error('❌ Error showing family relations:', error);
  } finally {
    await session.close();
    await closeDriver();
  }
};

showFamilyRelations();