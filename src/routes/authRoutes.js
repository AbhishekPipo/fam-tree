const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Send OTP
router.post('/send-otp', [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  validateRequest
], authController.sendOTP);

// Verify OTP and login/register
router.post('/verify-otp', [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  validateRequest
], authController.verifyOTP);

// Resend OTP
router.post('/resend-otp', [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required'),
  validateRequest
], authController.resendOTP);

// Get current user profile (protected route)
router.get('/profile', authMiddleware, authController.getProfile);

// Update user profile (protected route)
router.put('/profile', [
  authMiddleware,
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  validateRequest
], authController.updateProfile);

// Logout (protected route)
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;