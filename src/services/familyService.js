const database = require('../config/database');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

class FamilyService {
  constructor() {
    // Comprehensive relationship type definitions with levels
    this.RELATIONSHIP_TYPES = {
      // Direct relationships (Level 0) - Marriage/Partnership
      'husband': { level: 0, category: 'direct', subcategory: 'marriage', reciprocal: 'wife', description: 'Male spouse' },
      'wife': { level: 0, category: 'direct', subcategory: 'marriage', reciprocal: 'husband', description: 'Female spouse' },
      'partner': { level: 0, category: 'direct', subcategory: 'marriage', reciprocal: 'partner', description: 'Life partner' },
      'ex-husband': { level: 0, category: 'direct', subcategory: 'divorced', reciprocal: 'ex-wife', description: 'Former male spouse' },
      'ex-wife': { level: 0, category: 'direct', subcategory: 'divorced', reciprocal: 'ex-husband', description: 'Former female spouse' },
      
      // Parents (Level +1)
      'father': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'child', description: 'Biological or adoptive father' },
      'mother': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'child', description: 'Biological or adoptive mother' },
      'stepfather': { level: 1, category: 'indirect', subcategory: 'step', reciprocal: 'stepchild', description: 'Mother\'s husband (not biological father)' },
      'stepmother': { level: 1, category: 'indirect', subcategory: 'step', reciprocal: 'stepchild', description: 'Father\'s wife (not biological mother)' },
      'foster-father': { level: 1, category: 'indirect', subcategory: 'foster', reciprocal: 'foster-child', description: 'Foster care father' },
      'foster-mother': { level: 1, category: 'indirect', subcategory: 'foster', reciprocal: 'foster-child', description: 'Foster care mother' },
      'adoptive-father': { level: 1, category: 'indirect', subcategory: 'adoptive', reciprocal: 'adopted-child', description: 'Legal adoptive father' },
      'adoptive-mother': { level: 1, category: 'indirect', subcategory: 'adoptive', reciprocal: 'adopted-child', description: 'Legal adoptive mother' },
      
      // Children (Level -1)
      'son': { level: -1, category: 'indirect', subcategory: 'blood', reciprocal: 'parent', description: 'Male child' },
      'daughter': { level: -1, category: 'indirect', subcategory: 'blood', reciprocal: 'parent', description: 'Female child' },
      'stepson': { level: -1, category: 'indirect', subcategory: 'step', reciprocal: 'stepparent', description: 'Spouse\'s male child from previous relationship' },
      'stepdaughter': { level: -1, category: 'indirect', subcategory: 'step', reciprocal: 'stepparent', description: 'Spouse\'s female child from previous relationship' },
      'foster-son': { level: -1, category: 'indirect', subcategory: 'foster', reciprocal: 'foster-parent', description: 'Foster male child' },
      'foster-daughter': { level: -1, category: 'indirect', subcategory: 'foster', reciprocal: 'foster-parent', description: 'Foster female child' },
      'adopted-son': { level: -1, category: 'indirect', subcategory: 'adoptive', reciprocal: 'adoptive-parent', description: 'Legally adopted male child' },
      'adopted-daughter': { level: -1, category: 'indirect', subcategory: 'adoptive', reciprocal: 'adoptive-parent', description: 'Legally adopted female child' },
      
      // Siblings (Level 0)
      'brother': { level: 0, category: 'indirect', subcategory: 'blood', reciprocal: 'sibling', description: 'Male sibling (same parents)' },
      'sister': { level: 0, category: 'indirect', subcategory: 'blood', reciprocal: 'sibling', description: 'Female sibling (same parents)' },
      'half-brother': { level: 0, category: 'indirect', subcategory: 'half', reciprocal: 'half-sibling', description: 'Male sibling (one shared parent)' },
      'half-sister': { level: 0, category: 'indirect', subcategory: 'half', reciprocal: 'half-sibling', description: 'Female sibling (one shared parent)' },
      'stepbrother': { level: 0, category: 'indirect', subcategory: 'step', reciprocal: 'step-sibling', description: 'Male step-sibling' },
      'stepsister': { level: 0, category: 'indirect', subcategory: 'step', reciprocal: 'step-sibling', description: 'Female step-sibling' },
      'twin-brother': { level: 0, category: 'indirect', subcategory: 'blood', reciprocal: 'twin', description: 'Male twin sibling' },
      'twin-sister': { level: 0, category: 'indirect', subcategory: 'blood', reciprocal: 'twin', description: 'Female twin sibling' },
      
