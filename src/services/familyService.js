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
   * Get spouse's family tree (in-laws)
   * @param {number} spouseId - Spouse's user ID
   * @param {number} currentUserId - Current user ID (for context)
   * @returns {Object} - Spouse's family tree with in-law relationships
   */
  async getSpouseFamilyTree(spouseId, currentUserId) {
    // Get spouse's family tree from their perspective
    const spouseFamilyTree = await this.getFamilyTree(spouseId);
    
    // Convert relationships to in-law relationships from current user's perspective
    const inLawTree = await this._convertToInLawRelationships(spouseFamilyTree, currentUserId, spouseId);
    
    return {
      ...inLawTree,
      context: 'in-laws',
      spouseId: spouseId,
      primaryUserId: currentUserId
    };
  }

  /**
   * Get extended family tree including in-laws
   * @param {number} userId - User ID
   * @param {boolean} includeInLaws - Whether to include in-law families
   * @returns {Object} - Extended family tree data
   */
  async getExtendedFamilyTree(userId, includeInLaws = false) {
    // Get primary family tree
    const primaryTree = await this.getFamilyTree(userId);
    
    if (!includeInLaws) {
      return primaryTree;
    }

    // Get spouse's family tree if married
    const spouses = primaryTree.adjacent.filter(adj => 
      ['husband', 'wife', 'partner'].includes(adj.relationship)
    );

    const inLawTrees = [];
    for (const spouse of spouses) {
      const inLawTree = await this.getSpouseFamilyTree(spouse.user.id, userId);
      inLawTrees.push(inLawTree);
    }

    // Also get in-law trees for extended family members who are married
    const extendedInLaws = await this._getExtendedInLaws(primaryTree, userId);

    return {
      ...primaryTree,
      inLaws: inLawTrees,
      extendedInLaws: extendedInLaws,
      context: 'extended'
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

      // Rebuild all family relationships to ensure completeness
      await this._rebuildAllFamilyRelationships(transaction);

      await transaction.commit();

      // Fetch the created user with relationships
      const createdUser = await User.findByPk(newUser.id, {
        include: [
          { model: User, as:'father', attributes: ['id', 'firstName', 'lastName'] },
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
   * Categorize relationships into ancestors, descendants, and adjacent with proper tree structure
   * @private
   * @param {Array} directRelationships - Direct relationships
   * @param {Array} indirectRelationships - Indirect relationships
   * @param {Object} currentUser - Current user object
   * @returns {Object} - Categorized relationships with tree structure
   */
  async _categorizeRelationships(directRelationships, indirectRelationships, currentUser) {
    const ancestors = [];
    const descendants = [];
    const adjacent = [];

    // Process direct relationships (spouses/partners)
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

    // Group indirect relationships by their actual parent connections for proper tree structure
    const relationshipsByParent = new Map();
    const directDescendants = [];
    const directAncestors = [];
    const siblings = [];

    // First pass: categorize relationships and group by parent connections
    indirectRelationships.forEach(relationship => {
      const relationshipData = {
        user: relationship.relatedUser,
        relationship: relationship.relationshipType,
        level: relationship.relationshipLevel
      };

      if (relationship.relationshipLevel > 0) {
        // Ancestors (parents, grandparents, etc.)
        directAncestors.push(relationshipData);
      } else if (relationship.relationshipLevel < 0) {
        // Check if this is a direct descendant or extended family descendant
        const user = relationship.relatedUser;
        const isDirectDescendant = (user.fatherId === currentUser.id || user.motherId === currentUser.id);
        
        if (isDirectDescendant) {
          // Direct children/grandchildren
          directDescendants.push(relationshipData);
        } else {
          // Extended family descendants (like cousin's children) - group by their parent
          const parentId = user.fatherId || user.motherId;
          if (parentId) {
            if (!relationshipsByParent.has(parentId)) {
              relationshipsByParent.set(parentId, []);
            }
            relationshipsByParent.get(parentId).push(relationshipData);
          }
        }
      } else {
        // Level 0 relationships (siblings, cousins)
        if (['brother', 'sister', 'half-brother', 'half-sister'].includes(relationship.relationshipType)) {
          siblings.push(relationshipData);
        } else if (relationship.relationshipType === 'cousin') {
          // Add cousins to adjacent (level 0) relationships for horizontal display
          adjacent.push(relationshipData);
          
          // ALSO group cousins by their parent (uncle/aunt) for nested tree structure
          const user = relationship.relatedUser;
          const parentId = user.fatherId || user.motherId;
          if (parentId) {
            if (!relationshipsByParent.has(parentId)) {
              relationshipsByParent.set(parentId, []);
            }
            relationshipsByParent.get(parentId).push(relationshipData);
          }
        } else {
          adjacent.push(relationshipData);
        }
      }
    });

    // Add direct descendants with parent connection info for grandchildren and beyond
    directDescendants.forEach(relationship => {
      if (relationship.level <= -2) {
        const parentInfo = this._getParentConnectionInfo(relationship.user, currentUser.id);
        if (parentInfo) {
          relationship.parentInfo = parentInfo;
        }
      }
      descendants.push(relationship);
    });

    // Add direct ancestors
    ancestors.push(...directAncestors);

    // Add siblings to adjacent
    adjacent.push(...siblings);

    // Process extended family members and attach them to their parents in the tree
    for (let ancestor of ancestors) {
      const ancestorChildren = relationshipsByParent.get(ancestor.user.id);
      if (ancestorChildren) {
        ancestor.children = ancestorChildren;
      }
    }

    // Process siblings and attach their children
    for (let sibling of siblings) {
      const siblingChildren = relationshipsByParent.get(sibling.user.id);
      if (siblingChildren) {
        sibling.children = siblingChildren;
      }
    }

    // Sort relationships
    ancestors.sort((a, b) => b.level - a.level); // Descending order (closest first)
    descendants.sort((a, b) => a.level - b.level); // Ascending order (closest first)

    // Add direct relationship information (spouses) for all family members
    const allFamilyMembers = [...ancestors, ...adjacent, ...descendants];
    for (let member of allFamilyMembers) {
      const directRels = await this._getDirectRelationshipsForUser(member.user.id);
      if (directRels.length > 0) {
        member.directRelationships = directRels.map(rel => ({
          partner: {
            id: rel.relatedUser.id,
            firstName: rel.relatedUser.firstName,
            lastName: rel.relatedUser.lastName,
            gender: rel.relatedUser.gender
          },
          relationshipType: rel.relationshipType
        }));
      }

      // Also add spouse info to children if they exist
      if (member.children) {
        for (let child of member.children) {
          const childDirectRels = await this._getDirectRelationshipsForUser(child.user.id);
          if (childDirectRels.length > 0) {
            child.directRelationships = childDirectRels.map(rel => ({
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
   * Rebuild all family relationships to ensure completeness
   * This method ensures that all family members have proper relationships with each other
   * @param {Object} transaction - Database transaction
   */
  async _rebuildAllFamilyRelationships(transaction) {
    // Get all users
    const allUsers = await User.findAll({ transaction });
    
    // Clear all indirect relationships to rebuild them
    await IndirectRelationship.destroy({ where: {}, transaction });
    
    // For each user, calculate their relationships with all other users
    for (const user of allUsers) {
      await this._calculateUserRelationships(user.id, allUsers, transaction);
    }
  }

  /**
   * Calculate relationships for a specific user with all other users
   * @param {number} userId - User ID to calculate relationships for
   * @param {Array} allUsers - Array of all users
   * @param {Object} transaction - Database transaction
   */
  async _calculateUserRelationships(userId, allUsers, transaction) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    // Get direct relationships for this user
    const directRelationships = await DirectRelationship.findAll({
      where: { userId },
      transaction
    });

    // Skip if user has direct relationships (spouses) - they're handled separately
    const directRelatedUserIds = directRelationships.map(rel => rel.relatedUserId);

    for (const otherUser of allUsers) {
      if (otherUser.id === userId) continue; // Skip self
      if (directRelatedUserIds.includes(otherUser.id)) continue; // Skip direct relationships

      const relationship = await this._calculateRelationshipBetweenUsers(user, otherUser, allUsers);
      
      if (relationship) {
        // Create the relationship
        await IndirectRelationship.create({
          userId: user.id,
          relatedUserId: otherUser.id,
          relationshipType: relationship.type,
          relationshipLevel: relationship.level
        }, { transaction });
      }
    }
  }

  /**
   * Calculate the relationship between two users
   * @param {Object} user1 - First user
   * @param {Object} user2 - Second user  
   * @param {Array} allUsers - Array of all users for reference
   * @returns {Object|null} - Relationship object or null if no relationship
   */
  async _calculateRelationshipBetweenUsers(user1, user2, allUsers) {
    // Direct parent-child relationships
    if (user1.fatherId === user2.id) {
      return { type: 'father', level: 1 };
    }
    if (user1.motherId === user2.id) {
      return { type: 'mother', level: 1 };
    }
    if (user2.fatherId === user1.id) {
      return { type: user2.gender === 'male' ? 'son' : 'daughter', level: -1 };
    }
    if (user2.motherId === user1.id) {
      return { type: user2.gender === 'male' ? 'son' : 'daughter', level: -1 };
    }

    // Sibling relationships (same parents)
    const sharesFather = user1.fatherId && user2.fatherId && user1.fatherId === user2.fatherId;
    const sharesMother = user1.motherId && user2.motherId && user1.motherId === user2.motherId;
    
    if (sharesFather || sharesMother) {
      if (sharesFather && sharesMother) {
        // Full siblings
        return { type: user2.gender === 'male' ? 'brother' : 'sister', level: 0 };
      } else {
        // Half siblings
        return { type: user2.gender === 'male' ? 'half-brother' : 'half-sister', level: 0 };
      }
    }

    // Grandparent-grandchild relationships
    const user1Parents = allUsers.filter(u => u.id === user1.fatherId || u.id === user1.motherId);
    const user2Parents = allUsers.filter(u => u.id === user2.fatherId || u.id === user2.motherId);

    // Check if user2 is grandparent of user1
    for (const parent of user1Parents) {
      if (parent.fatherId === user2.id) {
        return { type: user2.gender === 'male' ? 'grandfather' : 'grandmother', level: 2 };
      }
      if (parent.motherId === user2.id) {
        return { type: user2.gender === 'male' ? 'grandfather' : 'grandmother', level: 2 };
      }
    }

    // Check if user1 is grandparent of user2
    for (const parent of user2Parents) {
      if (parent.fatherId === user1.id) {
        return { type: user2.gender === 'male' ? 'grandson' : 'granddaughter', level: -2 };
      }
      if (parent.motherId === user1.id) {
        return { type: user2.gender === 'male' ? 'grandson' : 'granddaughter', level: -2 };
      }
    }

    // Uncle/Aunt - Nephew/Niece relationships
    for (const parent of user1Parents) {
      // Check if user2 is sibling of user1's parent (uncle/aunt)
      const parentSharesFatherWithUser2 = parent.fatherId && user2.fatherId && parent.fatherId === user2.fatherId;
      const parentSharesMotherWithUser2 = parent.motherId && user2.motherId && parent.motherId === user2.motherId;
      
      if (parentSharesFatherWithUser2 || parentSharesMotherWithUser2) {
        return { type: user2.gender === 'male' ? 'uncle' : 'aunt', level: 1 };
      }
    }

    // Check if user2 is nephew/niece of user1 (user1 is sibling of user2's parent)
    for (const user2Parent of user2Parents) {
      // Check if user1 is sibling of user2's parent
      const user1SharesFatherWithUser2Parent = user1.fatherId && user2Parent.fatherId && user1.fatherId === user2Parent.fatherId;
      const user1SharesMotherWithUser2Parent = user1.motherId && user2Parent.motherId && user1.motherId === user2Parent.motherId;
      
      if (user1SharesFatherWithUser2Parent || user1SharesMotherWithUser2Parent) {
        return { type: user2.gender === 'male' ? 'nephew' : 'niece', level: -1 };
      }
    }

    // Cousin relationships (children of siblings)
    for (const user1Parent of user1Parents) {
      for (const user2Parent of user2Parents) {
        // Check if parents are siblings
        const parentsShareFather = user1Parent.fatherId && user2Parent.fatherId && user1Parent.fatherId === user2Parent.fatherId;
        const parentsShareMother = user1Parent.motherId && user2Parent.motherId && user1Parent.motherId === user2Parent.motherId;
        
        if (parentsShareFather || parentsShareMother) {
          return { type: 'cousin', level: 0 };
        }
      }
    }

    // In-law relationships through spouses
    // This would require checking direct relationships, but for now we'll handle basic family tree
    
    return null; // No relationship found
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
      
      // Handle children if they exist (for tree structure)
      if (relationship.children) {
        relationshipWithSpouse.children = [];
        for (const child of relationship.children) {
          const childWithSpouse = { ...child };
          
          // Get spouse info for child
          const childDirectRelationships = await this._getDirectRelationshipsForUser(child.user.id);
          const childSpouseRelationship = childDirectRelationships.find(rel => 
            ['husband', 'wife', 'partner'].includes(rel.relationshipType)
          );
          
          childWithSpouse.user = child.user.toJSON ? { ...child.user.toJSON() } : { ...child.user };
          if (childSpouseRelationship) {
            childWithSpouse.user.spouseId = childSpouseRelationship.relatedUserId;
          }
          
          relationshipWithSpouse.children.push(childWithSpouse);
        }
      }
      
      relationshipsWithSpouse.push(relationshipWithSpouse);
    }
    
    return relationshipsWithSpouse;
  }

  /**
   * Manually rebuild all family relationships
   * This can be called to fix any missing relationships in the family tree
   */
  async rebuildFamilyRelationships() {
    const transaction = await sequelize.transaction();
    
    try {
      await this._rebuildAllFamilyRelationships(transaction);
      await transaction.commit();
      
      return { message: 'Family relationships rebuilt successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Convert spouse's family relationships to in-law relationships
   * @private
   * @param {Object} spouseFamilyTree - Spouse's family tree
   * @param {number} currentUserId - Current user ID
   * @param {number} spouseId - Spouse ID
   * @returns {Object} - Converted in-law relationships
   */
  async _convertToInLawRelationships(spouseFamilyTree, currentUserId, spouseId) {
    const inLawRelationshipMap = {
      'father': 'father-in-law',
      'mother': 'mother-in-law',
      'brother': 'brother-in-law',
      'sister': 'sister-in-law',
      'son': 'son-in-law',
      'daughter': 'daughter-in-law',
      'grandfather': 'grandfather-in-law',
      'grandmother': 'grandmother-in-law',
      'uncle': 'uncle-in-law',
      'aunt': 'aunt-in-law',
      'nephew': 'nephew-in-law',
      'niece': 'niece-in-law',
      'cousin': 'cousin-in-law'
    };

    const convertRelationships = (relationships) => {
      return relationships.map(rel => ({
        ...rel,
        relationship: inLawRelationshipMap[rel.relationship] || rel.relationship + '-in-law',
        isInLaw: true,
        throughSpouse: spouseId,
        children: rel.children ? convertRelationships(rel.children) : undefined
      }));
    };

    return {
      currentUser: {
        ...spouseFamilyTree.currentUser,
        relationshipToUser: 'spouse',
        isSpouse: true
      },
      ancestors: convertRelationships(spouseFamilyTree.ancestors),
      descendants: convertRelationships(spouseFamilyTree.descendants),
      adjacent: convertRelationships(spouseFamilyTree.adjacent.filter(adj => 
        !['husband', 'wife', 'partner'].includes(adj.relationship)
      )),
      totalMembers: spouseFamilyTree.totalMembers
    };
  }

  /**
   * Get extended in-laws for family members who are married
   * @private
   * @param {Object} primaryTree - Primary family tree
   * @param {number} userId - Current user ID
   * @returns {Array} - Extended in-law relationships
   */
  async _getExtendedInLaws(primaryTree, userId) {
    const extendedInLaws = [];
    
    // Check ancestors with spouses
    for (const ancestor of primaryTree.ancestors) {
      if (ancestor.children) {
        for (const child of ancestor.children) {
          if (child.directRelationships && child.directRelationships.length > 0) {
            const spouseId = child.directRelationships[0].partner.id;
            const inLawTree = await this.getSpouseFamilyTree(spouseId, userId);
            extendedInLaws.push({
              throughMember: child.user,
              inLawTree: inLawTree,
              relationship: `${child.relationship}'s spouse's family`
            });
          }
        }
      }
    }

    // Check adjacent members with children who have spouses
    for (const adjacent of primaryTree.adjacent) {
      if (adjacent.children) {
        for (const child of adjacent.children) {
          if (child.directRelationships && child.directRelationships.length > 0) {
            const spouseId = child.directRelationships[0].partner.id;
            const inLawTree = await this.getSpouseFamilyTree(spouseId, userId);
            extendedInLaws.push({
              throughMember: child.user,
              inLawTree: inLawTree,
              relationship: `${child.relationship}'s spouse's family`
            });
          }
        }
      }
    }

    return extendedInLaws;
  }

  /**
   * Add spouse and create marriage relationship
   * @param {Object} spouseData - Spouse data
   * @param {number} currentUserId - Current user ID
   * @returns {Object} - Created spouse and relationship
   */
  async addSpouse(spouseData, currentUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get current user to determine relationship type
      const currentUser = await User.findByPk(currentUserId, { transaction });
      
      // Create spouse user
      const spouse = await User.create({
        ...spouseData,
        password: 'TempPassword123!' // Temporary password
      }, { transaction });

      // Determine relationship types
      const currentUserRelType = currentUser.gender === 'male' ? 'husband' : 'wife';
      const spouseRelType = spouse.gender === 'male' ? 'husband' : 'wife';

      // Create bidirectional marriage relationship
      await DirectRelationship.createBidirectional(
        currentUserId,
        spouse.id,
        currentUserRelType,
        spouseRelType,
        transaction
      );

      // Rebuild family relationships to include new spouse
      await this._rebuildAllFamilyRelationships(transaction);
      
      await transaction.commit();
      
      return {
        spouse: spouse,
        relationship: spouseRelType,
        message: 'Spouse added successfully'
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update a user's parent relationships
   * @param {number} userId - User ID to update
   * @param {number|null} fatherId - Father's user ID
   * @param {number|null} motherId - Mother's user ID
   */
  async updateUserParents(userId, fatherId, motherId) {
    const transaction = await sequelize.transaction();
    
    try {
      await User.update(
        { fatherId, motherId },
        { where: { id: userId }, transaction }
      );
      
      // Rebuild relationships after updating parents
      await this._rebuildAllFamilyRelationships(transaction);
      await transaction.commit();
      
      return { message: 'User parent relationships updated successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new FamilyService();