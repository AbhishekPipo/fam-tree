const database = require('../config/database');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

class FamilyService {
  // Relationship type definitions with levels
  static RELATIONSHIP_TYPES = {
    // Direct relationships (Level 0)
    'husband': { level: 0, category: 'direct', subcategory: 'marriage', reciprocal: 'wife' },
    'wife': { level: 0, category: 'direct', subcategory: 'marriage', reciprocal: 'husband' },
    'partner': { level: 0, category: 'direct', subcategory: 'marriage', reciprocal: 'partner' },
    
    // Parents (Level +1)
    'father': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'child' },
    'mother': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'child' },
    'stepfather': { level: 1, category: 'indirect', subcategory: 'step', reciprocal: 'stepchild' },
    'stepmother': { level: 1, category: 'indirect', subcategory: 'step', reciprocal: 'stepchild' },
    
    // Children (Level -1)
    'son': { level: -1, category: 'indirect', subcategory: 'blood', reciprocal: 'parent' },
    'daughter': { level: -1, category: 'indirect', subcategory: 'blood', reciprocal: 'parent' },
    'stepson': { level: -1, category: 'indirect', subcategory: 'step', reciprocal: 'stepparent' },
    'stepdaughter': { level: -1, category: 'indirect', subcategory: 'step', reciprocal: 'stepparent' },
    
    // Siblings (Level 0)
    'brother': { level: 0, category: 'indirect', subcategory: 'blood', reciprocal: 'sibling' },
    'sister': { level: 0, category: 'indirect', subcategory: 'blood', reciprocal: 'sibling' },
    'half-brother': { level: 0, category: 'indirect', subcategory: 'half', reciprocal: 'half-sibling' },
    'half-sister': { level: 0, category: 'indirect', subcategory: 'half', reciprocal: 'half-sibling' },
    
    // Grandparents (Level +2)
    'grandfather': { level: 2, category: 'indirect', subcategory: 'blood', reciprocal: 'grandchild' },
    'grandmother': { level: 2, category: 'indirect', subcategory: 'blood', reciprocal: 'grandchild' },
    
    // Grandchildren (Level -2)
    'grandson': { level: -2, category: 'indirect', subcategory: 'blood', reciprocal: 'grandparent' },
    'granddaughter': { level: -2, category: 'indirect', subcategory: 'blood', reciprocal: 'grandparent' },
    
    // Extended family
    'uncle': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'nephew/niece' },
    'aunt': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'nephew/niece' },
    'nephew': { level: -1, category: 'indirect', subcategory: 'blood', reciprocal: 'uncle/aunt' },
    'niece': { level: -1, category: 'indirect', subcategory: 'blood', reciprocal: 'uncle/aunt' },
    'cousin': { level: 0, category: 'indirect', subcategory: 'blood', reciprocal: 'cousin' },
    
    // In-laws
    'father-in-law': { level: 1, category: 'indirect', subcategory: 'marriage', reciprocal: 'son/daughter-in-law' },
    'mother-in-law': { level: 1, category: 'indirect', subcategory: 'marriage', reciprocal: 'son/daughter-in-law' },
    'son-in-law': { level: -1, category: 'indirect', subcategory: 'marriage', reciprocal: 'father/mother-in-law' },
    'daughter-in-law': { level: -1, category: 'indirect', subcategory: 'marriage', reciprocal: 'father/mother-in-law' },
    'brother-in-law': { level: 0, category: 'indirect', subcategory: 'marriage', reciprocal: 'brother/sister-in-law' },
    'sister-in-law': { level: 0, category: 'indirect', subcategory: 'marriage', reciprocal: 'brother/sister-in-law' }
  };

  /**
   * Get complete family tree for a user
   */
  async getFamilyTree(userId) {
    const cypher = `
      MATCH (currentUser:User {id: $userId})
      
      // Get current user with father and mother info
      OPTIONAL MATCH (currentUser)-[:CHILD_OF]->(father:User {gender: 'male'})
      OPTIONAL MATCH (currentUser)-[:CHILD_OF]->(mother:User {gender: 'female'})
      OPTIONAL MATCH (currentUser)-[:MARRIED_TO]-(spouse:User)
      
      RETURN currentUser, father, mother, spouse
    `;

    const result = await database.runQuery(cypher, { userId });
    
    if (result.records.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const record = result.records[0];
    let currentUser = database.constructor.extractNodeProperties(record, 'currentUser');
    const father = record.get('father') ? database.constructor.extractNodeProperties(record, 'father') : null;
    const mother = record.get('mother') ? database.constructor.extractNodeProperties(record, 'mother') : null;
    const spouse = record.get('spouse') ? database.constructor.extractNodeProperties(record, 'spouse') : null;

    // Add father and mother info to current user
    if (father) {
      currentUser.father = {
        id: father.id,
        firstName: father.firstName,
        lastName: father.lastName,
        gender: father.gender
      };
      currentUser.fatherId = father.id;
    }
    
    if (mother) {
      currentUser.mother = {
        id: mother.id,
        firstName: mother.firstName,
        lastName: mother.lastName,
        gender: mother.gender
      };
      currentUser.motherId = mother.id;
    }

    if (spouse) {
      currentUser.spouseId = spouse.id;
    }

    // Clean current user data
    currentUser = this._cleanUserData(currentUser);

    // Get ancestors
    const ancestors = await this._getAncestors(userId);
    
    // Get descendants
    const descendants = await this._getDescendants(userId);
    
    // Get adjacent (spouse and siblings)
    const adjacent = await this._getAdjacent(userId);

    return {
      currentUser,
      ancestors,
      descendants,
      adjacent,
      totalMembers: 1 + ancestors.length + descendants.length + adjacent.length
    };
  }

  async _getAncestors(userId) {
    // Get grandparents
    const grandparentsQuery = `
      MATCH (user:User {id: $userId})-[:CHILD_OF*2]->(grandparent:User)
      OPTIONAL MATCH (grandparent)-[:MARRIED_TO]-(spouse:User)
      RETURN grandparent, spouse, 
             CASE WHEN grandparent.gender = 'male' THEN 'grandfather' ELSE 'grandmother' END as relationship,
             2 as level
    `;
    
    // Get parents
    const parentsQuery = `
      MATCH (user:User {id: $userId})-[:CHILD_OF]->(parent:User)
      OPTIONAL MATCH (parent)-[:MARRIED_TO]-(spouse:User)
      RETURN parent as grandparent, spouse,
             CASE WHEN parent.gender = 'male' THEN 'father' ELSE 'mother' END as relationship,
             1 as level
    `;
    
    // Get uncles/aunts
    const unclesQuery = `
      MATCH (user:User {id: $userId})-[:CHILD_OF]->(parent:User)-[:SIBLING_OF]-(uncle:User)
      WHERE uncle.id <> parent.id
      OPTIONAL MATCH (uncle)-[:MARRIED_TO]-(spouse:User)
      OPTIONAL MATCH (uncle)-[:PARENT_OF]->(child:User)
      WHERE child.id <> $userId
      OPTIONAL MATCH (child)-[:MARRIED_TO]-(childSpouse:User)
      RETURN uncle as grandparent, spouse,
             CASE WHEN uncle.gender = 'male' THEN 'uncle' ELSE 'aunt' END as relationship,
             1 as level,
             collect(DISTINCT {child: child, spouse: childSpouse}) as children
    `;

    const ancestors = [];
    
    // Execute all queries
    const queries = [grandparentsQuery, parentsQuery, unclesQuery];
    
    for (const query of queries) {
      const result = await database.runQuery(query, { userId });
      
      result.records.forEach(record => {
        const ancestorUser = record.get('grandparent');
        const spouse = record.get('spouse');
        const relationship = record.get('relationship');
        const level = record.get('level');
        const children = record.has('children') ? record.get('children') : [];

        if (!ancestorUser) return;

        const user = this._cleanUserData(database.constructor.extractNodeProperties({ get: () => ancestorUser }, ''));

        const ancestorData = {
          user,
          relationship,
          level,
          directRelationships: []
        };

        // Add spouse relationship
        if (spouse) {
          const spouseUser = database.constructor.extractNodeProperties({ get: () => spouse }, '');
          ancestorData.directRelationships.push({
            partner: {
              id: spouseUser.id,
              firstName: spouseUser.firstName,
              lastName: spouseUser.lastName,
              gender: spouseUser.gender
            },
            relationshipType: user.gender === 'male' ? 'husband' : 'wife'
          });
        }

        // Add children for uncles/aunts
        if (relationship === 'uncle' || relationship === 'aunt') {
          ancestorData.children = children.filter(c => c && c.child).map(childData => {
            const childUser = this._cleanUserData(database.constructor.extractNodeProperties({ get: () => childData.child }, ''));
            
            // Get spouse info for cousin
            const directRelationships = [];
            if (childData.spouse) {
              const spouseUser = database.constructor.extractNodeProperties({ get: () => childData.spouse }, '');
              directRelationships.push({
                partner: {
                  id: spouseUser.id,
                  firstName: spouseUser.firstName,
                  lastName: spouseUser.lastName,
                  gender: spouseUser.gender
                },
                relationshipType: childUser.gender === 'male' ? 'husband' : 'wife'
              });
            }
            
            return {
              user: childUser,
              relationship: 'cousin',
              level: 0,
              directRelationships
            };
          });
        }

        ancestors.push(ancestorData);
      });
    }

    return ancestors;
  }

  async _getDescendants(userId) {
    const cypher = `
      MATCH (user:User {id: $userId})-[:PARENT_OF]->(child:User)
      
      OPTIONAL MATCH (child)-[:CHILD_OF]->(father:User {gender: 'male'})
      OPTIONAL MATCH (child)-[:CHILD_OF]->(mother:User {gender: 'female'})
      OPTIONAL MATCH (child)-[:MARRIED_TO]-(spouse:User)
      
      RETURN child, father, mother, spouse
    `;

    const result = await database.runQuery(cypher, { userId });
    const descendants = [];

    result.records.forEach(record => {
      const child = record.get('child');
      const father = record.get('father');
      const mother = record.get('mother');
      const spouse = record.get('spouse');

      if (!child) return;

      let childUser = database.constructor.extractNodeProperties({ get: () => child }, '');
      
      // Add father and mother info
      if (father) {
        childUser.father = {
          id: father.id,
          firstName: father.firstName,
          lastName: father.lastName
        };
        childUser.fatherId = father.id;
      }
      
      if (mother) {
        childUser.mother = {
          id: mother.id,
          firstName: mother.firstName,
          lastName: mother.lastName
        };
        childUser.motherId = mother.id;
      }

      childUser = this._cleanUserData(childUser);
      
      const descendant = {
        user: childUser,
        relationship: childUser.gender === 'male' ? 'son' : 'daughter',
        level: -1
      };

      descendants.push(descendant);
    });

    return descendants;
  }

  async _getAdjacent(userId) {
    const cypher = `
      MATCH (user:User {id: $userId})
      
      // Get spouse
      OPTIONAL MATCH (user)-[:MARRIED_TO]-(spouse:User)
      
      RETURN spouse
    `;

    const result = await database.runQuery(cypher, { userId });
    const adjacent = [];

    result.records.forEach(record => {
      const spouse = record.get('spouse');

      if (spouse) {
        const spouseUser = this._cleanUserData(database.constructor.extractNodeProperties({ get: () => spouse }, ''));
        
        adjacent.push({
          user: spouseUser,
          relationship: spouseUser.gender === 'male' ? 'husband' : 'wife',
          level: 0,
          directRelationships: [{
            partner: {
              id: userId,
              firstName: 'Current',
              lastName: 'User',
              gender: 'unknown'
            },
            relationshipType: spouseUser.gender === 'male' ? 'wife' : 'husband'
          }]
        });
      }
    });

    return adjacent;
  }

  async _isDirectParent(parentId, childId) {
    const cypher = `
      MATCH (parent:User {id: $parentId})-[:PARENT_OF]->(child:User {id: $childId})
      RETURN count(*) > 0 as isParent
    `;

    const result = await database.runQuery(cypher, { parentId, childId });
    return result.records[0].get('isParent');
  }

  _cleanUserData(user) {
    // Keep all fields including labels, but add missing ones
    const cleanUser = {
      id: user.id,
      firstName: user.firstName,
      middleName: user.middleName || null,
      lastName: user.lastName,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      location: user.location,
      profilePicture: user.profilePicture || null,
      hasMedication: user.hasMedication,
      medicationName: user.medicationName || null,
      medicationFrequency: user.medicationFrequency || null,
      medicationTime: user.medicationTime || null,
      isOnline: user.isOnline,
      isDeceased: user.isDeceased,
      staysWithUser: user.staysWithUser,
      fatherId: user.fatherId || null,
      motherId: user.motherId || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Keep labels if they exist
    if (user.labels) {
      cleanUser.labels = user.labels;
    }

    // Keep other internal fields that might be needed
    if (user.password) {
      cleanUser.password = user.password;
    }

    if (user.spouseId) {
      cleanUser.spouseId = user.spouseId;
    }

    // Add father/mother info if available
    if (user.father) {
      cleanUser.father = {
        id: user.father.id,
        firstName: user.father.firstName,
        lastName: user.father.lastName
      };
    } else {
      cleanUser.father = null;
    }

    if (user.mother) {
      cleanUser.mother = {
        id: user.mother.id,
        firstName: user.mother.firstName,
        lastName: user.mother.lastName
      };
    } else {
      cleanUser.mother = null;
    }

    return cleanUser;
  }

  /**
   * Get extended family tree including in-laws
   */
  async getExtendedFamilyTree(userId, includeInLaws = false) {
    const primaryTree = await this.getFamilyTree(userId);
    
    if (!includeInLaws) {
      return primaryTree;
    }

    // Get spouse's family trees
    const spouses = primaryTree.adjacent.filter(adj => 
      ['husband', 'wife', 'partner'].includes(adj.relationship)
    );

    const inLawTrees = [];
    for (const spouse of spouses) {
      const inLawTree = await this.getSpouseFamilyTree(spouse.user.id, userId);
      inLawTrees.push(inLawTree);
    }

    return {
      ...primaryTree,
      inLaws: inLawTrees,
      context: 'extended'
    };
  }

  /**
   * Get spouse's family tree (in-laws)
   */
  async getSpouseFamilyTree(spouseId, currentUserId) {
    const spouseFamilyTree = await this.getFamilyTree(spouseId);
    
    // Convert relationships to in-law relationships
    const convertToInLaw = (relationship) => {
      const inLawMap = {
        'father': 'father-in-law',
        'mother': 'mother-in-law',
        'son': 'son-in-law',
        'daughter': 'daughter-in-law',
        'brother': 'brother-in-law',
        'sister': 'sister-in-law'
      };
      return inLawMap[relationship] || relationship;
    };

    // Convert all relationships to in-law perspective
    spouseFamilyTree.ancestors = spouseFamilyTree.ancestors.map(member => ({
      ...member,
      relationship: convertToInLaw(member.relationship)
    }));

    spouseFamilyTree.descendants = spouseFamilyTree.descendants.map(member => ({
      ...member,
      relationship: convertToInLaw(member.relationship)
    }));

    spouseFamilyTree.adjacent = spouseFamilyTree.adjacent.map(member => ({
      ...member,
      relationship: convertToInLaw(member.relationship)
    }));

    return {
      ...spouseFamilyTree,
      context: 'in-laws',
      spouseId: spouseId,
      primaryUserId: currentUserId
    };
  }

  /**
   * Add a new family member
   */
  async addFamilyMember(memberData, currentUserId) {
    const { relationshipType, ...userData } = memberData;
    
    // Validate relationship type
    if (!this.RELATIONSHIP_TYPES[relationshipType]) {
      throw new AppError('Invalid relationship type', 400, 'INVALID_RELATIONSHIP');
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Create new user
    userData.password = 'TempPassword123!'; // Temporary password
    const newUser = await User.create(userData);

    // Create relationship
    await this._createRelationship(currentUserId, newUser.id, relationshipType);

    // Create reciprocal relationship
    const reciprocalType = this._getReciprocalRelationship(relationshipType, userData.gender);
    if (reciprocalType) {
      await this._createRelationship(newUser.id, currentUserId, reciprocalType);
    }

    return newUser;
  }

  /**
   * Add a spouse
   */
  async addSpouse(spouseData, currentUserId) {
    // Check if user already exists
    const existingUser = await User.findByEmail(spouseData.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Create new user
    spouseData.password = 'TempPassword123!'; // Temporary password
    const newSpouse = await User.create(spouseData);

    // Determine relationship types
    const currentUser = await User.findById(currentUserId);
    let currentUserType, spouseType;

    if (currentUser.gender === 'male' && spouseData.gender === 'female') {
      currentUserType = 'husband';
      spouseType = 'wife';
    } else if (currentUser.gender === 'female' && spouseData.gender === 'male') {
      currentUserType = 'wife';
      spouseType = 'husband';
    } else {
      currentUserType = 'partner';
      spouseType = 'partner';
    }

    // Create bidirectional marriage relationship
    await this._createMarriageRelationship(currentUserId, newSpouse.id, currentUserType, spouseType);

    return {
      spouse: newSpouse,
      relationship: spouseType,
      message: 'Spouse added successfully'
    };
  }

  /**
   * Remove a family member
   */
  async removeFamilyMember(memberId, currentUserId) {
    // Check if the member is related to current user
    const cypher = `
      MATCH (current:User {id: $currentUserId})-[r]-(member:User {id: $memberId})
      RETURN member, r
    `;

    const result = await database.runQuery(cypher, { currentUserId, memberId });
    
    if (result.records.length === 0) {
      throw new AppError('Family member not found or not related to current user', 404, 'MEMBER_NOT_FOUND');
    }

    // Delete the user and all relationships
    await User.delete(memberId);

    return { message: 'Family member removed successfully' };
  }

  /**
   * Get all family members for a user
   */
  async getAllFamilyMembers(userId) {
    const familyTree = await this.getFamilyTree(userId);
    
    const allMembers = [
      ...familyTree.ancestors,
      ...familyTree.descendants,
      ...familyTree.adjacent
    ];

    return {
      currentUser: familyTree.currentUser,
      familyMembers: allMembers,
      totalMembers: familyTree.totalMembers
    };
  }

  /**
   * Get available relationship types
   */
  getRelationshipTypes() {
    return Object.keys(this.RELATIONSHIP_TYPES).map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
      level: this.RELATIONSHIP_TYPES[type].level,
      category: this.RELATIONSHIP_TYPES[type].category,
      subcategory: this.RELATIONSHIP_TYPES[type].subcategory
    }));
  }

  // Private helper methods
  async _getUserSpouse(userId) {
    const cypher = `
      MATCH (u:User {id: $userId})-[r:MARRIED_TO|PARTNER_OF]-(spouse:User)
      RETURN spouse
    `;

    const result = await database.runQuery(cypher, { userId });
    
    if (result.records.length > 0) {
      return database.constructor.extractNodeProperties(result.records[0], 'spouse');
    }
    
    return null;
  }

  async _createRelationship(fromUserId, toUserId, relationshipType) {
    const relationshipLabel = relationshipType.toUpperCase().replace(/-/g, '_');
    
    const cypher = `
      MATCH (from:User {id: $fromUserId}), (to:User {id: $toUserId})
      CREATE (from)-[r:${relationshipLabel} {
        type: $relationshipType,
        createdAt: datetime()
      }]->(to)
      RETURN r
    `;

    await database.runQuery(cypher, {
      fromUserId,
      toUserId,
      relationshipType
    });
  }

  async _createMarriageRelationship(userId1, userId2, type1, type2) {
    const queries = [
      {
        cypher: `
          MATCH (u1:User {id: $userId1}), (u2:User {id: $userId2})
          CREATE (u1)-[r:MARRIED_TO {
            type: $type1,
            createdAt: datetime()
          }]->(u2)
          RETURN r
        `,
        parameters: { userId1, userId2, type1 }
      },
      {
        cypher: `
          MATCH (u1:User {id: $userId1}), (u2:User {id: $userId2})
          CREATE (u2)-[r:MARRIED_TO {
            type: $type2,
            createdAt: datetime()
          }]->(u1)
          RETURN r
        `,
        parameters: { userId1, userId2, type2 }
      }
    ];

    await database.runTransaction(queries);
  }

  _getReciprocalRelationship(relationshipType, gender) {
    const reciprocalMap = {
      'father': gender === 'male' ? 'son' : 'daughter',
      'mother': gender === 'male' ? 'son' : 'daughter',
      'son': 'father', // This would need context of current user's gender
      'daughter': 'mother', // This would need context of current user's gender
      'brother': gender === 'male' ? 'brother' : 'sister',
      'sister': gender === 'male' ? 'brother' : 'sister',
      'grandfather': gender === 'male' ? 'grandson' : 'granddaughter',
      'grandmother': gender === 'male' ? 'grandson' : 'granddaughter',
      'uncle': gender === 'male' ? 'nephew' : 'niece',
      'aunt': gender === 'male' ? 'nephew' : 'niece',
      'cousin': 'cousin'
    };

    return reciprocalMap[relationshipType];
  }
}

module.exports = new FamilyService();