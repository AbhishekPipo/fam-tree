const { User, DirectRelationship, IndirectRelationship, sequelize } = require('../models');
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

    // Determine relationship levels and parent connections
    switch (relationshipType) {
      case 'father':
        newUserLevel = 1;
        currentUserType = req.user.gender === 'male' ? 'son' : 'daughter';
        fatherId = null; // Father's parents would need to be set separately
        break;
      case 'mother':
        newUserLevel = 1;
        currentUserType = req.user.gender === 'male' ? 'son' : 'daughter';
        motherId = null; // Mother's parents would need to be set separately
        break;
      case 'son':
        newUserLevel = -1;
        currentUserType = req.user.gender === 'male' ? 'father' : 'mother';
        if (req.user.gender === 'male') {
          fatherId = currentUserId;
        } else {
          motherId = currentUserId;
        }
        break;
      case 'daughter':
        newUserLevel = -1;
        currentUserType = req.user.gender === 'male' ? 'father' : 'mother';
        if (req.user.gender === 'male') {
          fatherId = currentUserId;
        } else {
          motherId = currentUserId;
        }
        break;
      case 'brother':
      case 'sister':
        newUserLevel = 0;
        currentUserType = req.user.gender === 'male' ? 'brother' : 'sister';
        // Siblings share the same parents
        fatherId = req.user.fatherId;
        motherId = req.user.motherId;
        break;
      case 'husband':
      case 'wife':
      case 'partner':
        // These are direct relationships, not indirect
        newUserLevel = null;
        break;
      default:
        throw new AppError('Invalid relationship type', 400, 'INVALID_RELATIONSHIP');
    }

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
    switch (relationshipType) {
      case 'son':
      case 'daughter':
        // New user is a child of current user
        if (relationship.relationshipLevel === 1) {
          // Existing user is parent of current user -> grandparent of new user
          newRelationshipLevel = 2;
          newRelationshipType = existingUser.gender === 'male' ? 'grandfather' : 'grandmother';
          existingUserNewLevel = -2;
          existingUserNewType = relationshipType === 'son' ? 'grandson' : 'granddaughter';
        } else if (relationship.relationshipLevel === 0) {
          // Existing user is sibling of current user -> uncle/aunt of new user
          newRelationshipLevel = 1;
          newRelationshipType = existingUser.gender === 'male' ? 'uncle' : 'aunt';
          existingUserNewLevel = -1;
          existingUserNewType = relationshipType === 'son' ? 'nephew' : 'niece';
        }
        break;
      
      case 'father':
      case 'mother':
        // New user is a parent of current user
        if (relationship.relationshipLevel === -1) {
          // Existing user is child of current user -> grandchild of new user
          newRelationshipLevel = -2;
          newRelationshipType = existingUser.gender === 'male' ? 'grandson' : 'granddaughter';
          existingUserNewLevel = 2;
          existingUserNewType = relationshipType === 'father' ? 'grandfather' : 'grandmother';
        }
        break;

      case 'brother':
      case 'sister':
        // New user is sibling of current user
        if (relationship.relationshipLevel === 1) {
          // Existing user is parent of current user -> also parent of new user
          newRelationshipLevel = 1;
          newRelationshipType = existingUser.gender === 'male' ? 'father' : 'mother';
          existingUserNewLevel = -1;
          existingUserNewType = relationshipType;
        } else if (relationship.relationshipLevel === -1) {
          // Existing user is child of current user -> nephew/niece of new user
          newRelationshipLevel = -1;
          newRelationshipType = existingUser.gender === 'male' ? 'nephew' : 'niece';
          existingUserNewLevel = 1;
          existingUserNewType = relationshipType === 'brother' ? 'uncle' : 'aunt';
        }
        break;
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

module.exports = {
  getFamilyTree,
  addFamilyMember,
  getAllFamilyMembers,
  removeFamilyMember
};
