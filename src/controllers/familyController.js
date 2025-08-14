const familyService = require('../services/familyService');

const formatPerson = (personNode) => {
  if (!personNode || !personNode.properties) return null;
  const person = personNode.properties;
  // Neo4j integers can be larger than JS numbers, so they are returned as a special object.
  // We need to convert them to standard numbers for JSON serialization.
  const id = person.id.toNumber ? person.id.toNumber() : person.id;
  return {
    id: id,
    firstName: person.firstName,
    lastName: person.lastName,
    email: person.email,
    dateOfBirth: person.dateOfBirth,
    gender: person.gender,
    location: person.location,
    profilePicture: person.profilePicture,
  };
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

const getFamilyTree = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, error: 'Invalid user ID' });
  }

  try {
    const treeData = await familyService.getFamilyTree(userId);

    const response = {
      success: true,
      data: {
        currentUser: formatPerson(treeData.currentUser),
        ancestors: treeData.ancestors.map(record => {
          const ancestor = record.get('ancestor');
          const level = record.get('level').toNumber();
          return {
            user: formatPerson(ancestor),
            relationship: getRelationshipLabel(level, ancestor.properties.gender, 'ancestor'),
            level: level,
          };
        }),
        descendants: treeData.descendants.map(record => {
          const descendant = record.get('descendant');
          const level = record.get('level').toNumber();
          return {
            user: formatPerson(descendant),
            relationship: getRelationshipLabel(level, descendant.properties.gender, 'descendant'),
            level: -level,
          };
        }),
        adjacent: [
          ...treeData.spouse.map(record => ({
            user: formatPerson(record.get('spouse')),
            relationship: 'spouse',
            level: 0,
          })),
          ...treeData.cousins.map(record => ({
            user: formatPerson(record.get('cousin')),
            relationship: 'cousin',
            level: 0,
          })),
        ],
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching family tree:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getFamilyTree };