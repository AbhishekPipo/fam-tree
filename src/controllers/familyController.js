const { User, DirectRelationship, IndirectRelationship, RelationshipType, sequelize } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Get complete family tree for the logged-in user
const getFamilyTree = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get current user details
  const currentUser = await User.findByPk(userId, {
    include: [
      { model: User, as: 'father', attributes: ['id', 'firstName', 'lastName', 'gender'] },
      { model: User, as: 'mother', attributes: ['id', 'firstName', 'lastName', 'gender'] }
    ]
  });

  // Get direct relationships (spouses/partners)
  const directRelationships = await DirectRelationship.findAll({
    where: { userId },
    include: [{
      model: User,
      as: 'relatedUser',
      attributes: { exclude: ['password'] }
    }]
  });

  // Helper function to get direct relationships for any user
  const getDirectRelationshipsForUser = async (targetUserId) => {
    return await DirectRelationship.findAll({
      where: { userId: targetUserId },
      include: [{
        model: User,
        as: 'relatedUser',
        attributes: ['id', 'firstName', 'lastName', 'gender', 'email']
      }]
    });
  };

  // Get indirect relationships (all other family members)
  const indirectRelationships = await IndirectRelationship.findAll({
    where: { userId },
    include: [{
      model: User,
      as: 'relatedUser',
      attributes: { exclude: ['password'] },
      include: [
        { model: User, as: 'father', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'mother', attributes: ['id', 'firstName', 'lastName'] }
      ]
    }]
  });

  // Categorize relationships
  const ancestors = [];
  const descendants = [];
  const adjacent = [];

  // Process direct relationships
  directRelationships.forEach(relationship => {
    adjacent.push({
      user: relationship.relatedUser,
      relationship: relationship.relationshipType,
      level: 0
    });
  });

  // Process indirect relationships
  indirectRelationships.forEach(relationship => {
    const relationshipData = {
      user: relationship.relatedUser,
      relationship: relationship.relationshipType,
      level: relationship.relationshipLevel
    };

    // Add parent connection info for grandchildren and beyond
    if (relationship.relationshipLevel <= -2) {
      const parentInfo = getParentConnectionInfo(relationship.relatedUser, currentUser.id);
      if (parentInfo) {
        relationshipData.parentInfo = parentInfo;
      }
    }

    if (relationship.relationshipLevel > 0) {
      ancestors.push(relationshipData);
    } else if (relationship.relationshipLevel < 0) {
      descendants.push(relationshipData);
    } else {
      // Level 0 relationships like siblings
      adjacent.push(relationshipData);
    }
  });

  // Sort relationships
  ancestors.sort((a, b) => b.level - a.level); // Descending order (closest first)
  descendants.sort((a, b) => a.level - b.level); // Ascending order (closest first)

  // Add direct relationship information for ancestors
  for (let ancestor of ancestors) {
    const directRels = await getDirectRelationshipsForUser(ancestor.user.id);
    if (directRels.length > 0) {
      ancestor.directRelationships = directRels.map(rel => ({
        partner: {
          id: rel.relatedUser.id,
          firstName: rel.relatedUser.firstName,
          lastName: rel.relatedUser.lastName,
          gender: rel.relatedUser.gender
        },
        relationshipType: rel.relationshipType
      }));
    }
  }

  // Calculate total family members
  const totalMembers = 1 + ancestors.length + descendants.length + adjacent.length;

  res.json({
    success: true,
    data: {
      currentUser,
      ancestors,
      descendants,
      adjacent,
      totalMembers
    }
  });
});

// Helper function to get parent connection info
const getParentConnectionInfo = (user, currentUserId) => {
  // For grandchildren and beyond, show their direct parent
  if (user.fatherId || user.motherId) {
    const directParentId = user.fatherId || user.motherId;
    
    // Find the relationship between current user and the direct parent
    return {
      directParent: {
        id: directParentId,
        name: user.father ? user.father.getFullName() : user.mother?.getFullName() || 'Unknown',
        relationship: user.fatherId ? 'son/daughter' : 'son/daughter'
      }
    };
  }
  return null;
};

