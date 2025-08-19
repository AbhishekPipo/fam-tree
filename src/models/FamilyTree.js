const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class FamilyTree {
  constructor(data) {
    // Identity
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description || null;
    
    // Ownership
    this.ownerId = data.ownerId;
    
    // Settings
    this.visibility = data.visibility || 'family';
    this.allowContributions = data.allowContributions !== undefined ? data.allowContributions : true;
    this.requireApproval = data.requireApproval !== undefined ? data.requireApproval : false;
    
    // Metadata
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    
    // Configuration
    this.settings = data.settings || {
      defaultPrivacy: 'family',
      allowPhotoUploads: true,
      maxFileSize: 10485760, // 10MB
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
    };
  }

  // Validation
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Tree name is required');
    }

    if (this.name && this.name.length > 100) {
      errors.push('Tree name must be less than 100 characters');
    }

    if (!this.ownerId) {
      errors.push('Owner ID is required');
    }

    if (!['public', 'private', 'family'].includes(this.visibility)) {
      errors.push('Invalid visibility setting');
    }

    return errors;
  }

  // Convert to JSON
  toJSON() {
    return { ...this };
  }

  // Save family tree to Neo4j
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    this.updatedAt = new Date().toISOString();

    const cypher = `
      MERGE (ft:FamilyTree {id: $id})
      SET ft += $properties
      WITH ft
      MATCH (owner:User {id: $ownerId})
      MERGE (owner)-[:OWNS {ownershipStart: $ownershipStart}]->(ft)
      RETURN ft
    `;

    const result = await database.runQuery(cypher, {
      id: this.id,
      ownerId: this.ownerId,
      ownershipStart: this.createdAt,
      properties: this.toJSON()
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to save family tree', 500, 'SAVE_FAILED');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'ft');
  }

  // Static methods
  static async findById(id) {
    const cypher = `
      MATCH (ft:FamilyTree {id: $id})
      OPTIONAL MATCH (owner:User)-[:OWNS]->(ft)
      OPTIONAL MATCH (ft)<-[:BELONGS_TO]-(person:Person)
      RETURN ft, owner, count(DISTINCT person) as memberCount
    `;
    
    const result = await database.runQuery(cypher, { id });
    
    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const tree = database.constructor.extractNodeProperties(record, 'ft');
    const owner = record.get('owner') ? database.constructor.extractNodeProperties(record, 'owner') : null;
    const memberCount = record.get('memberCount').toNumber();

    return {
      ...tree,
      owner,
      memberCount
    };
  }

  static async findByOwnerId(ownerId) {
    const cypher = `
      MATCH (owner:User {id: $ownerId})-[:OWNS]->(ft:FamilyTree)
      OPTIONAL MATCH (ft)<-[:BELONGS_TO]-(person:Person)
      RETURN ft, count(DISTINCT person) as memberCount
      ORDER BY ft.createdAt DESC
    `;
    
    const result = await database.runQuery(cypher, { ownerId });
    
    return result.records.map(record => {
      const tree = database.constructor.extractNodeProperties(record, 'ft');
      const memberCount = record.get('memberCount').toNumber();
      return { ...tree, memberCount };
    });
  }

  static async findUserTrees(userId) {
    const cypher = `
      MATCH (user:User {id: $userId})
      OPTIONAL MATCH (user)-[:OWNS]->(ownedTree:FamilyTree)
      OPTIONAL MATCH (user)-[:MEMBER_OF]->(memberTree:FamilyTree)
      OPTIONAL MATCH (ownedTree)<-[:BELONGS_TO]-(ownedPerson:Person)
      OPTIONAL MATCH (memberTree)<-[:BELONGS_TO]-(memberPerson:Person)
      RETURN 
        ownedTree, count(DISTINCT ownedPerson) as ownedMemberCount,
        memberTree, count(DISTINCT memberPerson) as memberMemberCount
    `;
    
    const result = await database.runQuery(cypher, { userId });
    
    const ownedTrees = [];
    const memberTrees = [];

    result.records.forEach(record => {
      const ownedTree = record.get('ownedTree');
      const memberTree = record.get('memberTree');

      if (ownedTree) {
        const tree = database.constructor.extractNodeProperties({ get: () => ownedTree }, '');
        const memberCount = record.get('ownedMemberCount').toNumber();
        ownedTrees.push({ ...tree, memberCount, role: 'owner' });
      }

      if (memberTree) {
        const tree = database.constructor.extractNodeProperties({ get: () => memberTree }, '');
        const memberCount = record.get('memberMemberCount').toNumber();
        memberTrees.push({ ...tree, memberCount, role: 'member' });
      }
    });

    return {
      ownedTrees: [...new Map(ownedTrees.map(t => [t.id, t])).values()],
      memberTrees: [...new Map(memberTrees.map(t => [t.id, t])).values()]
    };
  }

  static async create(treeData) {
    const tree = new FamilyTree(treeData);
    return await tree.save();
  }

  static async update(id, updateData) {
    updateData.updatedAt = new Date().toISOString();

    const cypher = `
      MATCH (ft:FamilyTree {id: $id})
      SET ft += $properties
      RETURN ft
    `;

    const result = await database.runQuery(cypher, {
      id,
      properties: updateData
    });

    if (result.records.length === 0) {
      throw new AppError('Family tree not found', 404, 'TREE_NOT_FOUND');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'ft');
  }

  static async delete(id) {
    const cypher = `
      MATCH (ft:FamilyTree {id: $id})
      DETACH DELETE ft
      RETURN count(ft) as deletedCount
    `;

    const result = await database.runQuery(cypher, { id });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('Family tree not found', 404, 'TREE_NOT_FOUND');
    }

    return { deletedCount };
  }

  // Member management
  static async addMember(treeId, userId, role = 'viewer', invitedBy = null) {
    const validRoles = ['admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role', 400, 'INVALID_ROLE');
    }

    const cypher = `
      MATCH (ft:FamilyTree {id: $treeId})
      MATCH (user:User {id: $userId})
      MERGE (user)-[r:MEMBER_OF]->(ft)
      SET r.joinedDate = $joinedDate,
          r.role = $role,
          r.invitedBy = $invitedBy,
          r.status = 'active'
      RETURN r
    `;

    const result = await database.runQuery(cypher, {
      treeId,
      userId,
      role,
      invitedBy,
      joinedDate: new Date().toISOString()
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to add member', 500, 'ADD_MEMBER_FAILED');
    }

    return database.constructor.extractRelationshipProperties(result.records[0], 'r');
  }

  static async removeMember(treeId, userId) {
    const cypher = `
      MATCH (user:User {id: $userId})-[r:MEMBER_OF]->(ft:FamilyTree {id: $treeId})
      DELETE r
      RETURN count(r) as deletedCount
    `;

    const result = await database.runQuery(cypher, { treeId, userId });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('Member relationship not found', 404, 'MEMBER_NOT_FOUND');
    }

    return { deletedCount };
  }

  static async getMembers(treeId) {
    const cypher = `
      MATCH (ft:FamilyTree {id: $treeId})
      OPTIONAL MATCH (owner:User)-[:OWNS]->(ft)
      OPTIONAL MATCH (member:User)-[r:MEMBER_OF]->(ft)
      RETURN owner, member, r
      ORDER BY r.joinedDate
    `;

    const result = await database.runQuery(cypher, { treeId });
    
    const members = [];

    result.records.forEach(record => {
      const owner = record.get('owner');
      const member = record.get('member');
      const relationship = record.get('r');

      if (owner) {
        const ownerData = database.constructor.extractNodeProperties({ get: () => owner }, '');
        members.push({
          user: ownerData,
          role: 'owner',
          joinedDate: null,
          status: 'active'
        });
      }

      if (member && relationship) {
        const memberData = database.constructor.extractNodeProperties({ get: () => member }, '');
        const relationshipData = database.constructor.extractRelationshipProperties({ get: () => relationship }, '');
        members.push({
          user: memberData,
          role: relationshipData.role,
          joinedDate: relationshipData.joinedDate,
          status: relationshipData.status,
          invitedBy: relationshipData.invitedBy
        });
      }
    });

    // Remove duplicates (in case owner is also a member)
    const uniqueMembers = members.filter((member, index, self) =>
      index === self.findIndex(m => m.user.id === member.user.id)
    );

    return uniqueMembers;
  }

  // Person management in tree
  static async addPerson(treeId, personId, addedBy, generation = 0, branch = null) {
    const cypher = `
      MATCH (ft:FamilyTree {id: $treeId})
      MATCH (person:Person {id: $personId})
      MERGE (person)-[r:BELONGS_TO]->(ft)
      SET r.addedDate = $addedDate,
          r.addedBy = $addedBy,
          r.generation = $generation,
          r.branch = $branch
      RETURN r
    `;

    const result = await database.runQuery(cypher, {
      treeId,
      personId,
      addedBy,
      generation,
      branch,
      addedDate: new Date().toISOString()
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to add person to tree', 500, 'ADD_PERSON_FAILED');
    }

    return database.constructor.extractRelationshipProperties(result.records[0], 'r');
  }

  static async removePerson(treeId, personId) {
    const cypher = `
      MATCH (person:Person {id: $personId})-[r:BELONGS_TO]->(ft:FamilyTree {id: $treeId})
      DELETE r
      RETURN count(r) as deletedCount
    `;

    const result = await database.runQuery(cypher, { treeId, personId });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('Person not found in tree', 404, 'PERSON_NOT_IN_TREE');
    }

    return { deletedCount };
  }

  static async getTreePeople(treeId, filters = {}) {
    let cypher = `
      MATCH (person:Person)-[r:BELONGS_TO]->(ft:FamilyTree {id: $treeId})
    `;

    const params = { treeId };
    const conditions = [];

    // Apply filters
    if (filters.generation !== undefined) {
      conditions.push('r.generation = $generation');
      params.generation = filters.generation;
    }
    if (filters.branch) {
      conditions.push('r.branch = $branch');
      params.branch = filters.branch;
    }
    if (filters.gender) {
      conditions.push('person.gender = $gender');
      params.gender = filters.gender;
    }
    if (filters.isDeceased !== undefined) {
      conditions.push('person.isDeceased = $isDeceased');
      params.isDeceased = filters.isDeceased;
    }

    if (conditions.length > 0) {
      cypher += ' WHERE ' + conditions.join(' AND ');
    }

    cypher += `
      RETURN person, r
      ORDER BY r.generation, person.firstName, person.lastName
    `;

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => {
      const person = database.constructor.extractNodeProperties(record, 'person');
      const relationship = database.constructor.extractRelationshipProperties(record, 'r');
      
      return {
        person,
        treeRelationship: relationship
      };
    });
  }

  // Tree statistics
  static async getTreeStats(treeId) {
    const cypher = `
      MATCH (ft:FamilyTree {id: $treeId})
      OPTIONAL MATCH (person:Person)-[:BELONGS_TO]->(ft)
      OPTIONAL MATCH (member:User)-[:MEMBER_OF]->(ft)
      OPTIONAL MATCH (owner:User)-[:OWNS]->(ft)
      
      WITH ft, 
           count(DISTINCT person) as totalPeople,
           count(DISTINCT member) as totalMembers,
           count(DISTINCT owner) as ownerCount
      
      OPTIONAL MATCH (person:Person)-[r:BELONGS_TO]->(ft)
      WITH ft, totalPeople, totalMembers, ownerCount,
           min(r.generation) as minGeneration,
           max(r.generation) as maxGeneration
      
      OPTIONAL MATCH (person:Person {gender: 'male'})-[:BELONGS_TO]->(ft)
      WITH ft, totalPeople, totalMembers, ownerCount, minGeneration, maxGeneration,
           count(person) as maleCount
      
      OPTIONAL MATCH (person:Person {gender: 'female'})-[:BELONGS_TO]->(ft)
      WITH ft, totalPeople, totalMembers, ownerCount, minGeneration, maxGeneration, maleCount,
           count(person) as femaleCount
      
      OPTIONAL MATCH (person:Person {isDeceased: true})-[:BELONGS_TO]->(ft)
      WITH ft, totalPeople, totalMembers, ownerCount, minGeneration, maxGeneration, 
           maleCount, femaleCount, count(person) as deceasedCount
      
      RETURN ft, totalPeople, totalMembers + ownerCount as totalUsers, 
             minGeneration, maxGeneration,
             maleCount, femaleCount, deceasedCount,
             totalPeople - deceasedCount as livingCount
    `;

    const result = await database.runQuery(cypher, { treeId });
    
    if (result.records.length === 0) {
      throw new AppError('Family tree not found', 404, 'TREE_NOT_FOUND');
    }

    const record = result.records[0];
    const tree = database.constructor.extractNodeProperties(record, 'ft');

    return {
      tree,
      stats: {
        totalPeople: record.get('totalPeople').toNumber(),
        totalUsers: record.get('totalUsers').toNumber(),
        generationSpan: {
          min: record.get('minGeneration') ? record.get('minGeneration').toNumber() : 0,
          max: record.get('maxGeneration') ? record.get('maxGeneration').toNumber() : 0
        },
        demographics: {
          male: record.get('maleCount').toNumber(),
          female: record.get('femaleCount').toNumber(),
          living: record.get('livingCount').toNumber(),
          deceased: record.get('deceasedCount').toNumber()
        }
      }
    };
  }

  // Permission checking
  static async checkUserPermission(treeId, userId, requiredPermission = 'view') {
    const cypher = `
      MATCH (ft:FamilyTree {id: $treeId})
      OPTIONAL MATCH (user:User {id: $userId})-[:OWNS]->(ft)
      OPTIONAL MATCH (user:User {id: $userId})-[r:MEMBER_OF]->(ft)
      RETURN ft.visibility as visibility, 
             CASE WHEN user IS NOT NULL THEN 'owner' ELSE null END as ownerRole,
             r.role as memberRole,
             r.status as memberStatus
    `;

    const result = await database.runQuery(cypher, { treeId, userId });
    
    if (result.records.length === 0) {
      throw new AppError('Family tree not found', 404, 'TREE_NOT_FOUND');
    }

    const record = result.records[0];
    const visibility = record.get('visibility');
    const ownerRole = record.get('ownerRole');
    const memberRole = record.get('memberRole');
    const memberStatus = record.get('memberStatus');

    // Owner has all permissions
    if (ownerRole === 'owner') {
      return { hasPermission: true, role: 'owner' };
    }

    // Active member permissions
    if (memberRole && memberStatus === 'active') {
      const rolePermissions = {
        admin: ['view', 'edit', 'delete', 'manage'],
        editor: ['view', 'edit'],
        viewer: ['view']
      };

      const hasPermission = rolePermissions[memberRole]?.includes(requiredPermission) || false;
      return { hasPermission, role: memberRole };
    }

    // Public tree view permission
    if (visibility === 'public' && requiredPermission === 'view') {
      return { hasPermission: true, role: 'public' };
    }

    return { hasPermission: false, role: null };
  }
}

module.exports = FamilyTree;