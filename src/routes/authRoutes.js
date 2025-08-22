const express = require('express');
const {
  sendOtp,
  verifyOtp,
  register,
  completeProfile,
  login,
  logout,
  getProfile,
  updateProfile,
  resendOtp
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { userSchemas, validate } = require('../validation/schemas');

const router = express.Router();

// New authentication flow
router.post('/send-otp', authLimiter, sendOtp);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/register', authLimiter, register);

// Legacy phone authentication routes (for backward compatibility)
router.post('/login', authLimiter, validate(userSchemas.phoneLogin), login);
router.post('/resend-otp', authLimiter, validate(userSchemas.resendOtp), resendOtp);

// Protected routes
router.use(authenticateToken);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', validate(userSchemas.updateProfile), updateProfile);
router.post('/complete-profile', validate(userSchemas.completeProfile), completeProfile);

module.exports = router;
