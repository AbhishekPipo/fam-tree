const BaseService = require('./baseService');
const { AppError } = require('../middleware/errorHandler');

class ValidationService extends BaseService {
  /**
   * Validate user registration data
   * @param {Object} userData - User registration data
   * @throws {AppError} - If validation fails
   */
  validateRegistrationData(userData) {
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'dateOfBirth', 'gender'];
    this.validateRequiredFields(userData, requiredFields);

    // Validate email format
    this.validateEmail(userData.email);

    // Validate password strength
    this.validatePassword(userData.password);

    // Validate date of birth
    this.validateDate(userData.dateOfBirth, 'dateOfBirth');

    // Validate gender
    this.validateGender(userData.gender);

    // Sanitize string inputs
    userData.firstName = this.sanitizeString(userData.firstName);
    userData.lastName = this.sanitizeString(userData.lastName);
    if (userData.middleName) {
      userData.middleName = this.sanitizeString(userData.middleName);
    }
    if (userData.location) {
      userData.location = this.sanitizeString(userData.location);
    }

    return userData;
  }

  /**
   * Validate user login data
   * @param {Object} loginData - User login data
   * @throws {AppError} - If validation fails
   */
  validateLoginData(loginData) {
    const requiredFields = ['email', 'password'];
    this.validateRequiredFields(loginData, requiredFields);

    // Validate email format
    this.validateEmail(loginData.email);

    return loginData;
  }

  /**
   * Validate family member data
   * @param {Object} memberData - Family member data
   * @throws {AppError} - If validation fails
   */
  validateFamilyMemberData(memberData) {
    const requiredFields = ['firstName', 'lastName', 'email', 'dateOfBirth', 'gender', 'relationshipType'];
    this.validateRequiredFields(memberData, requiredFields);

    // Validate email format
    this.validateEmail(memberData.email);

    // Validate date of birth
    this.validateDate(memberData.dateOfBirth, 'dateOfBirth');

    // Validate gender
    this.validateGender(memberData.gender);

    // Validate relationship type
    this.validateRelationshipType(memberData.relationshipType);

    // Sanitize string inputs
    memberData.firstName = this.sanitizeString(memberData.firstName);
    memberData.lastName = this.sanitizeString(memberData.lastName);
    if (memberData.middleName) {
      memberData.middleName = this.sanitizeString(memberData.middleName);
    }
    if (memberData.location) {
      memberData.location = this.sanitizeString(memberData.location);
    }

    return memberData;
  }

  /**
   * Validate relationship type
   * @param {string} relationshipType - Relationship type to validate
   * @throws {AppError} - If relationship type is invalid
   */
  validateRelationshipType(relationshipType) {
    const validRelationshipTypes = [
      // Direct relationships
      'husband', 'wife', 'partner',
      // Parents
      'father', 'mother', 'adoptive-father', 'adoptive-mother', 'stepfather', 'stepmother',
      // Children
      'son', 'daughter', 'adopted-son', 'adopted-daughter', 'stepson', 'stepdaughter',
      // Siblings
      'brother', 'sister', 'half-brother', 'half-sister', 'stepbrother', 'stepsister',
      // Grandparents
      'grandfather', 'grandmother', 'step-grandfather', 'step-grandmother',
      // Grandchildren
      'grandson', 'granddaughter', 'step-grandson', 'step-granddaughter',
      // Extended family
      'uncle', 'aunt', 'nephew', 'niece', 'cousin',
      'great-grandfather', 'great-grandmother', 'great-grandson', 'great-granddaughter'
    ];

    if (!validRelationshipTypes.includes(relationshipType.toLowerCase())) {
      throw new AppError('Invalid relationship type', 400, 'INVALID_RELATIONSHIP_TYPE');
    }
  }

  /**
   * Validate profile update data
   * @param {Object} updateData - Profile update data
   * @returns {Object} - Sanitized update data
   */
  validateProfileUpdateData(updateData) {
    const allowedFields = [
      'firstName',
      'middleName', 
      'lastName',
      'dateOfBirth',
      'gender',
      'location',
      'hasMedication',
      'medicationName',
      'medicationFrequency',
      'medicationTime',
      'staysWithUser'
    ];

    // Filter only allowed fields
    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    // Validate individual fields if they exist
    if (filteredData.dateOfBirth) {
      this.validateDate(filteredData.dateOfBirth, 'dateOfBirth');
    }

    if (filteredData.gender) {
      this.validateGender(filteredData.gender);
    }

    // Sanitize string inputs
    ['firstName', 'middleName', 'lastName', 'location', 'medicationName'].forEach(field => {
      if (filteredData[field]) {
        filteredData[field] = this.sanitizeString(filteredData[field]);
      }
    });

    return filteredData;
  }

  /**
   * Validate pagination parameters
   * @param {Object} params - Pagination parameters
   * @returns {Object} - Validated pagination parameters
   */
  validatePaginationParams(params) {
    const { page = 1, limit = 10 } = params;

    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

    return {
      page: validatedPage,
      limit: validatedLimit
    };
  }

  /**
   * Validate ID parameter
   * @param {string|number} id - ID to validate
   * @param {string} fieldName - Name of the field for error messages
   * @throws {AppError} - If ID is invalid
   */
  validateId(id, fieldName = 'id') {
    const numericId = parseInt(id);
    if (isNaN(numericId) || numericId <= 0) {
      throw new AppError(`Invalid ${fieldName}`, 400, 'INVALID_ID');
    }
    return numericId;
  }
}

module.exports = new ValidationService();