// Add a new family member
const addFamilyMember = catchAsync(async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    dateOfBirth,
    gender,
    location,
    relationshipType,
    hasMedication,
    medicationName,
    medicationFrequency,
    medicationTime
  } = req.body;

  const currentUserId = req.user.id;

  // Start transaction
  const transaction = await sequelize.transaction();

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Determine parent relationships based on relationship type
    let fatherId = null;
    let motherId = null;
    let newUserLevel = 0;
    let currentUserType = '';
    let newUserType = relationshipType;

    // Get relationship type details from database
    const relationshipTypeDetails = await RelationshipType.findOne({
      where: {
        name: relationshipType,
        isActive: true
      }
    });

    if (!relationshipTypeDetails) {
      throw new AppError('Invalid relationship type', 400, 'INVALID_RELATIONSHIP');
    }

    // Determine relationship levels and parent connections
    newUserLevel = relationshipTypeDetails.level;
    
    // Calculate reciprocal relationship type
    const reciprocalLevel = -newUserLevel;
    currentUserType = await RelationshipType.getRelationshipName(reciprocalLevel, req.user.gender);

    // Handle parent connections based on relationship type
    if (relationshipType === 'father') {
      fatherId = null; // Father's parents would need to be set separately
    } else if (relationshipType === 'mother') {
      motherId = null; // Mother's parents would need to be set separately
    } else if (['son', 'daughter', 'adopted-son', 'adopted-daughter', 'stepson', 'stepdaughter'].includes(relationshipType)) {
      // Children get current user as parent
      if (req.user.gender === 'male') {
        fatherId = currentUserId;
      } else {
        motherId = currentUserId;
      }
    } else if (['brother', 'sister', 'half-brother', 'half-sister', 'stepbrother', 'stepsister'].includes(relationshipType)) {
      // Siblings share the same parents (for full siblings)
      if (['brother', 'sister'].includes(relationshipType)) {
        fatherId = req.user.fatherId;
        motherId = req.user.motherId;
      }
      // Half-siblings and step-siblings would need special handling
    } else if (['husband', 'wife', 'partner'].includes(relationshipType)) {
      // These are direct relationships, not indirect
      newUserLevel = null;
    }
    // Extended relationships like uncle, aunt, cousin, etc. don't set direct parent connections

    // Create the new user
    const newUser = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      password: 'TempPassword123!', // Temporary password - user should change on first login
      dateOfBirth,
      gender,
      location,
      hasMedication: hasMedication || false,
      medicationName,
      medicationFrequency,
      medicationTime,
      fatherId,
      motherId
    }, { transaction });

    // Create relationships
    if (['husband', 'wife', 'partner'].includes(relationshipType)) {
      // Create direct relationship
      const oppositeType = relationshipType === 'husband' ? 'wife' : 
                          relationshipType === 'wife' ? 'husband' : 'partner';
      
      await DirectRelationship.createBidirectional(
        currentUserId, 
        newUser.id, 
        oppositeType, 
        relationshipType, 
        transaction
      );
    } else {
      // Create indirect relationship
      const currentUserLevel = -newUserLevel; // Opposite level for current user
      
      await IndirectRelationship.createBidirectional(
        currentUserId,
        newUser.id,
        currentUserLevel,
        currentUserType,
        newUserLevel,
        newUserType,
        transaction
      );
    }

    // Update existing family relationships if needed
    await updateFamilyRelationships(newUser.id, relationshipType, currentUserId, transaction);

    await transaction.commit();

    // Fetch the created user with relationships
    const createdUser = await User.findByPk(newUser.id, {
      include: [
        { model: User, as: 'father', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'mother', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Family member added successfully',
      data: {
        user: createdUser
      }
    });

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// Update family relationships when a new member is added
const updateFamilyRelationships = async (newUserId, relationshipType, currentUserId, transaction) => {
  // This function handles creating relationships between the new user and existing family members
  // For example, when adding a child, they should also have relationships with grandparents, siblings, etc.

  const currentUser = await User.findByPk(currentUserId, { transaction });

  // Get all existing family members of the current user
  const existingRelationships = await IndirectRelationship.findAll({
    where: { userId: currentUserId },
    transaction
  });

  for (const relationship of existingRelationships) {
    let newRelationshipLevel = 0;
    let newRelationshipType = '';
    let existingUserNewLevel = 0;
    let existingUserNewType = '';

    const existingUser = await User.findByPk(relationship.relatedUserId, { transaction });

    // Calculate new relationships based on the relationship type being added
    const newUserRelLevel = relationshipTypeDetails.level;
    
    if (['son', 'daughter', 'adopted-son', 'adopted-daughter', 'stepson', 'stepdaughter'].includes(relationshipType)) {
      // New user is a child of current user
      if (relationship.relationshipLevel === 1) {
        // Existing user is parent of current user -> grandparent of new user
        newRelationshipLevel = 2;
        newRelationshipType = await RelationshipType.getRelationshipName(2, existingUser.gender);
        existingUserNewLevel = -2;
        existingUserNewType = await RelationshipType.getRelationshipName(-2, gender);
      } else if (relationship.relationshipLevel === 0) {
        // Existing user is sibling of current user -> uncle/aunt of new user
        newRelationshipLevel = 1;
        newRelationshipType = existingUser.gender === 'male' ? 'uncle' : 'aunt';
        existingUserNewLevel = -1;
        existingUserNewType = gender === 'male' ? 'nephew' : 'niece';
      } else if (relationship.relationshipLevel === 2) {
        // Existing user is grandparent of current user -> great-grandparent of new user
        newRelationshipLevel = 3;
        newRelationshipType = await RelationshipType.getRelationshipName(3, existingUser.gender);
        existingUserNewLevel = -3;
        existingUserNewType = await RelationshipType.getRelationshipName(-3, gender);
      }
    } else if (['father', 'mother', 'adoptive-father', 'adoptive-mother', 'stepfather', 'stepmother'].includes(relationshipType)) {
      // New user is a parent of current user
      if (relationship.relationshipLevel === -1) {
        // Existing user is child of current user -> grandchild of new user
        newRelationshipLevel = -2;
        newRelationshipType = await RelationshipType.getRelationshipName(-2, existingUser.gender);
        existingUserNewLevel = 2;
        existingUserNewType = await RelationshipType.getRelationshipName(2, gender);
      } else if (relationship.relationshipLevel === -2) {
        // Existing user is grandchild of current user -> great-grandchild of new user
        newRelationshipLevel = -3;
        newRelationshipType = await RelationshipType.getRelationshipName(-3, existingUser.gender);
        existingUserNewLevel = 3;
        existingUserNewType = await RelationshipType.getRelationshipName(3, gender);
      }
    } else if (['brother', 'sister', 'half-brother', 'half-sister', 'stepbrother', 'stepsister'].includes(relationshipType)) {
      // New user is sibling of current user
      if (relationship.relationshipLevel === 1) {
        // Existing user is parent of current user -> also parent of new user
        newRelationshipLevel = 1;
        newRelationshipType = await RelationshipType.getRelationshipName(1, existingUser.gender);
        existingUserNewLevel = -1;
        existingUserNewType = await RelationshipType.getRelationshipName(-1, gender);
      } else if (relationship.relationshipLevel === -1) {
        // Existing user is child of current user -> nephew/niece of new user
        newRelationshipLevel = -1;
        newRelationshipType = existingUser.gender === 'male' ? 'nephew' : 'niece';
        existingUserNewLevel = 1;
        existingUserNewType = gender === 'male' ? 'uncle' : 'aunt';
      }
    } else if (['uncle', 'aunt'].includes(relationshipType)) {
      // New user is uncle/aunt of current user
      if (relationship.relationshipLevel === -1) {
        // Existing user is child of current user -> cousin of new user
        newRelationshipLevel = 0;
        newRelationshipType = 'cousin';
        existingUserNewLevel = 0;
        existingUserNewType = 'cousin';
      }
    } else if (['nephew', 'niece'].includes(relationshipType)) {
      // New user is nephew/niece of current user
      if (relationship.relationshipLevel === 0) {
        // Existing user is sibling of current user -> parent of new user
        newRelationshipLevel = 1;
        newRelationshipType = await RelationshipType.getRelationshipName(1, existingUser.gender);
        existingUserNewLevel = -1;
        existingUserNewType = await RelationshipType.getRelationshipName(-1, gender);
      }
    } else if (relationshipType === 'cousin') {
      // New user is cousin of current user
      if (relationship.relationshipLevel === 1) {
        // Existing user is parent of current user -> uncle/aunt of new user
        newRelationshipLevel = 1;
        newRelationshipType = existingUser.gender === 'male' ? 'uncle' : 'aunt';
        existingUserNewLevel = -1;
        existingUserNewType = gender === 'male' ? 'nephew' : 'niece';
      }
    }

    // Create the relationships if they should exist
    if (newRelationshipType && existingUserNewType) {
      await IndirectRelationship.createBidirectional(
        newUserId,
        relationship.relatedUserId,
        newRelationshipLevel,
        newRelationshipType,
        existingUserNewLevel,
        existingUserNewType,
        transaction
      );
    }
  }
};

// Get all family members (simplified list)
const getAllFamilyMembers = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get all related users through both direct and indirect relationships
  const [directRelationships, indirectRelationships] = await Promise.all([
    DirectRelationship.findAll({
      where: { userId },
      include: [{
        model: User,
        as: 'relatedUser',
        attributes: { exclude: ['password'] }
      }]
    }),
    IndirectRelationship.findAll({
      where: { userId },
      include: [{
        model: User,
        as: 'relatedUser',
        attributes: { exclude: ['password'] }
      }]
    })
  ]);

  const familyMembers = [
    ...directRelationships.map(rel => ({
      ...rel.relatedUser.toJSON(),
      relationship: rel.relationshipType,
      level: 0
    })),
    ...indirectRelationships.map(rel => ({
      ...rel.relatedUser.toJSON(),
      relationship: rel.relationshipType,
      level: rel.relationshipLevel
    }))
  ];

  res.json({
    success: true,
    data: {
      currentUser: req.user,
      familyMembers,
      totalMembers: familyMembers.length + 1
    }
  });
});

