const familyService = require('../services/familyService');

const formatPerson = (personNode, includeExtendedFields = false) => {
  if (!personNode || !personNode.properties) return null;
  const person = personNode.properties;
  // Neo4j integers can be larger than JS numbers, so they are returned as a special object.
  // We need to convert them to standard numbers for JSON serialization.
  const id = person.id.toNumber ? person.id.toNumber() : person.id;
  
  const basicPerson = {
    id: id,
    firstName: person.firstName,
    middleName: person.middleName || null,
    lastName: person.lastName,
    email: person.email,
    dateOfBirth: person.dateOfBirth,
    gender: person.gender,
    location: person.location,
    profilePicture: person.profilePicture,
  };

  if (includeExtendedFields) {
    return {
      ...basicPerson,
      hasMedication: person.hasMedication || false,
      medicationName: person.medicationName || null,
      medicationFrequency: person.medicationFrequency || null,
      medicationTime: person.medicationTime || null,
      isOnline: person.isOnline || false,
      isDeceased: person.isDeceased || false,
      staysWithUser: person.staysWithUser || false,
      fatherId: person.fatherId ? (person.fatherId.toNumber ? person.fatherId.toNumber() : person.fatherId) : null,
      motherId: person.motherId ? (person.motherId.toNumber ? person.motherId.toNumber() : person.motherId) : null,
      createdAt: person.createdAt || null,
      updatedAt: person.updatedAt || null,
      spouseId: person.spouseId ? (person.spouseId.toNumber ? person.spouseId.toNumber() : person.spouseId) : null,
    };
  }

  return basicPerson;
};

const getRelationshipLabel = (level, gender, direction) => {
  if (direction === 'ancestor') {
    if (level === 1) return gender === 'Male' ? 'father' : 'mother';
    if (level === 2) return gender === 'Male' ? 'grandfather' : 'grandmother';
    if (level === 3) return gender === 'Male' ? 'great-grandfather' : 'great-grandmother';
  } else if (direction === 'descendant') {
    if (level === 1) return gender === 'Male' ? 'son' : 'daughter';
    if (level === 2) return gender === 'Male' ? 'grandson' : 'granddaughter';
    if (level === 3) return gender === 'Male' ? 'great-grandson' : 'great-granddaughter';
  }
  return 'relative';
};

const getExtendedRelationshipLabel = (relationshipType, gender) => {
  switch (relationshipType) {
    case 'sibling':
      return gender === 'Male' ? 'brother' : 'sister';
    case 'auntUncle':
      return gender === 'Male' ? 'uncle' : 'aunt';
    case 'nieceNephew':
      return gender === 'Male' ? 'nephew' : 'niece';
    case 'inLaw':
      return gender === 'Male' ? 'father-in-law' : 'mother-in-law';
    case 'siblingInLaw':
      return gender === 'Male' ? 'brother-in-law' : 'sister-in-law';
    case 'childInLaw':
      return gender === 'Male' ? 'son-in-law' : 'daughter-in-law';
    case 'cousin':
      return 'cousin';
    default:
      return 'relative';
  }
};

const buildAncestorsWithChildren = (treeData) => {
  const ancestors = [];
  
  // Add direct ancestors (parents, grandparents)
  treeData.ancestors.forEach(record => {
    const ancestor = record.get('ancestor');
    const level = record.get('level').toNumber();
    ancestors.push({
      user: formatPerson(ancestor, true),
      relationship: getRelationshipLabel(level, ancestor.properties.gender, 'ancestor'),
      level: level,
      directRelationships: [] // TODO: Add spouse relationships
    });
  });
  
  // Add uncles/aunts with their children nested
  treeData.ancestorSiblings.forEach(record => {
    const ancestorSibling = record.get('ancestorSibling');
    const children = [];
    
    // Find children of this uncle/aunt from cousin descendants
    treeData.cousinDescendants.forEach(cousinRecord => {
      const cousin = cousinRecord.get('cousinDescendant');
      const level = cousinRecord.get('level').toNumber();
      if (level === 1) { // Direct children of uncle/aunt
        children.push({
          user: formatPerson(cousin, true),
          relationship: 'cousin',
          level: 0,
          directRelationships: [] // TODO: Add spouse relationships
        });
      }
    });
    
    ancestors.push({
      user: formatPerson(ancestorSibling, true),
      relationship: getExtendedRelationshipLabel('auntUncle', ancestorSibling.properties.gender),
      level: 1,
      children: children,
      directRelationships: [] // TODO: Add spouse relationships
    });
  });
  
  return ancestors;
};

