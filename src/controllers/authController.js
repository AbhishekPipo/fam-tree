const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const database = require('../config/database');
const Joi = require('joi');
const logger = require('../config/logger');

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to phone number
 *     tags: [Authentication]
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
 *                 pattern: '^\+?[1-9]\d{1,14}$'
 *                 description: Phone number in international format
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *                         phoneNumber:
 *                           type: string
 *                         otpExpires:
 *                           type: string
 *                           format: date-time
 *                         verificationId:
 *                           type: string
 *       400:
 *         description: Invalid phone number or user already exists
 *       500:
 *         description: Internal server error
 */
const sendOtp = async (req, res, next) => {
  try {
    const { error } = Joi.object({
      phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required()
    }).validate(req.body);
    
    if (error) {
      throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findByPhoneNumber(phoneNumber);
    if (existingUser) {
      throw new AppError('User with this phone number already exists', 409, 'USER_EXISTS');
    }

    // Generate OTP
    const otp = '123456'; // Static OTP for development
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    const verificationId = require('uuid').v4();

    // Store phone verification in database
    const cypher = `
      MERGE (pv:PhoneVerification {phoneNumber: $phoneNumber})
      SET pv.otp = $otp,
          pv.otpExpires = $otpExpires,
          pv.otpAttempts = 0,
          pv.verificationId = $verificationId,
          pv.isVerified = false,
          pv.createdAt = $createdAt,
          pv.updatedAt = $updatedAt
      RETURN pv
    `;

    const result = await database.runQuery(cypher, {
      phoneNumber,
      otp,
      otpExpires,
      verificationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to send OTP', 500, 'OTP_SEND_FAILED');
    }

    // TODO: Send OTP via SMS service
    logger.info(`OTP for ${phoneNumber}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your phone number',
      data: {
        phoneNumber,
        otpExpires,
        verificationId,
        // Remove this in production
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

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
    const { error } = Joi.object({
      firstName: Joi.string().min(2).max(50).required(),
      middleName: Joi.string().min(1).max(50).optional(),
      lastName: Joi.string().min(2).max(50).required(),
      phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
      gender: Joi.string().valid('male', 'female', 'other').required(),
      dateOfBirth: Joi.date().optional()
    }).validate(req.body);
    
    if (error) {
      throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { firstName, middleName, lastName, phoneNumber, gender, dateOfBirth } = req.body;

    // Check if user already exists
    const existingUser = await User.findByPhoneNumber(phoneNumber);
    if (existingUser) {
      throw new AppError('User with this phone number already exists', 409, 'USER_EXISTS');
    }

    // Check if phone is verified
    const verificationResult = await database.runQuery(`
      MATCH (pv:PhoneVerification {phoneNumber: $phoneNumber})
      RETURN pv
    `, { phoneNumber });

    if (verificationResult.records.length === 0) {
      throw new AppError('Phone number not found. Please verify your phone number first.', 400, 'PHONE_NOT_VERIFIED');
    }

    const verificationData = database.constructor.extractNodeProperties(verificationResult.records[0], 'pv');
    
    if (!verificationData.isVerified) {
      throw new AppError('Phone number not verified. Please verify your phone number first.', 400, 'PHONE_NOT_VERIFIED');
    }

    // Create user after phone verification
    const userId = require('uuid').v4();
    const userCypher = `
      CREATE (u:User {
        id: $id,
        firstName: $firstName,
        middleName: $middleName,
        lastName: $lastName,
        phone: $phoneNumber,
        gender: $gender,
        dateOfBirth: $dateOfBirth,
        isPhoneVerified: true,
        phoneOtp: null,
        phoneOtpExpires: null,
        phoneOtpAttempts: 0,
        role: 'member',
        isActive: true,
        isEmailVerified: false,
        isOnline: true,
        hasCompletedProfile: false,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      })
      RETURN u
    `;

    const userResult = await database.runQuery(userCypher, {
      id: userId,
      firstName,
      middleName: middleName || null,
      lastName,
      phoneNumber,
      gender,
      dateOfBirth: dateOfBirth || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (userResult.records.length === 0) {
      throw new AppError('Failed to create user', 500, 'USER_CREATION_FAILED');
    }

    // Clean up phone verification record
    await database.runQuery(`
      MATCH (pv:PhoneVerification {phoneNumber: $phoneNumber})
      DELETE pv
    `, { phoneNumber });

    const newUser = database.constructor.extractNodeProperties(userResult.records[0], 'u');
    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now complete your profile.',
      data: {
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          middleName: newUser.middleName,
          lastName: newUser.lastName,
          phone: newUser.phone,
          phoneNumber: newUser.phone,
          gender: newUser.gender,
          dateOfBirth: newUser.dateOfBirth,
          isPhoneVerified: newUser.isPhoneVerified,
          hasCompletedProfile: newUser.hasCompletedProfile,
          role: newUser.role,
          isActive: newUser.isActive
        },
        token,
        requiresProfileCompletion: !newUser.hasCompletedProfile
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
    const { error } = Joi.object({
      phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
      otp: Joi.string().length(6).required()
    }).validate(req.body);
    
    if (error) {
      throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { phoneNumber, otp } = req.body;

    // First, check if this is for registration (PhoneVerification node)
    const verificationResult = await database.runQuery(`
      MATCH (pv:PhoneVerification {phoneNumber: $phoneNumber})
      RETURN pv
    `, { phoneNumber });

    if (verificationResult.records.length > 0) {
      // Handle registration OTP verification
      const verificationData = database.constructor.extractNodeProperties(verificationResult.records[0], 'pv');
      
      // Check if OTP is valid
      const currentTime = new Date();
      const otpExpiryTime = new Date(verificationData.otpExpires);
      const isOtpValid = verificationData.otp === otp && currentTime < otpExpiryTime;

      if (!isOtpValid) {
        const newAttempts = (verificationData.otpAttempts || 0) + 1;
        
        if (newAttempts >= 3) {
          // Delete verification after too many attempts
          await database.runQuery(`
            MATCH (pv:PhoneVerification {phoneNumber: $phoneNumber})
            DELETE pv
          `, { phoneNumber });
          throw new AppError('Too many invalid attempts. Please request a new OTP.', 400, 'TOO_MANY_ATTEMPTS');
        }
        
        // Update attempt count
        await database.runQuery(`
          MATCH (pv:PhoneVerification {phoneNumber: $phoneNumber})
          SET pv.otpAttempts = $attempts,
              pv.updatedAt = $updatedAt
        `, {
          phoneNumber,
          attempts: newAttempts,
          updatedAt: new Date().toISOString()
        });
        
        throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
      }

      // Mark phone as verified for registration
      await database.runQuery(`
        MATCH (pv:PhoneVerification {phoneNumber: $phoneNumber})
        SET pv.isVerified = true,
            pv.verifiedAt = $verifiedAt,
            pv.updatedAt = $updatedAt
      `, {
        phoneNumber,
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Phone number verified successfully. You can now register.',
        data: {
          phoneNumber,
          isVerified: true,
          verifiedAt: new Date().toISOString()
        }
      });
      return;
    }

    // If no PhoneVerification found, check if this is for login (User OTP)
    const userResult = await database.runQuery(`
      MATCH (u:User {phone: $phoneNumber})
      RETURN u
    `, { phoneNumber });

    if (userResult.records.length === 0) {
      throw new AppError('Phone number not found. Please send OTP first.', 404, 'PHONE_NOT_FOUND');
    }

    const userData = database.constructor.extractNodeProperties(userResult.records[0], 'u');
    
    // Check if user has OTP set
    if (!userData.phoneOtp || !userData.phoneOtpExpires) {
      throw new AppError('No OTP found for this phone number. Please request a new OTP.', 400, 'NO_OTP_FOUND');
    }

    // Check if OTP is valid for login
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
      `, {
        phoneNumber,
        attempts: newAttempts,
        updatedAt: new Date().toISOString()
      });
      
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }

    // Update user after successful login
    const updateResult = await database.runQuery(`
      MATCH (u:User {phone: $phoneNumber})
      SET u.phoneOtp = null,
          u.phoneOtpExpires = null,
          u.phoneOtpAttempts = 0,
          u.isOnline = true,
          u.lastLoginAt = $lastLoginAt,
          u.loginCount = COALESCE(u.loginCount, 0) + 1,
          u.updatedAt = $updatedAt
      RETURN u
    `, {
      phoneNumber,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const updatedUser = database.constructor.extractNodeProperties(updateResult.records[0], 'u');
    const token = generateToken(userData.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          middleName: updatedUser.middleName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          phoneNumber: updatedUser.phone,
          gender: updatedUser.gender,
          dateOfBirth: updatedUser.dateOfBirth,
          isPhoneVerified: updatedUser.isPhoneVerified,
          hasCompletedProfile: updatedUser.hasCompletedProfile,
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

/**
 * @swagger
 * /auth/complete-profile:
 *   post:
 *     summary: Complete user profile with additional details
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               location:
 *                 type: string
 *                 example: "New York, USA"
 *               occupation:
 *                 type: string
 *                 example: "Software Engineer"
 *               employer:
 *                 type: string
 *                 example: "Tech Corp"
 *               biography:
 *                 type: string
 *                 example: "A brief biography about myself"
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "123 Main St"
 *                   city:
 *                     type: string
 *                     example: "New York"
 *                   state:
 *                     type: string
 *                     example: "NY"
 *                   country:
 *                     type: string
 *                     example: "USA"
 *                   postalCode:
 *                     type: string
 *                     example: "10001"
 *               preferences:
 *                 type: object
 *                 properties:
 *                   language:
 *                     type: string
 *                     example: "en"
 *                   timezone:
 *                     type: string
 *                     example: "America/New_York"
 *                   notifications:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: boolean
 *                         example: true
 *                       push:
 *                         type: boolean
 *                         example: true
 *                       sms:
 *                         type: boolean
 *                         example: false
 *     responses:
 *       200:
 *         description: Profile completed successfully
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
const completeProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      dateOfBirth,
      location,
      occupation,
      employer,
      biography,
      address,
      preferences
    } = req.body;

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateParams = { userId, updatedAt: new Date().toISOString() };

    if (dateOfBirth !== undefined) {
      updateFields.push('u.dateOfBirth = $dateOfBirth');
      updateParams.dateOfBirth = dateOfBirth;
    }

    if (location !== undefined) {
      updateFields.push('u.location = $location');
      updateParams.location = location;
    }

    if (occupation !== undefined) {
      updateFields.push('u.occupation = $occupation');
      updateParams.occupation = occupation;
    }

    if (employer !== undefined) {
      updateFields.push('u.employer = $employer');
      updateParams.employer = employer;
    }

    if (biography !== undefined) {
      updateFields.push('u.biography = $biography');
      updateParams.biography = biography;
    }

    if (address !== undefined) {
      updateFields.push('u.address = $address');
      updateParams.address = address;
    }

    if (preferences !== undefined) {
      updateFields.push('u.preferences = $preferences');
      updateParams.preferences = preferences;
    }

    // Always mark profile as completed
    updateFields.push('u.hasCompletedProfile = true');

    if (updateFields.length === 1) { // Only hasCompletedProfile was added
      throw new AppError('At least one profile field must be provided', 400, 'NO_FIELDS_PROVIDED');
    }

    const updateQuery = `
      MATCH (u:User {id: $userId})
      SET ${updateFields.join(', ')},
          u.updatedAt = $updatedAt
      RETURN u
    `;

    const result = await database.runQuery(updateQuery, updateParams);

    if (result.records.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const updatedUser = database.constructor.extractNodeProperties(result.records[0], 'u');

    res.json({
      success: true,
      message: 'Profile completed successfully',
      data: {
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          middleName: updatedUser.middleName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          phoneNumber: updatedUser.phone,
          gender: updatedUser.gender,
          dateOfBirth: updatedUser.dateOfBirth,
          location: updatedUser.location,
          occupation: updatedUser.occupation,
          employer: updatedUser.employer,
          biography: updatedUser.biography,
          address: updatedUser.address,
          preferences: updatedUser.preferences,
          isPhoneVerified: updatedUser.isPhoneVerified,
          hasCompletedProfile: updatedUser.hasCompletedProfile,
          role: updatedUser.role,
          isActive: updatedUser.isActive
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clean up expired pending registrations
 * This should be called periodically (e.g., via a cron job)
 */
const cleanupExpiredRegistrations = async () => {
  try {
    const result = await database.runQuery(`
      MATCH (r:PendingRegistration)
      WHERE r.expiresAt < $currentTime
      DELETE r
      RETURN count(r) as deletedCount
    `, {
      currentTime: new Date().toISOString()
    });

    const deletedCount = result.records[0]?.get('deletedCount')?.toNumber() || 0;
    console.log(`Cleaned up ${deletedCount} expired pending registrations`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired registrations:', error);
    throw error;
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  register,
  completeProfile,
  login,
  logout,
  getProfile,
  updateProfile,
  resendOtp,
  cleanupExpiredRegistrations
};
