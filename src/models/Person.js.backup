const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class Person {
  constructor(data) {
    // Identity
    this.id = data.id || uuidv4();
    
    // Personal Information
    this.firstName = data.firstName;
    this.middleName = data.middleName || null;
    this.lastName = data.lastName;
    
    // Demographics
    this.gender = data.gender;
    this.dateOfBirth = data.dateOfBirth || null;
    this.dateOfDeath = data.dateOfDeath || null;
    this.isDeceased = data.isDeceased || false;
    
    // Contact & Location
    this.email = data.email || null;
    this.phone = data.phone || null;
    this.address = data.address || {};
    this.currentLocation = data.currentLocation || null;
    
    // Physical Attributes
    this.profilePicture = data.profilePicture || null;
    this.height = data.height || null;
    this.eyeColor = data.eyeColor || null;
    this.hairColor = data.hairColor || null;
    
    // Medical Information
    this.hasMedication = data.hasMedication || false;
    this.medications = data.medications || [];
    this.medicalConditions = data.medicalConditions || [];
    this.allergies = data.allergies || [];
    this.bloodType = data.bloodType || null;
    
    // Social & Digital
    this.isOnline = data.isOnline || false;
    this.lastSeen = data.lastSeen || null;
    this.socialProfiles = data.socialProfiles || {};
    
    // Living Situation
    this.staysWithUser = data.staysWithUser || false;
    this.livingArrangement = data.livingArrangement || 'independent';
    
    // Professional
    this.occupation = data.occupation || null;
    this.employer = data.employer || null;
    this.education = data.education || [];
    
    // Metadata
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.createdBy = data.createdBy || null;
    this.lastModifiedBy = data.lastModifiedBy || null;
    
    // Privacy & Access
    this.visibility = data.visibility || 'family';
    this.isVerified = data.isVerified || false;
    
    // Additional Notes
    this.biography = data.biography || null;
    this.notes = data.notes || null;
    this.tags = data.tags || [];
  }

  // Computed properties
  getFullName() {
    return this.middleName 
      ? `${this.firstName} ${this.middleName} ${this.lastName}`
      : `${this.firstName} ${this.lastName}`;
  }

  getAge() {
    if (!this.dateOfBirth) return null;
    
    const endDate = this.isDeceased && this.dateOfDeath 
      ? new Date(this.dateOfDeath) 
      : new Date();
    
    const birthDate = new Date(this.dateOfBirth);
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  isAlive() {
    return !this.isDeceased;
  }

  // Validation
  validate() {
    const errors = [];

    if (!this.firstName || this.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!this.lastName || this.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (!this.gender || !['male', 'female', 'other'].includes(this.gender)) {
      errors.push('Valid gender is required (male, female, other)');
    }

    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Invalid email format');
    }

    if (this.dateOfBirth && new Date(this.dateOfBirth) > new Date()) {
      errors.push('Date of birth cannot be in the future');
    }

    if (this.dateOfDeath && this.dateOfBirth && 
        new Date(this.dateOfDeath) < new Date(this.dateOfBirth)) {
      errors.push('Date of death cannot be before date of birth');
    }

    if (!['public', 'family', 'private'].includes(this.visibility)) {
      errors.push('Invalid visibility setting');
    }

    if (!['independent', 'assisted', 'family', 'other'].includes(this.livingArrangement)) {
      errors.push('Invalid living arrangement');
    }

    return errors;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Convert to JSON (for API responses)
  toJSON() {
    const json = { ...this };
    json.fullName = this.getFullName();
    json.age = this.getAge();
    json.isAlive = this.isAlive();
    return json;
  }

  // Save person to Neo4j
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    this.updatedAt = new Date().toISOString();

    const cypher = `
      MERGE (p:Person {id: $id})
      SET p += $properties
      RETURN p
    `;

    const result = await database.runQuery(cypher, {
      id: this.id,
      properties: this.toJSON()
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to save person', 500, 'SAVE_FAILED');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'p');
  }

  // Static methods
  static async findById(id) {
    const cypher = 'MATCH (p:Person {id: $id}) RETURN p';
    const result = await database.runQuery(cypher, { id });
    
    if (result.records.length === 0) {
      return null;
    }

    return database.constructor.extractNodeProperties(result.records[0], 'p');
  }

  static async findByEmail(email) {
    const cypher = 'MATCH (p:Person {email: $email}) RETURN p';
    const result = await database.runQuery(cypher, { email });
    
    if (result.records.length === 0) {
      return null;
    }

    return database.constructor.extractNodeProperties(result.records[0], 'p');
  }

  static async findAll(filters = {}) {
    let cypher = 'MATCH (p:Person)';
    const params = {};

    // Apply filters
    const conditions = [];
    if (filters.gender) {
      conditions.push('p.gender = $gender');
      params.gender = filters.gender;
    }
    if (filters.isDeceased !== undefined) {
      conditions.push('p.isDeceased = $isDeceased');
      params.isDeceased = filters.isDeceased;
    }
    if (filters.visibility) {
      conditions.push('p.visibility = $visibility');
      params.visibility = filters.visibility;
    }

    if (conditions.length > 0) {
      cypher += ' WHERE ' + conditions.join(' AND ');
    }

    cypher += ' RETURN p ORDER BY p.firstName, p.lastName';

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => 
      database.constructor.extractNodeProperties(record, 'p')
    );
  }

  static async search(searchTerm) {
    const cypher = `
      CALL db.index.fulltext.queryNodes('person_search_index', $searchTerm)
      YIELD node, score
      RETURN node as p, score
      ORDER BY score DESC
      LIMIT 50
    `;

    const result = await database.runQuery(cypher, { searchTerm });
    
    return result.records.map(record => ({
      person: database.constructor.extractNodeProperties(record, 'p'),
      score: record.get('score')
    }));
  }

  static async create(personData) {
    const person = new Person(personData);
    return await person.save();
  }

  static async update(id, updateData) {
    updateData.updatedAt = new Date().toISOString();

    const cypher = `
      MATCH (p:Person {id: $id})
      SET p += $properties
      RETURN p
    `;

    const result = await database.runQuery(cypher, {
      id,
      properties: updateData
    });

    if (result.records.length === 0) {
      throw new AppError('Person not found', 404, 'PERSON_NOT_FOUND');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'p');
  }

  static async delete(id) {
    const cypher = `
      MATCH (p:Person {id: $id})
      DETACH DELETE p
      RETURN count(p) as deletedCount
    `;

    const result = await database.runQuery(cypher, { id });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('Person not found', 404, 'PERSON_NOT_FOUND');
    }

    return { deletedCount };
  }

  // Relationship methods
  static async getRelationships(personId) {
    const cypher = `
      MATCH (p:Person {id: $personId})
      OPTIONAL MATCH (p)-[r]-(related:Person)
      RETURN p, r, related
    `;

    const result = await database.runQuery(cypher, { personId });
    
    if (result.records.length === 0) {
      throw new AppError('Person not found', 404, 'PERSON_NOT_FOUND');
    }

    const person = database.constructor.extractNodeProperties(result.records[0], 'p');
    const relationships = [];

    result.records.forEach(record => {
      const relationship = record.get('r');
      const relatedPerson = record.get('related');
      
      if (relationship && relatedPerson) {
        relationships.push({
          relationship: database.constructor.extractRelationshipProperties(record, 'r'),
          relatedPerson: database.constructor.extractNodeProperties(record, 'related')
        });
      }
    });

    return { person, relationships };
  }

  static async addRelationship(fromPersonId, toPersonId, relationshipType, properties = {}) {
    // Validate relationship type
    const validTypes = [
      'PARENT_OF', 'CHILD_OF', 'SIBLING_OF', 'MARRIED_TO', 'ENGAGED_TO',
      'GRANDPARENT_OF', 'GRANDCHILD_OF', 'UNCLE_AUNT_OF', 'NEPHEW_NIECE_OF',
      'COUSIN_OF', 'IN_LAW_OF'
    ];

    if (!validTypes.includes(relationshipType)) {
      throw new AppError('Invalid relationship type', 400, 'INVALID_RELATIONSHIP_TYPE');
    }

    // Add metadata
    properties.establishedDate = properties.establishedDate || new Date().toISOString();
    properties.confidence = properties.confidence || 1.0;

    const cypher = `
      MATCH (from:Person {id: $fromPersonId})
      MATCH (to:Person {id: $toPersonId})
      CREATE (from)-[r:${relationshipType} $properties]->(to)
      RETURN r
    `;

    const result = await database.runQuery(cypher, {
      fromPersonId,
      toPersonId,
      properties
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to create relationship', 500, 'RELATIONSHIP_CREATION_FAILED');
    }

    return database.constructor.extractRelationshipProperties(result.records[0], 'r');
  }

  static async removeRelationship(fromPersonId, toPersonId, relationshipType) {
    const cypher = `
      MATCH (from:Person {id: $fromPersonId})-[r:${relationshipType}]->(to:Person {id: $toPersonId})
      DELETE r
      RETURN count(r) as deletedCount
    `;

    const result = await database.runQuery(cypher, {
      fromPersonId,
      toPersonId
    });

    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('Relationship not found', 404, 'RELATIONSHIP_NOT_FOUND');
    }

    return { deletedCount };
  }

  // Family tree traversal methods
  static async getAncestors(personId, generations = 3) {
    const cypher = `
      MATCH path = (p:Person {id: $personId})-[:CHILD_OF*1..${generations}]->(ancestor:Person)
      RETURN ancestor, length(path) as generation
      ORDER BY generation, ancestor.firstName, ancestor.lastName
    `;

    const result = await database.runQuery(cypher, { personId });
    
    return result.records.map(record => ({
      person: database.constructor.extractNodeProperties(record, 'ancestor'),
      generation: record.get('generation').toNumber()
    }));
  }

  static async getDescendants(personId, generations = 3) {
    const cypher = `
      MATCH path = (p:Person {id: $personId})-[:PARENT_OF*1..${generations}]->(descendant:Person)
      RETURN descendant, length(path) as generation
      ORDER BY generation, descendant.firstName, descendant.lastName
    `;

    const result = await database.runQuery(cypher, { personId });
    
    return result.records.map(record => ({
      person: database.constructor.extractNodeProperties(record, 'descendant'),
      generation: record.get('generation').toNumber()
    }));
  }

  static async getSiblings(personId) {
    const cypher = `
      MATCH (p:Person {id: $personId})-[:SIBLING_OF]-(sibling:Person)
      RETURN sibling
      ORDER BY sibling.dateOfBirth
    `;

    const result = await database.runQuery(cypher, { personId });
    
    return result.records.map(record => 
      database.constructor.extractNodeProperties(record, 'sibling')
    );
  }

  static async getSpouse(personId) {
    const cypher = `
      MATCH (p:Person {id: $personId})-[r:MARRIED_TO]-(spouse:Person)
      WHERE r.status = 'married'
      RETURN spouse, r
    `;

    const result = await database.runQuery(cypher, { personId });
    
    if (result.records.length === 0) {
      return null;
    }

    return {
      spouse: database.constructor.extractNodeProperties(result.records[0], 'spouse'),
      marriage: database.constructor.extractRelationshipProperties(result.records[0], 'r')
    };
  }
}

module.exports = Person;