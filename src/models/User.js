const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const Person = require('./Person');

class User extends Person {
  constructor(data) {
    // Call parent constructor with person data
    super(data);
    
    // User-specific properties
    // Authentication
    this.password = data.password;
    this.passwordResetToken = data.passwordResetToken || null;
    this.passwordResetExpires = data.passwordResetExpires || null;
    
    // Authorization
    this.role = data.role || 'member';
    this.permissions = data.permissions || [];
    
    // Account Status
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.isEmailVerified = data.isEmailVerified || false;
    this.emailVerificationToken = data.emailVerificationToken || null;
    
    // Preferences
    this.preferences = data.preferences || {
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        showEmail: false,
        showPhone: false,
        showBirthDate: true
      }
    };
    
    // Session Management
    this.lastLoginAt = data.lastLoginAt || null;
    this.loginCount = data.loginCount || 0;
    this.sessionTokens = data.sessionTokens || [];
    
    // Family Tree Management
    this.ownedTrees = data.ownedTrees || [];
    this.memberOfTrees = data.memberOfTrees || [];
    
    // Subscription/Premium
    this.subscriptionType = data.subscriptionType || 'free';
    this.subscriptionExpires = data.subscriptionExpires || null;
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

  // Override parent validation to include user-specific rules
  validate() {
    const errors = super.validate(); // Call parent validation

    // User-specific validation
    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Valid email is required for users');
    }

    if (!this.password || this.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    const validRoles = ['admin', 'moderator', 'member'];
    if (!validRoles.includes(this.role)) {
      errors.push('Invalid user role');
    }

    const validSubscriptionTypes = ['free', 'premium', 'family'];
    if (!validSubscriptionTypes.includes(this.subscriptionType)) {
      errors.push('Invalid subscription type');
    }

    return errors;
  }

  // Override toJSON to exclude sensitive data
  toJSON() {
    const json = super.toJSON();
    // Remove sensitive fields from JSON output
    delete json.password;
    delete json.passwordResetToken;
    delete json.sessionTokens;
    return json;
  }

  // Save user to Neo4j with both User and Person labels
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    await this.hashPassword();
    this.updatedAt = new Date().toISOString();

    const cypher = `
      MERGE (u:User:Person {id: $id})
      SET u += $properties
      RETURN u
    `;

    const result = await database.runQuery(cypher, {
      id: this.id,
      properties: { ...this, password: this.password } // Include password for storage
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