
const { initDriver, getDriver, closeDriver } = require('../config/db');

const seedData = async () => {
  await initDriver();
  const driver = getDriver();
  const session = driver.session();

  try {
    // Clear existing data to prevent duplicates
    console.log('Clearing existing database...');
    await session.run('MATCH (n) DETACH DELETE n');

    // Create Indexes for Performance
    console.log('Creating indexes...');
    await session.run('CREATE INDEX person_id FOR (p:Person) ON (p.id)');
    await session.run('CREATE INDEX person_name FOR (p:Person) ON (p.firstName, p.lastName)');
    await session.run('CREATE INDEX person_gender FOR (p:Person) ON (p.gender)');

    // Create main family members
    console.log('Creating family members...');
    const createPeopleQuery = `
      CREATE (harilal:Person {id: 32, firstName: "Harilal", lastName: "Patel", gender: "Male", dateOfBirth: "1925-03-15", location: "Ahmedabad, Gujarat, India", createdAt: datetime()})
      CREATE (savitri:Person {id: 33, firstName: "Savitri", lastName: "Patel", gender: "Female", dateOfBirth: "1930-07-20", location: "Ahmedabad, Gujarat, India", createdAt: datetime()})
      CREATE (ramesh:Person {id: 34, firstName: "Ramesh", lastName: "Patel", gender: "Male", dateOfBirth: "1955-01-10", location: "Mumbai, Maharashtra, India", createdAt: datetime()})
      CREATE (mallika:Person {id: 35, firstName: "Mallika", lastName: "Patel", gender: "Female", dateOfBirth: "1958-06-20", location: "Mumbai, Maharashtra, India", createdAt: datetime()})
      CREATE (suresh:Person {id: 36, firstName: "Suresh", lastName: "Patel", gender: "Male", dateOfBirth: "1952-09-05", location: "Pune, Maharashtra, India", createdAt: datetime()})
      CREATE (kiran:Person {id: 37, firstName: "Kiran", lastName: "Patel", gender: "Female", location: "Pune, Maharashtra, India", createdAt: datetime()})
      CREATE (prashanth:Person {id: 38, firstName: "Prashanth", lastName: "Patel", gender: "Male", dateOfBirth: "1980-05-15", location: "Mumbai, Maharashtra, India", email: "prashanth@family.com", profilePicture: null, isOnline: true, createdAt: datetime()})
      CREATE (anjali:Person {id: 39, firstName: "Anjali", lastName: "Patel", gender: "Female", dateOfBirth: "1982-08-22", location: "Mumbai, Maharashtra, India", email: "anjali@family.com", createdAt: datetime()})
      CREATE (amit:Person {id: 40, firstName: "Amit", lastName: "Patel", gender: "Male", dateOfBirth: "1983-11-25", location: "Pune, Maharashtra, India", email: "amit@family.com", createdAt: datetime()})
      CREATE (priya:Person {id: 41, firstName: "Priya", lastName: "Patel", gender: "Female", dateOfBirth: "1986-02-14", location: "Pune, Maharashtra, India", email: "priya.patel@family.com", createdAt: datetime()})
      CREATE (vikram:Person {id: 42, firstName: "Vikram", lastName: "Shah", gender: "Male", createdAt: datetime()})
      CREATE (arjun:Person {id: 43, firstName: "Arjun", lastName: "Patel", gender: "Male", dateOfBirth: "2005-03-10", location: "Mumbai, Maharashtra, India", email: "arjun@family.com", createdAt: datetime()})
      CREATE (simran:Person {id: 44, firstName: "Simran", lastName: "Patel", gender: "Female", dateOfBirth: "2008-07-18", location: "Mumbai, Maharashtra, India", email: "simran@family.com", createdAt: datetime()})
      CREATE (meera:Person {id: 55, firstName: "Meera", lastName: "Sharma", gender: "Female", createdAt: datetime()})
    `;
    await session.run(createPeopleQuery);

    // Create relationships
    console.log('Creating relationships...');
    const createRelationshipsQuery = `
      MATCH (harilal:Person {id: 32}), (savitri:Person {id: 33}), (ramesh:Person {id: 34}), (mallika:Person {id: 35}), (suresh:Person {id: 36}), (kiran:Person {id: 37}), (prashanth:Person {id: 38}), (anjali:Person {id: 39}), (amit:Person {id: 40}), (priya:Person {id: 41}), (vikram:Person {id: 42}), (arjun:Person {id: 43}), (simran:Person {id: 44}), (meera:Person {id: 55})
      
      // Grandparents Marriage
      CREATE (harilal)-[:MARRIED_TO]->(savitri)
      CREATE (savitri)-[:MARRIED_TO]->(harilal)
      
      // Parents Generation Marriages
      CREATE (ramesh)-[:MARRIED_TO]->(mallika)
      CREATE (mallika)-[:MARRIED_TO]->(ramesh)
      CREATE (suresh)-[:MARRIED_TO]->(kiran)
      CREATE (kiran)-[:MARRIED_TO]->(suresh)
      
      // Current Generation Marriages
      CREATE (prashanth)-[:MARRIED_TO]->(anjali)
      CREATE (anjali)-[:MARRIED_TO]->(prashanth)
      CREATE (amit)-[:MARRIED_TO]->(meera)
      CREATE (meera)-[:MARRIED_TO]->(amit)
      CREATE (priya)-[:MARRIED_TO]->(vikram)
      CREATE (vikram)-[:MARRIED_TO]->(priya)
      
      // Grandparents to Parents
      CREATE (harilal)-[:FATHER_OF]->(ramesh)
      CREATE (harilal)-[:FATHER_OF]->(suresh)
      CREATE (savitri)-[:MOTHER_OF]->(ramesh)
      CREATE (savitri)-[:MOTHER_OF]->(suresh)
      
      // Parents to Children
      CREATE (ramesh)-[:FATHER_OF]->(prashanth)
      CREATE (mallika)-[:MOTHER_OF]->(prashanth)
      CREATE (suresh)-[:FATHER_OF]->(amit)
      CREATE (suresh)-[:FATHER_OF]->(priya)
      CREATE (kiran)-[:MOTHER_OF]->(amit)
      CREATE (kiran)-[:MOTHER_OF]->(priya)
      
      // Children to Grandchildren
      CREATE (prashanth)-[:FATHER_OF]->(arjun)
      CREATE (prashanth)-[:FATHER_OF]->(simran)
      CREATE (anjali)-[:MOTHER_OF]->(arjun)
      CREATE (anjali)-[:MOTHER_OF]->(simran)
    `;
    await session.run(createRelationshipsQuery);

    // Verification queries
    console.log('Verifying data import...');
    
    // Count persons
    const personCount = await session.run('MATCH (p:Person) RETURN count(p) as totalPersons');
    console.log(`Total persons created: ${personCount.records[0].get('totalPersons').toNumber()}`);
    
    // Count relationships
    const relationshipCount = await session.run('MATCH ()-[r]->() RETURN type(r) as relationshipType, count(r) as count');
    console.log('Relationships created:');
    relationshipCount.records.forEach(record => {
      console.log(`  ${record.get('relationshipType')}: ${record.get('count').toNumber()}`);
    });
    
    // Show family tree structure
    const familyStructure = await session.run(`
      MATCH (p:Person)
      OPTIONAL MATCH (p)-[:FATHER_OF|MOTHER_OF]->(child:Person)
      WITH p, collect(child.firstName + ' ' + child.lastName) as children
      RETURN p.firstName + ' ' + p.lastName as person, children
      ORDER BY p.id
    `);
    
    console.log('\nFamily Structure:');
    familyStructure.records.forEach(record => {
      const person = record.get('person');
      const children = record.get('children').filter(child => child !== ' ');
      if (children.length > 0) {
        console.log(`  ${person} -> ${children.join(', ')}`);
      }
    });

    console.log('\nDatabase seeding completed successfully.');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await session.close();
    await closeDriver();
  }
};

seedData();
