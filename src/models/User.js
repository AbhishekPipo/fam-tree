const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class User {
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
    
    // Family tree specific fields
    this.isAlive = data.isAlive !== undefined ? data.isAlive : true;
    this.isAppUser = data.isAppUser !== undefined ? data.isAppUser : true;
    
    // Contact & Location
    this.email = data.email || null;
    this.phone = data.phone || data.phoneNumber || null;
    this.address = data.address || {};
    this.location = data.location || null;
    
    // Profile
    this.profilePicture = data.profilePicture || null;
    this.biography = data.biography || null;
    this.occupation = data.occupation || null;
    this.employer = data.employer || null;
    
    // User-specific properties
    // Authentication
    this.password = data.password;
    this.passwordResetToken = data.passwordResetToken || null;
    this.passwordResetExpires = data.passwordResetExpires || null;
    
    // Phone Authentication
    if (data.phoneNumber) {
      this.phone = data.phoneNumber; // Map phoneNumber to phone field
    }
    this.isPhoneVerified = data.isPhoneVerified || false;
    this.phoneOtp = data.phoneOtp || null;
    this.phoneOtpExpires = data.phoneOtpExpires || null;
    this.phoneOtpAttempts = data.phoneOtpAttempts || 0;
    
    // Authorization
    this.role = data.role || 'member';
    this.permissions = data.permissions || [];
    
    // Account Status
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.isEmailVerified = data.isEmailVerified || false;
    this.emailVerificationToken = data.emailVerificationToken || null;
    
    // Profile completion
    this.hasCompletedProfile = data.hasCompletedProfile || false;
    
    // Online status
    this.isOnline = data.isOnline || false;
    this.lastSeen = data.lastSeen || null;
    
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
    
    // Subscription
    this.subscriptionType = data.subscriptionType || 'free';
    this.subscriptionExpires = data.subscriptionExpires || null;
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.createdBy = data.createdBy || null; // User ID who added this family member
    
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

  // Generate OTP for phone verification
  generatePhoneOtp() {
    // Generate 6-digit OTP (for now, static OTP for testing)
    this.phoneOtp = '123456'; // Static OTP for development
    this.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    this.phoneOtpAttempts = 0;
    return this.phoneOtp;
  }

  // Verify OTP
  verifyPhoneOtp(candidateOtp) {
    if (!this.phoneOtp || !this.phoneOtpExpires) {
      return false;
    }

    if (new Date() > new Date(this.phoneOtpExpires)) {
      return false; // OTP expired
    }

    if (this.phoneOtpAttempts >= 3) {
      return false; // Too many attempts
    }

    if (this.phoneOtp === candidateOtp) {
      this.isPhoneVerified = true;
      this.phoneOtp = null;
      this.phoneOtpExpires = null;
      this.phoneOtpAttempts = 0;
      return true;
    }

    this.phoneOtpAttempts += 1;
    return false;
  }

  // Clear OTP data
  clearPhoneOtp() {
    this.phoneOtp = null;
    this.phoneOtpExpires = null;
    this.phoneOtpAttempts = 0;
  }

  // Get full name
  getFullName() {
    return this.middleName
      ? `${this.firstName} ${this.middleName} ${this.lastName}`
      : `${this.firstName} ${this.lastName}`;
  }

  // Getter for phoneNumber (for API compatibility)
  get phoneNumber() {
    return this.phone;
  }

  // Setter for phoneNumber (for API compatibility)
  set phoneNumber(value) {
    this.phone = value;
  }

  // Convert to JSON (exclude sensitive fields)
  toJSON() {
    const userObject = { ...this };
    // Remove sensitive fields from JSON output
    delete userObject.password;
    delete userObject.passwordResetToken;
    delete userObject.sessionTokens;
    delete userObject.phoneOtp;
    return userObject;
  }

  // Validation
  validate() {
    const errors = [];

    // Required fields
    if (!this.firstName) {
      errors.push('First name is required');
    }
    if (!this.lastName) {
      errors.push('Last name is required');
    }
    if (!this.gender) {
      errors.push('Gender is required');
    }

    // User-specific validation - either email or phone number is required
    if (!this.email && !this.phone) {
      errors.push('Either email or phone number is required for users');
    }

    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Valid email format is required');
    }

    if (this.phone && !this.isValidPhoneNumber(this.phone)) {
      errors.push('Valid phone number format is required');
    }

    // Password is optional for phone-only registration
    if (this.password && this.password.length < 6) {
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

  // Helper methods for validation
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[\d\s\-()]{10,15}$/;
    return phoneRegex.test(phone);
  }

  // Save user to Neo4j
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    // Only hash password if it exists
    if (this.password) {
      await this.hashPassword();
    }
    this.updatedAt = new Date().toISOString();

    // Prepare properties for Neo4j storage (only primitive types)
    const properties = {};
    
    // Copy primitive properties
    const primitiveFields = [
      'id', 'firstName', 'middleName', 'lastName', 'email', 'phone', 
      'gender', 'dateOfBirth', 'dateOfDeath', 'isDeceased',
      'profilePicture', 'height', 'eyeColor', 'hairColor', 'bloodType',
      'isOnline', 'lastSeen', 'hasMedication', 'staysWithUser',
      'role', 'isActive', 'isEmailVerified', 'emailVerificationToken',
      'isPhoneVerified', 'phoneOtp', 'phoneOtpExpires', 'phoneOtpAttempts',
      'passwordResetToken', 'passwordResetExpires', 'subscriptionType',
      'createdAt', 'updatedAt', 'isAlive', 'isAppUser', 'createdBy'
    ];
    
    primitiveFields.forEach(field => {
      if (this[field] !== undefined && this[field] !== null) {
        properties[field] = this[field];
      }
    });
    
    // Add password if it exists
    if (this.password) {
      properties.password = this.password;
    }
    
    // Convert complex objects to JSON strings for Neo4j storage
    if (this.preferences && typeof this.preferences === 'object') {
      properties.preferences = JSON.stringify(this.preferences);
    }
    if (this.address && typeof this.address === 'object') {
      properties.address = JSON.stringify(this.address);
    }
    if (this.socialProfiles && typeof this.socialProfiles === 'object') {
      properties.socialProfiles = JSON.stringify(this.socialProfiles);
    }
    if (this.medications && Array.isArray(this.medications)) {
      properties.medications = JSON.stringify(this.medications);
    }
    if (this.medicalConditions && Array.isArray(this.medicalConditions)) {
      properties.medicalConditions = JSON.stringify(this.medicalConditions);
    }
    if (this.allergies && Array.isArray(this.allergies)) {
      properties.allergies = JSON.stringify(this.allergies);
    }
    if (this.permissions && Array.isArray(this.permissions)) {
      properties.permissions = JSON.stringify(this.permissions);
    }

    // Check if user already exists
    const existingUser = await User.findById(this.id);
    
    let cypher, params;
    if (existingUser) {
      // Update existing user
      cypher = `
        MATCH (u:User {id: $id})
        SET u += $properties
        RETURN u
      `;
      params = { id: this.id, properties };
    } else {
      // Create new user - set properties individually to avoid Map{} issues
      const setParts = Object.keys(properties).map(key => `u.${key} = $${key}`).join(', ');
      cypher = `
        CREATE (u:User {id: $id})
        SET ${setParts}
        RETURN u
      `;
      params = { id: this.id, ...properties };
    }

    const result = await database.runQuery(cypher, params);

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

  static async findByPhoneNumber(phoneNumber) {
    const cypher = 'MATCH (u:User {phone: $phoneNumber}) RETURN u';
    const result = await database.runQuery(cypher, { phoneNumber });
    
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
