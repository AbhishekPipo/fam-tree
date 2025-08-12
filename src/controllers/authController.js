const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Register a new user
const register = catchAsync(async (req, res) => {
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
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
  }

  // Validate parent references if provided
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

  // Find user by email
  const user = await User.findOne({ 
    where: { email },
    attributes: { include: ['password'] }
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Update user online status
  await user.update({ isOnline: true });

  // Generate JWT token
  const token = generateToken(user.id);

  // Remove password from response
  const userResponse = user.toJSON();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      token
    }
  });
});

// Logout user
const logout = catchAsync(async (req, res) => {
  // Update user online status
  await req.user.update({ isOnline: false });

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Get current user profile
const getProfile = catchAsync(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [
      { model: User, as: 'father', attributes: ['id', 'firstName', 'lastName'] },
      { model: User, as: 'mother', attributes: ['id', 'firstName', 'lastName'] }
    ]
  });

  res.json({
    success: true,
    data: { user }
  });
});

// Update user profile
const updateProfile = catchAsync(async (req, res) => {
  const allowedFields = [
    'firstName',
    'middleName', 
    'lastName',
    'dateOfBirth',
    'gender',
    'location',
    'hasMedication',
    'medicationName',
    'medicationFrequency',
    'medicationTime',
    'staysWithUser'
  ];

  // Filter only allowed fields
  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  // Update user
  await req.user.update(updateData);

  // Fetch updated user with associations
  const updatedUser = await User.findByPk(req.user.id, {
    include: [
      { model: User, as: 'father', attributes: ['id', 'firstName', 'lastName'] },
      { model: User, as: 'mother', attributes: ['id', 'firstName', 'lastName'] }
    ]
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
});

// Delete user account
const deleteAccount = catchAsync(async (req, res) => {
  // Note: In a real application, you might want to soft delete or archive
  // instead of hard delete to maintain data integrity
  await req.user.destroy();

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
