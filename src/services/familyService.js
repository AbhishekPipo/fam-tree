const { getDriver } = require('../config/db');

const getFamilyTree = async (userId) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    // 1. Get Current User with parent and spouse info
    const currentUserResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})
      OPTIONAL MATCH (currentUser)<-[:FATHER_OF]-(father)
      OPTIONAL MATCH (currentUser)<-[:MOTHER_OF]-(mother)
      OPTIONAL MATCH (currentUser)-[:MARRIED_TO]-(spouse)
      RETURN currentUser, father, mother, spouse
      `,
      { userId }
    );

    // 2. Get Ancestors (Direct bloodline only)
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

    // 2b. Get Ancestors' Siblings (Uncles/Aunts at parent level)
    const ancestorSiblingsResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})<-[:FATHER_OF|MOTHER_OF]-(parent)<-[:FATHER_OF|MOTHER_OF]-(grandparent)-[:FATHER_OF|MOTHER_OF]->(ancestorSibling)
      WHERE ancestorSibling <> parent
      RETURN ancestorSibling, 1 as level, 'sibling_of_ancestor' as type
      `,
      { userId }
    );

    // 3. Get Descendants (Direct bloodline)
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

    // 3b. Get Descendants of Uncles/Aunts (Cousins and their children)
    const cousinDescendantsResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})<-[:FATHER_OF|MOTHER_OF]-(parent)<-[:FATHER_OF|MOTHER_OF]-(grandparent)-[:FATHER_OF|MOTHER_OF]->(uncle)
      WHERE uncle <> parent
      MATCH path = (uncle)-[:FATHER_OF|MOTHER_OF*]->(cousinDescendant)
      WITH cousinDescendant, length(path) as level
      RETURN cousinDescendant, level, 'cousin_line' as type
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

    // 5. Get Siblings
    const siblingsResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})<-[:FATHER_OF|MOTHER_OF]-(parent)-[:FATHER_OF|MOTHER_OF]->(sibling)
      WHERE sibling <> currentUser
      RETURN DISTINCT sibling
      `,
      { userId }
    );

    // 6. Get Aunts & Uncles
    const auntsUnclesResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})<-[:FATHER_OF|MOTHER_OF]-(parent)<-[:FATHER_OF|MOTHER_OF]-(grandparent)-[:FATHER_OF|MOTHER_OF]->(auntUncle)
      WHERE auntUncle <> parent
      RETURN DISTINCT auntUncle
      `,
      { userId }
    );

    // 7. Get Cousins
    const cousinsResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})<-[:FATHER_OF|MOTHER_OF]-(parent)<-[:FATHER_OF|MOTHER_OF]-(grandparent)-[:FATHER_OF|MOTHER_OF]->(uncle)-[:FATHER_OF|MOTHER_OF]->(cousin)
      WHERE uncle <> parent AND cousin <> currentUser
      RETURN DISTINCT cousin
      `,
      { userId }
    );

    // 8. Get Nieces & Nephews
    const niecesNephewsResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})<-[:FATHER_OF|MOTHER_OF]-(parent)-[:FATHER_OF|MOTHER_OF]->(sibling)-[:FATHER_OF|MOTHER_OF]->(nieceNephew)
      WHERE sibling <> currentUser
      RETURN DISTINCT nieceNephew
      `,
      { userId }
    );

    // 9. Get In-Laws (Parents of Spouse)
    const inLawsResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})-[:MARRIED_TO]->(spouse)<-[:FATHER_OF|MOTHER_OF]-(inLaw)
      RETURN DISTINCT inLaw
      `,
      { userId }
    );

    // 10. Get Siblings-in-Law (Spouse's Siblings)
    const siblingsInLawResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})-[:MARRIED_TO]->(spouse)<-[:FATHER_OF|MOTHER_OF]-(parent)-[:FATHER_OF|MOTHER_OF]->(siblingInLaw)
      WHERE siblingInLaw <> spouse
      RETURN DISTINCT siblingInLaw
      `,
      { userId }
    );

    // 11. Get Children-in-Law (Spouses of Children)
    const childrenInLawResult = await session.run(
      `
      MATCH (currentUser:Person {id: $userId})-[:FATHER_OF|MOTHER_OF]->(child)-[:MARRIED_TO]->(childInLaw)
      RETURN DISTINCT childInLaw
      `,
      { userId }
    );

    return {
      currentUser: currentUserResult.records[0], // Return the full record with father, mother, spouse
      ancestors: ancestorsResult.records,
      ancestorSiblings: ancestorSiblingsResult.records,
      descendants: descendantsResult.records,
      cousinDescendants: cousinDescendantsResult.records,
      spouse: spouseResult.records,
      siblings: siblingsResult.records,
      auntsUncles: auntsUnclesResult.records,
      cousins: cousinsResult.records,
      niecesNephews: niecesNephewsResult.records,
      inLaws: inLawsResult.records,
      siblingsInLaw: siblingsInLawResult.records,
      childrenInLaw: childrenInLawResult.records,
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