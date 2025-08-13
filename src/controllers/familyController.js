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

// Rebuild all family relationships
const rebuildFamilyRelationships = catchAsync(async (req, res) => {
  const result = await familyService.rebuildFamilyRelationships();

  res.json({
    success: true,
    message: result.message
  });
});

// Update user parent relationships
const updateUserParents = catchAsync(async (req, res) => {
  const { userId, fatherId, motherId } = req.body;
  const result = await familyService.updateUserParents(userId, fatherId, motherId);

  res.json({
    success: true,
    message: result.message
  });
});

// Get extended family tree including in-laws
const getExtendedFamilyTree = catchAsync(async (req, res) => {
  const includeInLaws = req.query.includeInLaws === 'true';
  const familyTreeData = await familyService.getExtendedFamilyTree(req.user.id, includeInLaws);

  res.json({
    success: true,
    data: familyTreeData
  });
});

// Get spouse's family tree (in-laws)
const getSpouseFamilyTree = catchAsync(async (req, res) => {
  const { spouseId } = req.params;
  const inLawTreeData = await familyService.getSpouseFamilyTree(parseInt(spouseId), req.user.id);

  res.json({
    success: true,
    data: inLawTreeData
  });
});

// Add a spouse
const addSpouse = catchAsync(async (req, res) => {
  const result = await familyService.addSpouse(req.body, req.user.id);

  res.status(201).json({
    success: true,
    data: result
  });
});

module.exports = {
  getFamilyTree,
  addFamilyMember,
  getAllFamilyMembers,
  removeFamilyMember,
  getRelationshipTypes,
  getRelationshipStats,
  rebuildFamilyRelationships,
  updateUserParents,
  getExtendedFamilyTree,
  getSpouseFamilyTree,
  addSpouse
};
