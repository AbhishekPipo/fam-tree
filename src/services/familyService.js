const { User, DirectRelationship, IndirectRelationship, RelationshipType, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const validationService = require('./validationService');

class FamilyService {
  /**
   * Get complete family tree for a user
   * @param {number} userId - User ID
   * @returns {Object} - Complete family tree data
   */
  async getFamilyTree(userId) {
    // Get current user details
    const currentUser = await User.findByPk(userId, {
      include: [
        { model: User, as: 'father', attributes: ['id', 'firstName', 'lastName', 'gender'] },
        { model: User, as: 'mother', attributes: ['id', 'firstName', 'lastName', 'gender'] }
      ]
    });

    if (!currentUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Get direct relationships (spouses/partners)
    const directRelationships = await this._getDirectRelationships(userId);

    // Get indirect relationships (all other family members)
    const indirectRelationships = await this._getIndirectRelationships(userId);

    // Add spouse information to current user
    const currentUserWithSpouse = await this._addSpouseInfo(currentUser, directRelationships);

    // Categorize relationships
    const { ancestors, descendants, adjacent } = await this._categorizeRelationships(
      directRelationships, 
      indirectRelationships, 
      currentUser
    );

    // Add spouse information to all family members
    const ancestorsWithSpouse = await this._addSpouseInfoToUsers(ancestors);
    const descendantsWithSpouse = await this._addSpouseInfoToUsers(descendants);
    const adjacentWithSpouse = await this._addSpouseInfoToUsers(adjacent);

    // Calculate total family members
    const totalMembers = 1 + ancestorsWithSpouse.length + descendantsWithSpouse.length + adjacentWithSpouse.length;

    return {
      currentUser: currentUserWithSpouse,
      ancestors: ancestorsWithSpouse,
      descendants: descendantsWithSpouse,
      adjacent: adjacentWithSpouse,
      totalMembers
    };
  }

  /**
   * Add a new family member
   * @param {Object} memberData - New member data
   * @param {number} currentUserId - Current user ID
   * @returns {Object} - Created user
   */
  async addFamilyMember(memberData, currentUserId) {
    // Validate input data
    const validatedData = validationService.validateFamilyMemberData(memberData);
    
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
    } = validatedData;

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
      }

      // Get relationship type details
      const relationshipTypeDetails = await this._getRelationshipTypeDetails(relationshipType);

      // Determine parent relationships and levels
      const { fatherId, motherId, newUserLevel, currentUserType } = await this._determineRelationshipDetails(
        relationshipType,
        relationshipTypeDetails,
        currentUserId,
        gender
      );

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
      await this._createRelationships(
        relationshipType,
        currentUserId,
        newUser.id,
        newUserLevel,
        currentUserType,
        transaction
      );

      // Update existing family relationships
      await this._updateFamilyRelationships(
        newUser.id,
        relationshipType,
        currentUserId,
        gender,
        transaction
      );

      await transaction.commit();

      // Fetch the created user with relationships
      const createdUser = await User.findByPk(newUser.id, {
        include: [
          { model: User, as: 'father', attributes: ['id', 'firstName', 'lastName'] },
          { model: User, as: 'mother', attributes: ['id', 'firstName', 'lastName'] }
        ]
      });

      return createdUser;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get direct relationships for a user
   * @private
   * @param {number} userId - User ID
   * @returns {Array} - Direct relationships
   */
  async _getDirectRelationships(userId) {
    return await DirectRelationship.findAll({
      where: { userId },
      include: [{
        model: User,
        as: 'relatedUser',
        attributes: { exclude: ['password'] }
      }]
    });
  }

  /**
   * Get indirect relationships for a user
   * @private
   * @param {number} userId - User ID
   * @returns {Array} - Indirect relationships
   */
  async _getIndirectRelationships(userId) {
    return await IndirectRelationship.findAll({
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
  }

  /**
   * Get direct relationships for any user
   * @private
   * @param {number} targetUserId - Target user ID
   * @returns {Array} - Direct relationships
   */
  async _getDirectRelationshipsForUser(targetUserId) {
    return await DirectRelationship.findAll({
      where: { userId: targetUserId },
      include: [{
        model: User,
        as: 'relatedUser',
        attributes: ['id', 'firstName', 'lastName', 'gender', 'email']
      }]
    });
  }

  /**
   * Categorize relationships into ancestors, descendants, and adjacent
   * @private
   * @param {Array} directRelationships - Direct relationships
   * @param {Array} indirectRelationships - Indirect relationships
   * @param {Object} currentUser - Current user object
   * @returns {Object} - Categorized relationships
   */
  async _categorizeRelationships(directRelationships, indirectRelationships, currentUser) {
    const ancestors = [];
    const descendants = [];
    const adjacent = [];

    // Process direct relationships
    directRelationships.forEach(relationship => {
      // Get the correct relationship type from the related user's perspective
      let correctRelationshipType = relationship.relationshipType;
      
      // For spouse relationships, show what the related user is to the current user
      if (relationship.relationshipType === 'husband') {
        correctRelationshipType = 'wife';
      } else if (relationship.relationshipType === 'wife') {
        correctRelationshipType = 'husband';
      }
      
      adjacent.push({
        user: relationship.relatedUser,
        relationship: correctRelationshipType,
        level: 0,
        spouseId: relationship.relatedUser.id
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
        const parentInfo = this._getParentConnectionInfo(relationship.relatedUser, currentUser.id);
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
      const directRels = await this._getDirectRelationshipsForUser(ancestor.user.id);
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

    return { ancestors, descendants, adjacent };
  }

  /**
   * Get parent connection info for a user
   * @private
   * @param {Object} user - User object
   * @param {number} currentUserId - Current user ID
   * @returns {Object|null} - Parent connection info
   */
  _getParentConnectionInfo(user, currentUserId) {
    // For grandchildren and beyond, show their direct parent
    if (user.fatherId || user.motherId) {
      const directParentId = user.fatherId || user.motherId;
      
      return {
        directParent: {
          id: directParentId,
          name: user.father ? user.father.getFullName() : user.mother?.getFullName() || 'Unknown',
          relationship: user.fatherId ? 'son/daughter' : 'son/daughter'
        }
      };
    }
    return null;
  }

  /**
   * Get relationship type details from database
   * @private
   * @param {string} relationshipType - Relationship type name
   * @returns {Object} - Relationship type details
   */
  async _getRelationshipTypeDetails(relationshipType) {
    const relationshipTypeDetails = await RelationshipType.findOne({
      where: {
        name: relationshipType,
        isActive: true
      }
    });

    if (!relationshipTypeDetails) {
      throw new AppError('Invalid relationship type', 400, 'INVALID_RELATIONSHIP');
    }

    return relationshipTypeDetails;
  }

  /**
   * Determine relationship details for new family member
   * @private
   * @param {string} relationshipType - Relationship type
   * @param {Object} relationshipTypeDetails - Relationship type details
   * @param {number} currentUserId - Current user ID
   * @param {string} gender - New user gender
   * @returns {Object} - Relationship details
   */
  async _determineRelationshipDetails(relationshipType, relationshipTypeDetails, currentUserId, gender) {
    let fatherId = null;
    let motherId = null;
    const newUserLevel = relationshipTypeDetails.level;
    
    // Get current user
    const currentUser = await User.findByPk(currentUserId);
    
    // Calculate reciprocal relationship type
    const reciprocalLevel = -newUserLevel;
    const currentUserType = await RelationshipType.getRelationshipName(reciprocalLevel, currentUser.gender);

    // Handle parent connections based on relationship type
    if (relationshipType === 'father') {
      fatherId = null; // Father's parents would need to be set separately
    } else if (relationshipType === 'mother') {
      motherId = null; // Mother's parents would need to be set separately
    } else if (['son', 'daughter', 'adopted-son', 'adopted-daughter', 'stepson', 'stepdaughter'].includes(relationshipType)) {
      // Children get current user as parent
      if (currentUser.gender === 'male') {
        fatherId = currentUserId;
      } else {
        motherId = currentUserId;
      }
    } else if (['brother', 'sister', 'half-brother', 'half-sister', 'stepbrother', 'stepsister'].includes(relationshipType)) {
      // Siblings share the same parents (for full siblings)
      if (['brother', 'sister'].includes(relationshipType)) {
        fatherId = currentUser.fatherId;
        motherId = currentUser.motherId;
      }
      // Half-siblings and step-siblings would need special handling
    }
    // Extended relationships like uncle, aunt, cousin, etc. don't set direct parent connections

    return { fatherId, motherId, newUserLevel, currentUserType };
  }

  /**
   * Create relationships between users
   * @private
   * @param {string} relationshipType - Relationship type
   * @param {number} currentUserId - Current user ID
   * @param {number} newUserId - New user ID
   * @param {number} newUserLevel - New user level
   * @param {string} currentUserType - Current user type
   * @param {Object} transaction - Database transaction
   */
  async _createRelationships(relationshipType, currentUserId, newUserId, newUserLevel, currentUserType, transaction) {
    if (['husband', 'wife', 'partner'].includes(relationshipType)) {
      // Create direct relationship
      const oppositeType = relationshipType === 'husband' ? 'wife' : 
                          relationshipType === 'wife' ? 'husband' : 'partner';
      
      await DirectRelationship.createBidirectional(
        currentUserId, 
        newUserId, 
        oppositeType, 
        relationshipType, 
        transaction
      );
    } else {
      // Create indirect relationship
      const currentUserLevel = -newUserLevel; // Opposite level for current user
      
      await IndirectRelationship.createBidirectional(
        currentUserId,
        newUserId,
        currentUserLevel,
        currentUserType,
        newUserLevel,
        relationshipType,
        transaction
      );
    }
  }

  /**
   * Get all family members (simplified list)
   * @param {number} userId - User ID
   * @returns {Array} - Array of family members
   */
  async getAllFamilyMembers(userId) {
    // Get all related users through both direct and indirect relationships
    const [directRelationships, indirectRelationships] = await Promise.all([
      this._getDirectRelationships(userId),
      this._getIndirectRelationships(userId)
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

    return familyMembers;
  }

  /**
   * Remove a family member
   * @param {number} memberId - Member ID to remove
   * @param {number} currentUserId - Current user ID
   */
  async removeFamilyMember(memberId, currentUserId) {
    const { sequelize } = require('../models');
    const { AppError } = require('../middleware/errorHandler');

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

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get relationship statistics
   * @param {number} userId - User ID
   * @returns {Object} - Relationship statistics
   */
  async getRelationshipStats(userId) {
    const { sequelize } = require('../models');

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

    return {
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
    };
  }

  /**
   * Update existing family relationships when a new member is added
   * @private
   * @param {number} newUserId - New user ID
   * @param {string} relationshipType - Relationship type
   * @param {number} currentUserId - Current user ID
   * @param {string} gender - New user gender
   * @param {Object} transaction - Database transaction
   */
  async _updateFamilyRelationships(newUserId, relationshipType, currentUserId, gender, transaction) {
    // This function handles creating relationships between the new user and existing family members
    // For example, when adding a child, they should also have relationships with grandparents, siblings, etc.

    const currentUser = await User.findByPk(currentUserId, { transaction });

    // Get all existing family members of the current user
    const existingRelationships = await IndirectRelationship.findAll({
      where: { userId: currentUserId },
      transaction
    });

    // Get relationship type details
    const relationshipTypeDetails = await this._getRelationshipTypeDetails(relationshipType);

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
      }

      // Create the bidirectional relationship if we determined valid relationship types
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
  }

  /**
   * Add spouse information to a single user
   * @private
   * @param {Object} user - User object
   * @param {Array} directRelationships - Direct relationships array
   * @returns {Object} - User object with spouse information
   */
  async _addSpouseInfo(user, directRelationships) {
    const userWithSpouse = { ...user.toJSON() };
    
    // Find spouse relationship for this user
    const spouseRelationship = directRelationships.find(rel => 
      ['husband', 'wife', 'partner'].includes(rel.relationshipType)
    );
    
    if (spouseRelationship) {
      userWithSpouse.spouseId = spouseRelationship.relatedUserId;
    }
    
    return userWithSpouse;
  }

  /**
   * Add spouse information to an array of relationship objects
   * @private
   * @param {Array} relationships - Array of relationship objects
   * @returns {Array} - Array of relationship objects with spouse information added to users
   */
  async _addSpouseInfoToUsers(relationships) {
    const relationshipsWithSpouse = [];
    
    for (const relationship of relationships) {
      const relationshipWithSpouse = { ...relationship };
      
      // Get direct relationships for this user to find their spouse
      const userDirectRelationships = await this._getDirectRelationshipsForUser(relationship.user.id);
      
      // Find spouse relationship
      const spouseRelationship = userDirectRelationships.find(rel => 
        ['husband', 'wife', 'partner'].includes(rel.relationshipType)
      );
      
      // Add spouse information to the user object
      relationshipWithSpouse.user = relationship.user.toJSON ? { ...relationship.user.toJSON() } : { ...relationship.user };
      if (spouseRelationship) {
        relationshipWithSpouse.user.spouseId = spouseRelationship.relatedUserId;
      }
      
      relationshipsWithSpouse.push(relationshipWithSpouse);
    }
    
    return relationshipsWithSpouse;
  }
}

module.exports = new FamilyService();