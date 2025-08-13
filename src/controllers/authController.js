const { authService } = require('../services');
const { catchAsync } = require('../middleware/errorHandler');

// Register a new user
const register = catchAsync(async (req, res) => {
  const { user, token } = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token
    }
  });
});

// Login user
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login(email, password);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token
    }
  });
});

// Logout user
const logout = catchAsync(async (req, res) => {
  await authService.logout(req.user);

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Get current user profile
const getProfile = catchAsync(async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  res.json({
    success: true,
    data: { user }
  });
});

// Update user profile
const updateProfile = catchAsync(async (req, res) => {
  const updatedUser = await authService.updateProfile(req.user, req.body);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
});

// Delete user account
const deleteAccount = catchAsync(async (req, res) => {
  await authService.deleteAccount(req.user);

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  deleteAccount
};
