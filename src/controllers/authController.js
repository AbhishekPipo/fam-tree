const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const database = require('../config/database');





/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
const logout = async (req, res, next) => {
  try {
    // Update user online status
    await User.update(req.user.id, { isOnline: false });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               middleName:
 *                 type: string
 *                 example: "Michael"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               location:
 *                 type: string
 *                 example: "New York, USA"
 *               hasMedication:
 *                 type: boolean
 *                 example: true
 *               medicationName:
 *                 type: string
 *                 example: "Blood Pressure Medicine"
 *               medicationFrequency:
 *                 type: string
 *                 example: "Daily"
 *               medicationTime:
 *                 type: string
 *                 example: "Morning"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'firstName', 'middleName', 'lastName', 'dateOfBirth', 'location',
      'hasMedication', 'medicationName', 'medicationFrequency', 'medicationTime',
      'staysWithUser', 'phoneNumber'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // If phone number is being updated, reset phone verification
    if (updates.phoneNumber) {
      const currentUser = await User.findById(req.user.id);
      if (currentUser && currentUser.phone !== updates.phoneNumber) {
        updates.phone = updates.phoneNumber; // Map to the correct field
        updates.isPhoneVerified = false;
        updates.phoneOtp = null;
        updates.phoneOtpExpires = null;
        updates.phoneOtpAttempts = 0;
      }
      delete updates.phoneNumber; // Remove the API field, use phone instead
    }

    const user = await User.update(req.user.id, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user with phone number
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - phoneNumber
 *               - gender
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               middleName:
 *                 type: string
 *                 example: "Michael"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: "male"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *     responses:
 *       201:
 *         description: OTP sent successfully for registration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent to your phone number"
 *                 data:
 *                   type: object
 *                   properties:
 *                     phoneNumber:
 *                       type: string
 *                       example: "+1234567890"
 *                     otpExpires:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
const register = async (req, res, next) => {
  try {
    const { firstName, middleName, lastName, phoneNumber, gender, dateOfBirth } = req.body;

    // Check if user already exists
    const existingUser = await User.findByPhoneNumber(phoneNumber);
    if (existingUser) {
      throw new AppError('User with this phone number already exists', 409, 'USER_EXISTS');
    }

    // Generate OTP and expiry
    const otp = '123456'; // Static OTP for development
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    const userId = require('uuid').v4();

    // Create user directly in database with minimal fields
    const cypher = `
      CREATE (u:User:Person {
        id: $id,
        firstName: $firstName,
        middleName: $middleName,
        lastName: $lastName,
        phone: $phoneNumber,
        gender: $gender,
        dateOfBirth: $dateOfBirth,
        isPhoneVerified: false,
        phoneOtp: $otp,
        phoneOtpExpires: $otpExpires,
        phoneOtpAttempts: 0,
        role: 'member',
        isActive: true,
        isEmailVerified: false,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      })
      RETURN u
    `;

    const result = await database.runQuery(cypher, {
      id: userId,
      firstName,
      middleName: middleName || null,
      lastName,
      phoneNumber,
      gender,
      dateOfBirth: dateOfBirth || null,
      otp,
      otpExpires,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to create user', 500, 'USER_CREATION_FAILED');
    }

    // In production, you would send the OTP via SMS service
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    res.status(201).json({
      success: true,
      message: 'OTP sent to your phone number',
      data: {
        phoneNumber,
        otpExpires,
        // For development only - remove in production
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with phone number
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent to your phone number"
 *                 data:
 *                   type: object
 *                   properties:
 *                     phoneNumber:
 *                       type: string
 *                       example: "+1234567890"
 *                     otpExpires:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: User not found
 */
const login = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    // Find user by phone number
    const userData = await User.findByPhoneNumber(phoneNumber);
    if (!userData) {
      throw new AppError('User with this phone number not found', 404, 'USER_NOT_FOUND');
    }

    // Generate new OTP
    const otp = '123456'; // Static OTP for development
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    
    // Update user with new OTP
    await database.runQuery(`
      MATCH (u:User {phone: $phoneNumber})
      SET u.phoneOtp = $otp,
          u.phoneOtpExpires = $otpExpires,
          u.phoneOtpAttempts = 0,
          u.updatedAt = $updatedAt
      RETURN u
    `, {
      phoneNumber,
      otp,
      otpExpires,
      updatedAt: new Date().toISOString()
    });

    // In production, you would send the OTP via SMS service
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent to your phone number',
      data: {
        phoneNumber,
        otpExpires,
        // For development only - remove in production
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP and complete authentication
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               password:
 *                 type: string
 *                 example: "SecurePass123!"
 *                 description: "Required for new registrations"
 *               isRegistration:
 *                 type: boolean
 *                 example: false
 *                 description: "Set to true if this is completing a registration"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { phoneNumber, otp, password, isRegistration } = req.body;

    // Find user by phone number
    const findResult = await database.runQuery(`
      MATCH (u:User {phone: $phoneNumber})
      RETURN u
    `, { phoneNumber });

    if (findResult.records.length === 0) {
      throw new AppError('User with this phone number not found', 404, 'USER_NOT_FOUND');
    }

    const userData = database.constructor.extractNodeProperties(findResult.records[0], 'u');
    
    // Check if OTP is valid
    const currentTime = new Date();
    const otpExpiryTime = new Date(userData.phoneOtpExpires);
    const isOtpValid = userData.phoneOtp === otp && currentTime < otpExpiryTime;

    if (!isOtpValid) {
      const newAttempts = (userData.phoneOtpAttempts || 0) + 1;
      
      if (newAttempts >= 3) {
        // Clear OTP after too many attempts
        await database.runQuery(`
          MATCH (u:User {phone: $phoneNumber})
          SET u.phoneOtp = null,
              u.phoneOtpExpires = null,
              u.phoneOtpAttempts = 0,
              u.updatedAt = $updatedAt
          RETURN u
        `, {
          phoneNumber,
          updatedAt: new Date().toISOString()
        });
        throw new AppError('Too many invalid attempts. Please request a new OTP.', 400, 'TOO_MANY_ATTEMPTS');
      }
      
      // Update attempt count
      await database.runQuery(`
        MATCH (u:User {phone: $phoneNumber})
        SET u.phoneOtpAttempts = $attempts,
            u.updatedAt = $updatedAt
        RETURN u
      `, {
        phoneNumber,
        attempts: newAttempts,
        updatedAt: new Date().toISOString()
      });
      
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    // Prepare update query
    let updateQuery = `
      MATCH (u:User {phone: $phoneNumber})
      SET u.isPhoneVerified = true,
          u.phoneOtp = null,
          u.phoneOtpExpires = null,
          u.phoneOtpAttempts = 0,
          u.isOnline = true,
          u.updatedAt = $updatedAt
    `;
    
    const updateParams = {
      phoneNumber,
      updatedAt: new Date().toISOString()
    };

    // If this is a registration, set the password
    if (isRegistration && password) {
      const hashedPassword = await require('bcryptjs').hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
      updateQuery += `, u.password = $password`;
      updateParams.password = hashedPassword;
    }

    updateQuery += ` RETURN u`;

    // Update user
    const updateResult = await database.runQuery(updateQuery, updateParams);
    const updatedUser = database.constructor.extractNodeProperties(updateResult.records[0], 'u');

    // Generate token
    const token = generateToken(userData.id);

    res.json({
      success: true,
      message: isRegistration ? 'Registration completed successfully' : 'Login successful',
      data: {
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          phoneNumber: updatedUser.phone, // For API compatibility
          gender: updatedUser.gender,
          isPhoneVerified: updatedUser.isPhoneVerified,
          role: updatedUser.role,
          isActive: updatedUser.isActive
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP to phone number
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP resent to your phone number"
 *                 data:
 *                   type: object
 *                   properties:
 *                     phoneNumber:
 *                       type: string
 *                       example: "+1234567890"
 *                     otpExpires:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: User not found
 */
const resendOtp = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    // Find user by phone number
    const userData = await User.findByPhoneNumber(phoneNumber);
    if (!userData) {
      throw new AppError('User with this phone number not found', 404, 'USER_NOT_FOUND');
    }

    // Generate new OTP
    const otp = '123456'; // Static OTP for development
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    
    // Update user with new OTP using direct database query
    await database.runQuery(`
      MATCH (u:User {phone: $phoneNumber})
      SET u.phoneOtp = $otp,
          u.phoneOtpExpires = $otpExpires,
          u.phoneOtpAttempts = 0,
          u.updatedAt = $updatedAt
      RETURN u
    `, {
      phoneNumber,
      otp,
      otpExpires,
      updatedAt: new Date().toISOString()
    });

    // In production, you would send the OTP via SMS service
    console.log(`Resent OTP for ${phoneNumber}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP resent to your phone number',
      data: {
        phoneNumber,
        otpExpires,
        // For development only - remove in production
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  verifyOtp,
  resendOtp
};