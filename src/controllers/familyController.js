const { familyService } = require('../services');
const { catchAsync } = require('../middleware/errorHandler');
const { RelationshipType } = require('../models');

// Get complete family tree for the logged-in user
const getFamilyTree = catchAsync(async (req, res) => {
  const familyTreeData = await familyService.getFamilyTree(req.user.id);

  res.json({
    success: true,
    data: familyTreeData
  });
});

// Add a new family member
const addFamilyMember = catchAsync(async (req, res) => {
  const createdUser = await familyService.addFamilyMember(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: 'Family member added successfully',
    data: {
      user: createdUser
    }
  });
});

// Get all family members (simplified list)
const getAllFamilyMembers = catchAsync(async (req, res) => {
  const familyMembers = await familyService.getAllFamilyMembers(req.user.id);

  res.json({
    success: true,
    data: {
      members: familyMembers
    }
  });
});

// Remove a family member
const removeFamilyMember = catchAsync(async (req, res) => {
  const { memberId } = req.params;
  await familyService.removeFamilyMember(memberId, req.user.id);

  res.json({
    success: true,
    message: 'Family member removed successfully'
  });
});

// Get available relationship types
const getRelationshipTypes = catchAsync(async (req, res) => {
  const relationshipTypes = await RelationshipType.findAll({
    where: { isActive: true },
    attributes: ['id', 'name', 'level', 'description'],
    order: [['level', 'ASC'], ['name', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      relationshipTypes
    }
  });
});

// Get relationship statistics
const getRelationshipStats = catchAsync(async (req, res) => {
  const stats = await familyService.getRelationshipStats(req.user.id);

  res.json({
    success: true,
    data: stats
  });
});

module.exports = {
  getFamilyTree,
  addFamilyMember,
  getAllFamilyMembers,
  removeFamilyMember,
  getRelationshipTypes,
  getRelationshipStats
};