// Remove family member
const removeFamilyMember = catchAsync(async (req, res) => {
  const { memberId } = req.params;
  const currentUserId = req.user.id;

  const transaction = await sequelize.transaction();

  try {
    // Check if the member exists and is related to current user
    const [directRel, indirectRel] = await Promise.all([
      DirectRelationship.findOne({
        where: { userId: currentUserId, relatedUserId: memberId }
      }),
      IndirectRelationship.findOne({
        where: { userId: currentUserId, relatedUserId: memberId }
      })
    ]);

    if (!directRel && !indirectRel) {
      throw new AppError('Family member not found or not related to you', 404, 'MEMBER_NOT_FOUND');
    }

    // Remove all relationships involving this member
    await Promise.all([
      DirectRelationship.destroy({
        where: {
          [sequelize.Op.or]: [
            { userId: memberId },
            { relatedUserId: memberId }
          ]
        }
      }, { transaction }),
      IndirectRelationship.destroy({
        where: {
          [sequelize.Op.or]: [
            { userId: memberId },
            { relatedUserId: memberId }
          ]
        }
      }, { transaction })
    ]);

    // Delete the user
    await User.destroy({
      where: { id: memberId }
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Family member removed successfully'
    });

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// Get available relationship types for adding family members
const getRelationshipTypes = catchAsync(async (req, res) => {
  const relationshipTypes = await RelationshipType.getAllowedInputTypes();
  
  // Group by category for better organization
  const groupedTypes = {
    direct: relationshipTypes.filter(type => type.category === 'direct'),
    parents: relationshipTypes.filter(type => type.category === 'indirect' && type.level === 1),
    children: relationshipTypes.filter(type => type.category === 'indirect' && type.level === -1),
    siblings: relationshipTypes.filter(type => type.category === 'indirect' && type.level === 0),
    grandparents: relationshipTypes.filter(type => type.category === 'indirect' && type.level === 2),
    grandchildren: relationshipTypes.filter(type => type.category === 'indirect' && type.level === -2),
    extended: relationshipTypes.filter(type => 
      type.category === 'indirect' && 
      ![-2, -1, 0, 1, 2].includes(type.level)
    )
  };

  res.json({
    success: true,
    data: {
      all: relationshipTypes,
      grouped: groupedTypes,
      totalTypes: relationshipTypes.length
    }
  });
});

// Get relationship statistics
const getRelationshipStats = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Get counts by relationship level
  const levelStats = await IndirectRelationship.findAll({
    where: { userId },
    attributes: [
      'relationshipLevel',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['relationshipLevel'],
    order: [['relationshipLevel', 'DESC']]
  });

  // Get counts by relationship type
  const typeStats = await IndirectRelationship.findAll({
    where: { userId },
    attributes: [
      'relationshipType',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['relationshipType'],
    order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
  });

  // Get direct relationship count
  const directCount = await DirectRelationship.count({
    where: { userId }
  });

  // Calculate generation spread
  const levels = levelStats.map(stat => stat.relationshipLevel);
  const maxAncestorLevel = Math.max(...levels.filter(l => l > 0), 0);
  const maxDescendantLevel = Math.abs(Math.min(...levels.filter(l => l < 0), 0));

  res.json({
    success: true,
    data: {
      totalRelationships: levelStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0) + directCount,
      directRelationships: directCount,
      indirectRelationships: levelStats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0),
      generationSpread: {
        ancestorGenerations: maxAncestorLevel,
        descendantGenerations: maxDescendantLevel,
        totalGenerations: maxAncestorLevel + maxDescendantLevel + 1
      },
      levelBreakdown: levelStats.map(stat => ({
        level: stat.relationshipLevel,
        count: parseInt(stat.dataValues.count),
        description: stat.relationshipLevel > 0 ? `${stat.relationshipLevel} generation${stat.relationshipLevel > 1 ? 's' : ''} up` :
                    stat.relationshipLevel < 0 ? `${Math.abs(stat.relationshipLevel)} generation${Math.abs(stat.relationshipLevel) > 1 ? 's' : ''} down` :
                    'Same generation'
      })),
      typeBreakdown: typeStats.map(stat => ({
        type: stat.relationshipType,
        count: parseInt(stat.dataValues.count)
      }))
    }
  });
});

module.exports = {
  getFamilyTree,
  addFamilyMember,
  getAllFamilyMembers,
  removeFamilyMember,
  getRelationshipTypes,
  getRelationshipStats
};