      // Grandparents (Level +2)
      'grandfather': { level: 2, category: 'indirect', subcategory: 'blood', reciprocal: 'grandchild', description: 'Father\'s or mother\'s father' },
      'grandmother': { level: 2, category: 'indirect', subcategory: 'blood', reciprocal: 'grandchild', description: 'Father\'s or mother\'s mother' },
      'paternal-grandfather': { level: 2, category: 'indirect', subcategory: 'blood', reciprocal: 'grandchild', description: 'Father\'s father' },
      'paternal-grandmother': { level: 2, category: 'indirect', subcategory: 'blood', reciprocal: 'grandchild', description: 'Father\'s mother' },
      'maternal-grandfather': { level: 2, category: 'indirect', subcategory: 'blood', reciprocal: 'grandchild', description: 'Mother\'s father' },
      'maternal-grandmother': { level: 2, category: 'indirect', subcategory: 'blood', reciprocal: 'grandchild', description: 'Mother\'s mother' },
      'step-grandfather': { level: 2, category: 'indirect', subcategory: 'step', reciprocal: 'step-grandchild', description: 'Step-parent\'s father' },
      'step-grandmother': { level: 2, category: 'indirect', subcategory: 'step', reciprocal: 'step-grandchild', description: 'Step-parent\'s mother' },
      
      // Grandchildren (Level -2)
      'grandson': { level: -2, category: 'indirect', subcategory: 'blood', reciprocal: 'grandparent', description: 'Son\'s or daughter\'s male child' },
      'granddaughter': { level: -2, category: 'indirect', subcategory: 'blood', reciprocal: 'grandparent', description: 'Son\'s or daughter\'s female child' },
      'step-grandson': { level: -2, category: 'indirect', subcategory: 'step', reciprocal: 'step-grandparent', description: 'Step-child\'s male child' },
      'step-granddaughter': { level: -2, category: 'indirect', subcategory: 'step', reciprocal: 'step-grandparent', description: 'Step-child\'s female child' },
      
      // Great-grandparents (Level +3)
      'great-grandfather': { level: 3, category: 'indirect', subcategory: 'blood', reciprocal: 'great-grandchild', description: 'Grandparent\'s father' },
      'great-grandmother': { level: 3, category: 'indirect', subcategory: 'blood', reciprocal: 'great-grandchild', description: 'Grandparent\'s mother' },
      
      // Great-grandchildren (Level -3)
      'great-grandson': { level: -3, category: 'indirect', subcategory: 'blood', reciprocal: 'great-grandparent', description: 'Grandchild\'s male child' },
      'great-granddaughter': { level: -3, category: 'indirect', subcategory: 'blood', reciprocal: 'great-grandparent', description: 'Grandchild\'s female child' },
      
