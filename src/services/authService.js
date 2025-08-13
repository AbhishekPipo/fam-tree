const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const validationService = require('./validationService');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} - Created user and token
   */
  async register(userData) {
    // Validate input data
    const validatedData = validationService.validateRegistrationData(userData);
    
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      dateOfBirth,
      gender,
      location,
      fatherId,
      motherId
    } = validatedData;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Validate parent references if provided
    await this._validateParentReferences(fatherId, motherId);

    // Create new user
    const user = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      password,
      dateOfBirth,
      gender,
      location,
      fatherId,
      motherId,
      isOnline: true
    });

    // Generate JWT token
    const token = generateToken(user.id);

    return { user, token };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} - User and token
   */
  async login(email, password) {
    // Validate input data
    const validatedData = validationService.validateLoginData({ email, password });
    
    // Find user by email
    const user = await User.findOne({ 
      where: { email: validatedData.email },
      attributes: { include: ['password'] }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(validatedData.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Update user online status
    await user.update({ isOnline: true });

    // Generate JWT token
    const token = generateToken(user.id);

    // Remove password from response
    const userResponse = user.toJSON();

    return { user: userResponse, token };
  }

  /**
   * Logout user
   * @param {Object} user - User object
   */
  async logout(user) {
    await user.update({ isOnline: false });
  }

  /**
   * Get user profile with relationships
   * @param {number} userId - User ID
   * @returns {Object} - User profile
   */
  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      include: [
        { model: User, as: 'father', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'mother', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  /**
   * Update user profile
   * @param {Object} user - User object
   * @param {Object} updateData - Data to update
   * @returns {Object} - Updated user
   */
  async updateProfile(user, updateData) {
    // Validate and filter update data
    const filteredData = validationService.validateProfileUpdateData(updateData);

    // Update user
    await user.update(filteredData);

    // Fetch updated user with associations
    const updatedUser = await User.findByPk(user.id, {
      include: [
        { model: User, as: 'father', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'mother', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    return updatedUser;
  }

  /**
   * Delete user account
   * @param {Object} user - User object
   */
  async deleteAccount(user) {
    // Note: In a real application, you might want to soft delete or archive
    // instead of hard delete to maintain data integrity
    await user.destroy();
  }

  /**
   * Validate parent references
   * @private
   * @param {number} fatherId - Father ID
   * @param {number} motherId - Mother ID
   */
  async _validateParentReferences(fatherId, motherId) {
    if (fatherId) {
      const father = await User.findByPk(fatherId);
      if (!father) {
        throw new AppError('Father not found', 404, 'FATHER_NOT_FOUND');
      }
      if (father.gender && father.gender !== 'male') {
        throw new AppError('Father must be male', 400, 'INVALID_FATHER_GENDER');
      }
    }

    if (motherId) {
      const mother = await User.findByPk(motherId);
      if (!mother) {
        throw new AppError('Mother not found', 404, 'MOTHER_NOT_FOUND');
      }
      if (mother.gender && mother.gender !== 'female') {
        throw new AppError('Mother must be female', 400, 'INVALID_MOTHER_GENDER');
      }
    }
  }
}

module.exports = new AuthService();