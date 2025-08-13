const { AppError } = require('../middleware/errorHandler');

/**
 * Base service class with common functionality
 */
class BaseService {
  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @param {Array} requiredFields - Array of required field names
   * @throws {AppError} - If validation fails
   */
  validateRequiredFields(data, requiredFields) {
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missingFields.length > 0) {
      throw new AppError(
        `Missing required fields: ${missingFields.join(', ')}`,
        400,
        'MISSING_REQUIRED_FIELDS'
      );
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @throws {AppError} - If email is invalid
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400, 'INVALID_EMAIL');
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @throws {AppError} - If password is weak
   */
  validatePassword(password) {
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400, 'WEAK_PASSWORD');
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new AppError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        400,
        'WEAK_PASSWORD'
      );
    }
  }

  /**
   * Validate date format and range
   * @param {string} date - Date to validate
   * @param {string} fieldName - Name of the field for error messages
   * @throws {AppError} - If date is invalid
   */
  validateDate(date, fieldName = 'date') {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new AppError(`Invalid ${fieldName} format`, 400, 'INVALID_DATE');
    }

    // Check if date is not in the future (for birth dates)
    if (fieldName.toLowerCase().includes('birth') && dateObj > new Date()) {
      throw new AppError(`${fieldName} cannot be in the future`, 400, 'INVALID_DATE_RANGE');
    }
  }

  /**
   * Validate gender
   * @param {string} gender - Gender to validate
   * @throws {AppError} - If gender is invalid
   */
  validateGender(gender) {
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(gender.toLowerCase())) {
      throw new AppError('Invalid gender. Must be male, female, or other', 400, 'INVALID_GENDER');
    }
  }

  /**
   * Sanitize string input
   * @param {string} input - Input to sanitize
   * @returns {string} - Sanitized input
   */
  sanitizeString(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/\s+/g, ' ');
  }

  /**
   * Format user name
   * @param {string} firstName - First name
   * @param {string} middleName - Middle name (optional)
   * @param {string} lastName - Last name
   * @returns {string} - Formatted full name
   */
  formatFullName(firstName, middleName, lastName) {
    const parts = [firstName, middleName, lastName].filter(part => part && part.trim());
    return parts.join(' ');
  }

  /**
   * Handle database errors
   * @param {Error} error - Database error
   * @throws {AppError} - Formatted application error
   */
  handleDatabaseError(error) {
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      throw new AppError(`Validation error: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    // Handle Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'field';
      throw new AppError(`${field} already exists`, 409, 'DUPLICATE_ENTRY');
    }

    // Handle Sequelize foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      throw new AppError('Invalid reference to related record', 400, 'INVALID_REFERENCE');
    }

    // Handle other database errors
    if (error.name && error.name.startsWith('Sequelize')) {
      throw new AppError('Database operation failed', 500, 'DATABASE_ERROR');
    }

    // Re-throw if it's already an AppError
    if (error instanceof AppError) {
      throw error;
    }

    // Handle unknown errors
    throw new AppError('An unexpected error occurred', 500, 'INTERNAL_ERROR');
  }

  /**
   * Paginate results
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @returns {Object} - Pagination options for Sequelize
   */
  getPaginationOptions(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  }

  /**
   * Format pagination response
   * @param {Array} data - Data array
   * @param {number} total - Total count
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Object} - Formatted pagination response
   */
  formatPaginationResponse(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }
}

module.exports = BaseService;