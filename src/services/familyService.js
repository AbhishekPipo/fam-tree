const { getDriver } = require('../config/db');

const getFamilyTree = async (userId) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    // 1. Get Current User
    const currentUserResult = await session.run(
      'MATCH (currentUser:Person {id: $userId}) RETURN currentUser',
      { userId }
    );

    // 2. Get Ancestors
    const ancestorsResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})
      MATCH path = (currentUser)<-[:FATHER_OF|MOTHER_OF*]-(ancestor)
      WITH ancestor, length(path) as level
      WHERE level <= 3
      RETURN ancestor, level
      ORDER BY level DESC
      `,
      { userId }
    );

    // 3. Get Descendants
    const descendantsResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})
      MATCH path = (currentUser)-[:FATHER_OF|MOTHER_OF*]->(descendant)
      WITH descendant, length(path) as level
      RETURN descendant, level
      ORDER BY level
      `,
      { userId }
    );

    // 4. Get Spouse
    const spouseResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})-[:MARRIED_TO]->(spouse)
      RETURN spouse
      `,
      { userId }
    );

    // 5. Get Cousins
    const cousinsResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})<-[:FATHER_OF|MOTHER_OF]-(parent)<-[:FATHER_OF|MOTHER_OF]-(grandparent)-[:FATHER_OF|MOTHER_OF]->(uncle)-[:FATHER_OF|MOTHER_OF]->(cousin)
      WHERE uncle <> parent AND cousin <> currentUser
      RETURN cousin
      `,
      { userId }
    );

    return {
      currentUser: currentUserResult.records[0].get('currentUser'),
      ancestors: ancestorsResult.records,
      descendants: descendantsResult.records,
      spouse: spouseResult.records,
      cousins: cousinsResult.records,
    };
  } finally {
    await session.close();
  }
};

const getFamilyTreeByEmail = async (email) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    // First, find the Person by email
    const personResult = await session.run(
      'MATCH (p:Person {email: $email}) RETURN p.id as personId',
      { email }
    );

    if (personResult.records.length === 0) {
      throw new Error('Person not found with this email');
    }

    const personId = personResult.records[0].get('personId').toNumber();
    
    // Now get the family tree using the Person ID
    return await getFamilyTree(personId);
  } finally {
    await session.close();
  }
};

module.exports = { getFamilyTree, getFamilyTreeByEmail };