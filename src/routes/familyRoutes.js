const express = require('express');
const {
  getFamilyTree,
  getExtendedFamilyTree,
  getSpouseFamilyTree,
  getAllFamilyMembers,
  addFamilyMember,
  addSpouse,
  removeFamilyMember,
  getRelationshipTypes,
  getRelationshipStats
} = require('../controllers/familyController');
const { authenticateToken } = require('../middleware/auth');
const { validateFamilyMember } = require('../middleware/validation');

const router = express.Router();

// All family routes require authentication
router.use(authenticateToken);

// Family tree routes
router.get('/tree', getFamilyTree);
router.get('/tree/extended', getExtendedFamilyTree);
router.get('/tree/in-laws/:spouseId', getSpouseFamilyTree);

// Family member routes
router.get('/members', getAllFamilyMembers);
router.post('/member', validateFamilyMember, addFamilyMember);
router.post('/spouse', addSpouse);
router.delete('/member/:memberId', removeFamilyMember);

// Utility routes
router.get('/relationship-types', getRelationshipTypes);
router.get('/stats', getRelationshipStats);

module.exports = router;