const { body, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  
  body('middleName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Middle name must not exceed 50 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date in YYYY-MM-DD format'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters'),

  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// Family member addition validation
const validateFamilyMember = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  
  body('middleName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Middle name must not exceed 50 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date in YYYY-MM-DD format'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('relationshipType')
    .notEmpty()
    .withMessage('Relationship type is required')
    .custom(async (value) => {
      const { RelationshipType } = require('../models');
      
      // Check if the relationship type exists in our database
      const relationshipType = await RelationshipType.findOne({
        where: {
          name: value,
          isActive: true
        }
      });
      
      if (!relationshipType) {
        throw new Error(`Invalid relationship type: ${value}. Please use a valid relationship type.`);
      }
      
      return true;
    }),

  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  
  body('middleName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Middle name must not exceed 50 characters'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date in YYYY-MM-DD format'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters'),
  
  body('hasMedication')
    .optional()
    .isBoolean()
    .withMessage('Has medication must be a boolean value'),
  
  body('medicationName')
    .optional()
    .trim(),
  
  body('medicationFrequency')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Medication frequency must not exceed 50 characters'),
  
  body('medicationTime')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Medication time must not exceed 50 characters'),

  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateFamilyMember,
  validateProfileUpdate,
  handleValidationErrors
};
