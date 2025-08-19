const express = require('express');
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { userSchemas, validate } = require('../validation/schemas');

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, validate(userSchemas.register), register);
router.post('/login', authLimiter, validate(userSchemas.login), login);

// Protected routes
router.use(authenticateToken);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', validate(userSchemas.updateProfile), updateProfile);

module.exports = router;