const buildAdjacentRelationships = (treeData) => {
  const adjacent = [];
  
  // Add spouse
  treeData.spouse.forEach(record => {
    const spouse = record.get('spouse');
    const spouseId = spouse.properties.id.toNumber ? spouse.properties.id.toNumber() : spouse.properties.id;
    
    adjacent.push({
      user: formatPerson(spouse, true),
      relationship: spouse.properties.gender === 'Male' ? 'husband' : 'wife',
      level: 0,
      spouseId: spouseId,
      directRelationships: [] // Simplified for now
    });
  });
  
  // Add cousins (from the separate cousins query, not nested under uncles)
  treeData.cousins.forEach(record => {
    const cousin = record.get('cousin');
    adjacent.push({
      user: formatPerson(cousin, true),
      relationship: 'cousin',
      level: 0,
      directRelationships: [] // TODO: Add spouse relationships
    });
  });
  
  return adjacent;
};

const getFamilyTree = async (req, res) => {
  // Get user ID from JWT token (set by auth middleware)
  const userAuthId = req.user.id;
  const userEmail = req.user.email;
  
  if (!userAuthId) {
    return res.status(400).json({ success: false, error: 'User ID not found in token' });
  }

  try {
    const treeData = await familyService.getFamilyTreeByEmail(userEmail);
    


    // Format current user with extended fields and parent/spouse info
    const currentUserRecord = treeData.currentUser;
    const currentUser = formatPerson(currentUserRecord.get('currentUser'), true);
    const father = currentUserRecord.get('father');
    const mother = currentUserRecord.get('mother');
    
    if (father) {
      currentUser.father = {
        id: father.properties.id.toNumber ? father.properties.id.toNumber() : father.properties.id,
        firstName: father.properties.firstName,
        lastName: father.properties.lastName,
        gender: father.properties.gender
      };
    }
    
    if (mother) {
      currentUser.mother = {
        id: mother.properties.id.toNumber ? mother.properties.id.toNumber() : mother.properties.id,
        firstName: mother.properties.firstName,
        lastName: mother.properties.lastName,
        gender: mother.properties.gender
      };
    }

    const response = {
      success: true,
      data: {
        currentUser: currentUser,
        ancestors: treeData.ancestors.map(record => {
          const ancestor = record.get('ancestor');
          const level = record.get('level').toNumber();
          const ancestorFormatted = {
            user: formatPerson(ancestor, true),
            relationship: getRelationshipLabel(level, ancestor.properties.gender, 'ancestor'),
            level: level,
            directRelationships: []
          };
          
          // Add children for uncles/aunts (level 1 ancestors who are not parents)
          if (level === 1 && (ancestorFormatted.relationship === 'uncle' || ancestorFormatted.relationship === 'aunt')) {
            ancestorFormatted.children = treeData.cousins.map(cousinRecord => {
              const cousin = cousinRecord.get('cousin');
              return {
                user: formatPerson(cousin, true),
                relationship: 'cousin',
                level: 0,
                directRelationships: [] // TODO: Add spouse info
              };
            });
          }
          
          return ancestorFormatted;
        }),
        descendants: treeData.descendants.map(record => {
          const descendant = record.get('descendant');
          const level = record.get('level').toNumber();
          return {
            user: formatPerson(descendant, true),
            relationship: getRelationshipLabel(level, descendant.properties.gender, 'descendant'),
            level: -level,
          };
        }),
        adjacent: [
          ...treeData.spouse.map(record => ({
            user: formatPerson(record.get('spouse'), true),
            relationship: 'spouse',
            level: 0,
          })),
          ...treeData.cousins.map(record => ({
            user: formatPerson(record.get('cousin'), true),
            relationship: 'cousin',
            level: 0,
          })),
        ]
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching family tree:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getFamilyTree };