const express = require('express');
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  verifyOtp,
  resendOtp
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { userSchemas, validate } = require('../validation/schemas');

const router = express.Router();

// Phone authentication routes (now the main authentication method)
router.post('/register', authLimiter, validate(userSchemas.phoneRegister), register);
router.post('/login', authLimiter, validate(userSchemas.phoneLogin), login);
router.post('/verify-otp', authLimiter, validate(userSchemas.verifyOtp), verifyOtp);
router.post('/resend-otp', authLimiter, validate(userSchemas.resendOtp), resendOtp);

// Protected routes
router.use(authenticateToken);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', validate(userSchemas.updateProfile), updateProfile);

module.exports = router;