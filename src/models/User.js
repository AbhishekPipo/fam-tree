const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.firstName = data.firstName;
    this.middleName = data.middleName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.password = data.password;
    this.dateOfBirth = data.dateOfBirth;
    this.gender = data.gender;
    this.location = data.location;
    this.profilePicture = data.profilePicture;
    this.hasMedication = data.hasMedication || false;
    this.medicationName = data.medicationName;
    this.medicationFrequency = data.medicationFrequency;
    this.medicationTime = data.medicationTime;
    this.isOnline = data.isOnline || false;
    this.isDeceased = data.isDeceased || false;
    this.staysWithUser = data.staysWithUser || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Hash password before saving
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    }
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Get full name
  getFullName() {
    return this.middleName 
      ? `${this.firstName} ${this.middleName} ${this.lastName}`
      : `${this.firstName} ${this.lastName}`;
  }

  // Convert to JSON (exclude password)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  // Save user to Neo4j
  async save() {
    await this.hashPassword();
    this.updatedAt = new Date().toISOString();

    const cypher = `
      MERGE (u:User {id: $id})
      SET u += $properties
      RETURN u
    `;

    const result = await database.runQuery(cypher, {
      id: this.id,
      properties: this.toJSON()
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to save user', 500, 'SAVE_FAILED');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'u');
  }

  // Static methods
  static async findById(id) {
    const cypher = 'MATCH (u:User {id: $id}) RETURN u';
    const result = await database.runQuery(cypher, { id });
    
    if (result.records.length === 0) {
      return null;
    }

    return database.constructor.extractNodeProperties(result.records[0], 'u');
  }

  static async findByEmail(email) {
    const cypher = 'MATCH (u:User {email: $email}) RETURN u';
    const result = await database.runQuery(cypher, { email });
    
    if (result.records.length === 0) {
      return null;
    }

    return database.constructor.extractNodeProperties(result.records[0], 'u');
  }

  static async findAll() {
    const cypher = 'MATCH (u:User) RETURN u ORDER BY u.firstName, u.lastName';
    const result = await database.runQuery(cypher);
    
    return result.records.map(record => 
      database.constructor.extractNodeProperties(record, 'u')
    );
  }

  static async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  static async update(id, updateData) {
    updateData.updatedAt = new Date().toISOString();
    
    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(
        updateData.password, 
        parseInt(process.env.BCRYPT_ROUNDS) || 12
      );
    }

    const cypher = `
      MATCH (u:User {id: $id})
      SET u += $properties
      RETURN u
    `;

    const result = await database.runQuery(cypher, {
      id,
      properties: updateData
    });

    if (result.records.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'u');
  }

  static async delete(id) {
    const cypher = `
      MATCH (u:User {id: $id})
      DETACH DELETE u
      RETURN count(u) as deletedCount
    `;

    const result = await database.runQuery(cypher, { id });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return { deletedCount };
  }

  // Get user's family relationships
  static async getFamilyRelationships(userId) {
    const cypher = `
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[r]-(related:User)
      RETURN u, r, related
    `;

    const result = await database.runQuery(cypher, { userId });
    
    if (result.records.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const user = database.constructor.extractNodeProperties(result.records[0], 'u');
    const relationships = [];

    result.records.forEach(record => {
      const relationship = record.get('r');
      const relatedUser = record.get('related');
      
      if (relationship && relatedUser) {
        relationships.push({
          relationship: database.constructor.extractRelationshipProperties(record, 'r'),
          relatedUser: database.constructor.extractNodeProperties(record, 'related')
        });
      }
    });

    return { user, relationships };
  }
}

module.exports = User;