const { getDriver } = require('../config/db');

const addPerson = async (person) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      'CREATE (p:Person {id: randomUUID(), name: $name, gender: $gender}) RETURN p',
      person
    );
    return result.records[0].get('p').properties;
  } finally {
    await session.close();
  }
};

const addRelationship = async (fromPersonId, toPersonId, relationshipType) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    await session.run(
      'MATCH (a:Person {id: $fromPersonId}), (b:Person {id: $toPersonId}) ' +
      'CREATE (a)-[r:RELATED_TO {type: $relationshipType}]->(b)',
      { fromPersonId, toPersonId, relationshipType }
    );
  } finally {
    await session.close();
  }
};

const getFamilyTree = async (userId) => {
    const driver = getDriver();
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (p:Person)-[r:RELATED_TO]-(o:Person) WHERE p.id = $userId OR o.id = $userId RETURN p, r, o',
        { userId }
      );
  
      const nodes = new Map();
      const links = [];
  
      result.records.forEach(record => {
        const person1 = record.get('p').properties;
        const person2 = record.get('o').properties;
        const relationship = record.get('r').properties;
  
        if (!nodes.has(person1.id)) {
          nodes.set(person1.id, { id: person1.id, name: person1.name, gender: person1.gender });
        }
        if (!nodes.has(person2.id)) {
          nodes.set(person2.id, { id: person2.id, name: person2.name, gender: person2.gender });
        }
  
        links.push({ 
          source: person1.id, 
          target: person2.id, 
          type: relationship.type 
        });
      });
  
      return { nodes: Array.from(nodes.values()), links };
    } finally {
      await session.close();
    }
  };

module.exports = { addPerson, addRelationship, getFamilyTree };
