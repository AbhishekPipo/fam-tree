
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
      CREATE (harilal:Person {id: 32, firstName: "Harilal", lastName: "Patel", gender: "Male", createdAt: datetime()})
      CREATE (savitri:Person {id: 33, firstName: "Savitri", lastName: "Patel", gender: "Female", createdAt: datetime()})
      CREATE (ramesh:Person {id: 34, firstName: "Ramesh", lastName: "Patel", gender: "Male", createdAt: datetime()})
      CREATE (mallika:Person {id: 35, firstName: "Mallika", lastName: "Patel", gender: "Female", createdAt: datetime()})
      CREATE (suresh:Person {id: 36, firstName: "Suresh", lastName: "Patel", gender: "Male", createdAt: datetime()})
      CREATE (prashanth:Person {id: 38, firstName: "Prashanth", lastName: "Patel", gender: "Male", dateOfBirth: "1980-05-15", email: "prashanth@family.com", location: "Mumbai, Maharashtra, India", profilePicture: null, isOnline: true, createdAt: datetime()})
      CREATE (anjali:Person {id: 39, firstName: "Anjali", lastName: "Patel", gender: "Female", createdAt: datetime()})
      CREATE (amit:Person {id: 40, firstName: "Amit", lastName: "Patel", gender: "Male", createdAt: datetime()})
      CREATE (priya:Person {id: 41, firstName: "Priya", lastName: "Patel", gender: "Female", createdAt: datetime()})
      CREATE (arjun:Person {id: 43, firstName: "Arjun", lastName: "Patel", gender: "Male", createdAt: datetime()})
      CREATE (simran:Person {id: 44, firstName: "Simran", lastName: "Patel", gender: "Female", createdAt: datetime()})
    `;
    await session.run(createPeopleQuery);

    // Create relationships
    console.log('Creating relationships...');
    const createRelationshipsQuery = `
      MATCH (harilal:Person {id: 32}), (savitri:Person {id: 33}), (ramesh:Person {id: 34}), (mallika:Person {id: 35}), (suresh:Person {id: 36}), (prashanth:Person {id: 38}), (anjali:Person {id: 39}), (amit:Person {id: 40}), (priya:Person {id: 41}), (arjun:Person {id: 43}), (simran:Person {id: 44})
      CREATE (harilal)-[:MARRIED_TO]->(savitri)
      CREATE (savitri)-[:MARRIED_TO]->(harilal)
      CREATE (harilal)-[:FATHER_OF]->(ramesh)
      CREATE (harilal)-[:FATHER_OF]->(suresh)
      CREATE (savitri)-[:MOTHER_OF]->(ramesh)
      CREATE (savitri)-[:MOTHER_OF]->(suresh)
      CREATE (ramesh)-[:MARRIED_TO]->(mallika)
      CREATE (mallika)-[:MARRIED_TO]->(ramesh)
      CREATE (ramesh)-[:FATHER_OF]->(prashanth)
      CREATE (mallika)-[:MOTHER_OF]->(prashanth)
      CREATE (suresh)-[:FATHER_OF]->(amit)
      CREATE (suresh)-[:FATHER_OF]->(priya)
      CREATE (prashanth)-[:MARRIED_TO]->(anjali)
      CREATE (anjali)-[:MARRIED_TO]->(prashanth)
      CREATE (prashanth)-[:FATHER_OF]->(arjun)
      CREATE (prashanth)-[:FATHER_OF]->(simran)
      CREATE (anjali)-[:MOTHER_OF]->(arjun)
      CREATE (anjali)-[:MOTHER_OF]->(simran)
    `;
    await session.run(createRelationshipsQuery);

    console.log('Database seeding completed successfully.');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await session.close();
    await closeDriver();
  }
};

seedData();