      // Extended family - Uncles/Aunts (Level +1 but different branch)
      'uncle': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'nephew/niece', description: 'Parent\'s brother' },
      'aunt': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'nephew/niece', description: 'Parent\'s sister' },
      'paternal-uncle': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'nephew/niece', description: 'Father\'s brother' },
      'paternal-aunt': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'nephew/niece', description: 'Father\'s sister' },
      'maternal-uncle': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'nephew/niece', description: 'Mother\'s brother' },
      'maternal-aunt': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'nephew/niece', description: 'Mother\'s sister' },
      'great-uncle': { level: 2, category: 'indirect', subcategory: 'blood', reciprocal: 'great-nephew/niece', description: 'Grandparent\'s brother' },
      'great-aunt': { level: 2, category: 'indirect', subcategory: 'blood', reciprocal: 'great-nephew/niece', description: 'Grandparent\'s sister' },
      
      // Nephews/Nieces (Level -1 but different branch)
      'nephew': { level: -1, category: 'indirect', subcategory: 'blood', reciprocal: 'uncle/aunt', description: 'Sibling\'s male child' },
      'niece': { level: -1, category: 'indirect', subcategory: 'blood', reciprocal: 'uncle/aunt', description: 'Sibling\'s female child' },
      'great-nephew': { level: -2, category: 'indirect', subcategory: 'blood', reciprocal: 'great-uncle/aunt', description: 'Nephew\'s or niece\'s male child' },
      'great-niece': { level: -2, category: 'indirect', subcategory: 'blood', reciprocal: 'great-uncle/aunt', description: 'Nephew\'s or niece\'s female child' },
      
      // Cousins (Level 0)
      'cousin': { level: 0, category: 'indirect', subcategory: 'blood', reciprocal: 'cousin', description: 'Uncle\'s or aunt\'s child' },
      'first-cousin': { level: 0, category: 'indirect', subcategory: 'blood', reciprocal: 'first-cousin', description: 'Uncle\'s or aunt\'s child' },
      'second-cousin': { level: 0, category: 'indirect', subcategory: 'blood', reciprocal: 'second-cousin', description: 'Great-uncle\'s or great-aunt\'s grandchild' },
      'third-cousin': { level: 0, category: 'indirect', subcategory: 'blood', reciprocal: 'third-cousin', description: 'Great-great-uncle\'s or great-great-aunt\'s great-grandchild' },
      'cousin-once-removed': { level: 1, category: 'indirect', subcategory: 'blood', reciprocal: 'cousin-once-removed', description: 'Cousin\'s child or parent\'s cousin' },
      'cousin-twice-removed': { level: 2, category: 'indirect', subcategory: 'blood', reciprocal: 'cousin-twice-removed', description: 'Cousin\'s grandchild or grandparent\'s cousin' },
      
      // In-laws - Parents
      'father-in-law': { level: 1, category: 'indirect', subcategory: 'marriage', reciprocal: 'son/daughter-in-law', description: 'Spouse\'s father' },
      'mother-in-law': { level: 1, category: 'indirect', subcategory: 'marriage', reciprocal: 'son/daughter-in-law', description: 'Spouse\'s mother' },
      
      // In-laws - Children
      'son-in-law': { level: -1, category: 'indirect', subcategory: 'marriage', reciprocal: 'father/mother-in-law', description: 'Daughter\'s husband' },
      'daughter-in-law': { level: -1, category: 'indirect', subcategory: 'marriage', reciprocal: 'father/mother-in-law', description: 'Son\'s wife' },
      
      // In-laws - Siblings
      'brother-in-law': { level: 0, category: 'indirect', subcategory: 'marriage', reciprocal: 'brother/sister-in-law', description: 'Spouse\'s brother or sibling\'s husband' },
      'sister-in-law': { level: 0, category: 'indirect', subcategory: 'marriage', reciprocal: 'brother/sister-in-law', description: 'Spouse\'s sister or sibling\'s wife' },
      
      // In-laws - Extended
      'uncle-in-law': { level: 1, category: 'indirect', subcategory: 'marriage', reciprocal: 'nephew/niece-in-law', description: 'Spouse\'s uncle or aunt\'s husband' },
      'aunt-in-law': { level: 1, category: 'indirect', subcategory: 'marriage', reciprocal: 'nephew/niece-in-law', description: 'Spouse\'s aunt or uncle\'s wife' },
      'nephew-in-law': { level: -1, category: 'indirect', subcategory: 'marriage', reciprocal: 'uncle/aunt-in-law', description: 'Sibling-in-law\'s son or nephew\'s spouse' },
      'niece-in-law': { level: -1, category: 'indirect', subcategory: 'marriage', reciprocal: 'uncle/aunt-in-law', description: 'Sibling-in-law\'s daughter or niece\'s spouse' },
      'cousin-in-law': { level: 0, category: 'indirect', subcategory: 'marriage', reciprocal: 'cousin-in-law', description: 'Cousin\'s spouse or spouse\'s cousin' },
      
      // In-laws - Grandparents
      'grandfather-in-law': { level: 2, category: 'indirect', subcategory: 'marriage', reciprocal: 'grandson/granddaughter-in-law', description: 'Spouse\'s grandfather' },
      'grandmother-in-law': { level: 2, category: 'indirect', subcategory: 'marriage', reciprocal: 'grandson/granddaughter-in-law', description: 'Spouse\'s grandmother' },
      'grandson-in-law': { level: -2, category: 'indirect', subcategory: 'marriage', reciprocal: 'grandfather/grandmother-in-law', description: 'Grandchild\'s husband' },
      'granddaughter-in-law': { level: -2, category: 'indirect', subcategory: 'marriage', reciprocal: 'grandfather/grandmother-in-law', description: 'Grandchild\'s wife' },
      
      // Godparents and spiritual relationships
      'godfather': { level: 1, category: 'spiritual', subcategory: 'godparent', reciprocal: 'godchild', description: 'Male spiritual guardian' },
      'godmother': { level: 1, category: 'spiritual', subcategory: 'godparent', reciprocal: 'godchild', description: 'Female spiritual guardian' },
      'godson': { level: -1, category: 'spiritual', subcategory: 'godchild', reciprocal: 'godparent', description: 'Male spiritual child' },
      'goddaughter': { level: -1, category: 'spiritual', subcategory: 'godchild', reciprocal: 'godparent', description: 'Female spiritual child' },
      
      // Close family friends (honorary relationships)
      'family-friend': { level: 0, category: 'honorary', subcategory: 'friend', reciprocal: 'family-friend', description: 'Close family friend' },
      'honorary-uncle': { level: 1, category: 'honorary', subcategory: 'friend', reciprocal: 'honorary-nephew/niece', description: 'Close male family friend treated as uncle' },
      'honorary-aunt': { level: 1, category: 'honorary', subcategory: 'friend', reciprocal: 'honorary-nephew/niece', description: 'Close female family friend treated as aunt' }
    };
  }

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
   * Enhanced method to add any type of family member with smart relationship detection
   */
  async addFamilyMember(memberData, currentUserId) {
    const { relationshipType, ...userData } = memberData;
    
    // Validate relationship type
    if (!this.RELATIONSHIP_TYPES[relationshipType]) {
      throw new AppError('Invalid relationship type', 400, 'INVALID_RELATIONSHIP');
    }

    // Enhanced validation for family member data
    const validationErrors = this._validateFamilyMemberData(userData, relationshipType);
    if (validationErrors.length > 0) {
      throw new AppError(`Validation failed: ${validationErrors.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Get current user information for context
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new AppError('Current user not found', 404, 'CURRENT_USER_NOT_FOUND');
    }

    // Set default values and prepare user data
    userData.password = this._generateTemporaryPassword();
    userData.hasCompletedProfile = false;
    userData.isOnline = false;

    // Handle specific relationship types and set parent references
    await this._setParentReferences(userData, relationshipType, currentUserId, currentUser);

    // Create new user
    const newUser = await User.create(userData);

    // Create the primary relationship
    await this._createRelationship(currentUserId, newUser.id, relationshipType);

    // Create reciprocal relationship
    const reciprocalType = this._getReciprocalRelationship(
      relationshipType,
      currentUser.gender,
      userData.gender
    );
    if (reciprocalType) {
      await this._createRelationship(newUser.id, currentUserId, reciprocalType);
    }

    // Create automatic family relationships
    await this._createAutomaticFamilyRelationships(
      newUser.id,
      currentUserId,
      relationshipType,
      userData.gender
    );

    // Send notification email to new family member (if enabled)
    try {
      await this._sendFamilyInvitationEmail(newUser, currentUser, relationshipType);
    } catch (emailError) {
      console.warn('Failed to send invitation email:', emailError.message);
    }

    return {
      user: this._cleanUserData(newUser),
      relationship: relationshipType,
      message: `${relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1)} added successfully`,
      requiresVerification: true
    };
  }

  /**
   * Get relationship suggestions based on current family structure
   */
  async getRelationshipSuggestions(currentUserId, targetGender = null) {
    const familyTree = await this.getFamilyTree(currentUserId);
    const existingRelationships = new Set();
    
    // Collect existing relationship types
    [...familyTree.ancestors, ...familyTree.descendants, ...familyTree.adjacent].forEach(member => {
      existingRelationships.add(member.relationship);
    });

    // Get all possible relationships grouped by category
    const suggestions = {};
    Object.entries(this.RELATIONSHIP_TYPES).forEach(([type, config]) => {
      if (!suggestions[config.category]) {
        suggestions[config.category] = {};
      }
      if (!suggestions[config.category][config.subcategory]) {
        suggestions[config.category][config.subcategory] = [];
      }

      // Filter by gender if specified
      if (targetGender) {
        const isGenderAppropriate = this._isRelationshipGenderAppropriate(type, targetGender);
        if (!isGenderAppropriate) {
          return;
        }
      }

      suggestions[config.category][config.subcategory].push({
        value: type,
        label: this._formatRelationshipLabel(type),
        description: config.description,
        level: config.level,
        isExisting: existingRelationships.has(type),
        canHaveMultiple: this._canHaveMultipleOfRelationship(type)
      });
    });

    return suggestions;
  }

  /**
   * Validate family member data based on relationship type
   */
  _validateFamilyMemberData(userData, relationshipType) {
    const errors = [];
    
    // Required fields
    if (!userData.firstName || userData.firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }
    
    if (!userData.lastName || userData.lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }
    
    if (!userData.gender || !['male', 'female', 'other'].includes(userData.gender)) {
      errors.push('Valid gender is required');
    }

    if (!userData.email || !this._isValidEmail(userData.email)) {
      errors.push('Valid email address is required');
    }

    // Age validation based on relationship
    if (userData.dateOfBirth) {
      const ageValidationError = this._validateAgeForRelationship(
        userData.dateOfBirth,
        relationshipType
      );
      if (ageValidationError) {
        errors.push(ageValidationError);
      }
    }

    // Gender-relationship compatibility
    const genderError = this._validateGenderForRelationship(userData.gender, relationshipType);
    if (genderError) {
      errors.push(genderError);
    }

    return errors;
  }

  /**
   * Set parent references based on relationship type
   */
  async _setParentReferences(userData, relationshipType, currentUserId, currentUser) {
    switch (relationshipType) {
      case 'son':
      case 'daughter':
        // For children, current user becomes parent
        if (currentUser.gender === 'male') {
          userData.fatherId = currentUserId;
        } else if (currentUser.gender === 'female') {
          userData.motherId = currentUserId;
        }
        break;
        
      case 'brother':
      case 'sister':
      case 'twin-brother':
      case 'twin-sister':
        // For siblings, share same parents
        userData.fatherId = currentUser.fatherId;
        userData.motherId = currentUser.motherId;
        break;
        
      case 'father':
        // Current user becomes child of new father
        await User.update(currentUserId, { fatherId: userData.id });
        break;
        
      case 'mother':
        // Current user becomes child of new mother
        await User.update(currentUserId, { motherId: userData.id });
        break;
        
      case 'nephew':
      case 'niece':
        // For nephew/niece, they are children of current user's sibling
        // This would require finding the appropriate sibling as parent
        break;
        
      case 'grandson':
      case 'granddaughter':
        // For grandchildren, current user becomes grandparent
        // This would require setting appropriate parent chain
        break;
    }
  }

  /**
   * Create automatic family relationships when adding a new member
   */
  async _createAutomaticFamilyRelationships(
    newUserId,
    currentUserId,
    relationshipType,
    newUserGender
  ) {
    const familyTree = await this.getFamilyTree(currentUserId);
    
    // Create relationships with existing family members based on the new relationship
    switch (relationshipType) {
      case 'son':
      case 'daughter':
        await this._createChildRelationships(newUserId, newUserGender, familyTree);
        break;
        
      case 'father':
      case 'mother':
        await this._createParentRelationships(newUserId, relationshipType, familyTree);
        break;
        
      case 'brother':
      case 'sister':
        await this._createSiblingRelationships(newUserId, newUserGender, familyTree);
        break;
        
      case 'uncle':
      case 'aunt':
        await this._createUncleAuntRelationships(newUserId, relationshipType, familyTree);
        break;
        
      case 'cousin':
        await this._createCousinRelationships(newUserId, familyTree);
        break;
    }
  }

  /**
   * Create relationships when adding a child
   */
  async _createChildRelationships(childId, childGender, familyTree) {
    // Child becomes grandchild to current user's parents
    for (const ancestor of familyTree.ancestors) {
      if (['father', 'mother'].includes(ancestor.relationship)) {
        const grandchildType = childGender === 'male' ? 'grandson' : 'granddaughter';
        const grandparentType = ancestor.relationship === 'father' ? 'grandfather' : 'grandmother';
        
        await this._createRelationship(ancestor.user.id, childId, grandchildType);
        await this._createRelationship(childId, ancestor.user.id, grandparentType);
      }
    }
    
    // Child becomes nephew/niece to current user's siblings
    for (const adjacent of familyTree.adjacent) {
      if (['brother', 'sister'].includes(adjacent.relationship)) {
        const nephewNieceType = childGender === 'male' ? 'nephew' : 'niece';
        const uncleAuntType = adjacent.user.gender === 'male' ? 'uncle' : 'aunt';
        
        await this._createRelationship(adjacent.user.id, childId, nephewNieceType);
        await this._createRelationship(childId, adjacent.user.id, uncleAuntType);
      }
    }
  }

  /**
   * Enhanced reciprocal relationship detection
   */
  _getReciprocalRelationship(relationshipType, currentUserGender, newUserGender) {
    const reciprocalMap = {
      // Parent relationships
      father: newUserGender === 'male' ? 'son' : 'daughter',
      mother: newUserGender === 'male' ? 'son' : 'daughter',
      stepfather: newUserGender === 'male' ? 'stepson' : 'stepdaughter',
      stepmother: newUserGender === 'male' ? 'stepson' : 'stepdaughter',
      
      // Child relationships  
      son: currentUserGender === 'male' ? 'father' : 'mother',
      daughter: currentUserGender === 'male' ? 'father' : 'mother',
      stepson: currentUserGender === 'male' ? 'stepfather' : 'stepmother',
      stepdaughter: currentUserGender === 'male' ? 'stepfather' : 'stepmother',
      
      // Sibling relationships
      brother: newUserGender === 'male' ? 'brother' : 'sister',
      sister: newUserGender === 'male' ? 'brother' : 'sister',
      'half-brother': newUserGender === 'male' ? 'half-brother' : 'half-sister',
      'half-sister': newUserGender === 'male' ? 'half-brother' : 'half-sister',
      
      // Grandparent relationships
      grandfather: newUserGender === 'male' ? 'grandson' : 'granddaughter',
      grandmother: newUserGender === 'male' ? 'grandson' : 'granddaughter',
      
      // Grandchild relationships
      grandson: currentUserGender === 'male' ? 'grandfather' : 'grandmother',
      granddaughter: currentUserGender === 'male' ? 'grandfather' : 'grandmother',
      
      // Extended family
      uncle: newUserGender === 'male' ? 'nephew' : 'niece',
      aunt: newUserGender === 'male' ? 'nephew' : 'niece',
      nephew: currentUserGender === 'male' ? 'uncle' : 'aunt',
      niece: currentUserGender === 'male' ? 'uncle' : 'aunt',
      cousin: 'cousin',
      
      // In-laws
      'father-in-law': newUserGender === 'male' ? 'son-in-law' : 'daughter-in-law',
      'mother-in-law': newUserGender === 'male' ? 'son-in-law' : 'daughter-in-law',
      'son-in-law': currentUserGender === 'male' ? 'father-in-law' : 'mother-in-law',
      'daughter-in-law': currentUserGender === 'male' ? 'father-in-law' : 'mother-in-law',
      'brother-in-law': newUserGender === 'male' ? 'brother-in-law' : 'sister-in-law',
      'sister-in-law': newUserGender === 'male' ? 'brother-in-law' : 'sister-in-law',
      
      // Spiritual relationships
      godfather: newUserGender === 'male' ? 'godson' : 'goddaughter',
      godmother: newUserGender === 'male' ? 'godson' : 'goddaughter',
      godson: currentUserGender === 'male' ? 'godfather' : 'godmother',
      goddaughter: currentUserGender === 'male' ? 'godfather' : 'godmother'
    };

    return reciprocalMap[relationshipType];
  }

  // Helper methods
  _generateTemporaryPassword() {
    return `FamilyTree${Math.random().toString(36).substring(2, 8)}!`;
  }

  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  _validateAgeForRelationship(dateOfBirth, relationshipType) {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    
    const ageRules = {
      'great-grandfather': { min: 60, max: 120 },
      'great-grandmother': { min: 60, max: 120 },
      grandfather: { min: 45, max: 100 },
      grandmother: { min: 45, max: 100 },
      father: { min: 16, max: 80 },
      mother: { min: 16, max: 80 },
      uncle: { min: 16, max: 80 },
      aunt: { min: 16, max: 80 },
      son: { min: 0, max: 50 },
      daughter: { min: 0, max: 50 },
      grandson: { min: 0, max: 30 },
      granddaughter: { min: 0, max: 30 },
      'great-grandson': { min: 0, max: 25 },
      'great-granddaughter': { min: 0, max: 25 }
    };

    const rule = ageRules[relationshipType];
    if (rule && (age < rule.min || age > rule.max)) {
      return `Age ${age} is not appropriate for relationship type ${relationshipType}`;
    }
    
    return null;
  }

  _validateGenderForRelationship(gender, relationshipType) {
    const maleRelationships = [
      'father', 'stepfather', 'grandfather', 'son', 'stepson', 'grandson',
      'brother', 'half-brother', 'stepbrother', 'twin-brother', 'uncle', 'nephew',
      'husband', 'father-in-law', 'son-in-law', 'brother-in-law',
      'godfather', 'godson'
    ];
    
    const femaleRelationships = [
      'mother', 'stepmother', 'grandmother', 'daughter', 'stepdaughter', 'granddaughter',
      'sister', 'half-sister', 'stepsister', 'twin-sister', 'aunt', 'niece',
      'wife', 'mother-in-law', 'daughter-in-law', 'sister-in-law',
      'godmother', 'goddaughter'
    ];

    if (gender === 'male' && femaleRelationships.includes(relationshipType)) {
      return `Relationship type ${relationshipType} requires female gender`;
    }
    
    if (gender === 'female' && maleRelationships.includes(relationshipType)) {
      return `Relationship type ${relationshipType} requires male gender`;
    }
    
    return null;
  }

  _isRelationshipGenderAppropriate(relationshipType, gender) {
    const genderError = this._validateGenderForRelationship(gender, relationshipType);
    return !genderError;
  }

  _formatRelationshipLabel(relationshipType) {
    return relationshipType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  _canHaveMultipleOfRelationship(relationshipType) {
    const singleRelationships = [
      'father', 'mother', 'husband', 'wife', 'partner',
      'stepfather', 'stepmother'
    ];
    return !singleRelationships.includes(relationshipType);
  }

  async _sendFamilyInvitationEmail(newUser, currentUser, relationshipType) {
    // Placeholder for email service integration
    console.log(`Sending invitation email to ${newUser.email} for ${relationshipType} relationship with ${currentUser.firstName}`);
    // In a real implementation, this would integrate with an email service
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

  /**
   * Get relationship types formatted for dropdown selection with IDs and categories
   */
  getRelationshipDropdownOptions() {
    const relationshipOptions = [];
    const categoryMap = {
      spouse: 'Spouse & Partners',
      parents: 'Parents',
      children: 'Children', 
      siblings: 'Siblings',
      grandparents: 'Grandparents',
      grandchildren: 'Grandchildren',
      aunts_uncles: 'Aunts & Uncles',
      cousins: 'Cousins',
      in_laws: 'In-Laws',
      nieces_nephews: 'Nieces & Nephews',
      step_family: 'Step Family',
      spiritual_family: 'Spiritual Family',
      honorary_family: 'Honorary Family'
    };

    // Organize relationships by category
    const categorizedRelationships = {};
    
    Object.keys(this.RELATIONSHIP_TYPES).forEach(relationshipType => {
      const relationship = this.RELATIONSHIP_TYPES[relationshipType];
      let category = 'Other';
      
      // Determine category based on relationship type
      if (['husband', 'wife', 'partner', 'ex-husband', 'ex-wife'].includes(relationshipType)) {
        category = 'Spouse & Partners';
      } else if (['father', 'mother', 'stepfather', 'stepmother', 'adoptive-father', 'adoptive-mother'].includes(relationshipType)) {
        category = 'Parents';
      } else if (['son', 'daughter', 'stepson', 'stepdaughter', 'adopted-son', 'adopted-daughter'].includes(relationshipType)) {
        category = 'Children';
      } else if (['brother', 'sister', 'stepbrother', 'stepsister', 'half-brother', 'half-sister'].includes(relationshipType)) {
        category = 'Siblings';
      } else if (['grandfather', 'grandmother', 'great-grandfather', 'great-grandmother'].includes(relationshipType)) {
        category = 'Grandparents';
      } else if (['grandson', 'granddaughter', 'great-grandson', 'great-granddaughter'].includes(relationshipType)) {
        category = 'Grandchildren';
      } else if (['uncle', 'aunt', 'great-uncle', 'great-aunt'].includes(relationshipType)) {
        category = 'Aunts & Uncles';
      } else if (relationshipType.includes('cousin')) {
        category = 'Cousins';
      } else if (relationshipType.includes('in-law')) {
        category = 'In-Laws';
      } else if (['nephew', 'niece', 'grand-nephew', 'grand-niece'].includes(relationshipType)) {
        category = 'Nieces & Nephews';
      } else if (relationshipType.includes('step')) {
        category = 'Step Family';
      } else if (['godfather', 'godmother', 'godchild'].includes(relationshipType)) {
        category = 'Spiritual Family';
      } else if (['family-friend', 'chosen-family'].includes(relationshipType)) {
        category = 'Honorary Family';
      }
      
      if (!categorizedRelationships[category]) {
        categorizedRelationships[category] = [];
      }
      
      categorizedRelationships[category].push({
        id: relationshipType,
        label: this._formatRelationshipLabel(relationshipType),
        description: relationship.description,
        level: relationship.level,
        subcategory: relationship.subcategory
      });
    });

    // Convert to array format for dropdown
    Object.keys(categorizedRelationships).forEach(category => {
      categorizedRelationships[category].forEach(relationship => {
        relationshipOptions.push({
          id: relationship.id,
          label: relationship.label,
          category: category,
          description: relationship.description,
          level: relationship.level,
          subcategory: relationship.subcategory
        });
      });
    });

    return relationshipOptions.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.label.localeCompare(b.label);
    });
  }

  /**
   * Helper method to format relationship labels
   */
  _formatRelationshipLabel(relationshipType) {
    return relationshipType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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