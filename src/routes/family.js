const express = require('express');
const router = express.Router();
const FamilyController = require('../controllers/FamilyController');
const { authenticateToken: auth } = require('../middleware/auth');
const { canRead, canCreate, canUpdate, canDelete, requireRole } = require('../middleware/rbac');

/**
 * @swagger
 * tags:
 *   name: Family
 *   description: Family tree and relationship management
 */

/**
 * @swagger
 * /api/family/tree:
 *   get:
 *     summary: Get family tree
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID (defaults to current user)
 *       - in: query
 *         name: depth
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Tree depth (generations)
 *     responses:
 *       200:
 *         description: Family tree retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/tree', canRead('family', 'tree'), FamilyController.getFamilyTree);
router.get('/tree/:userId', canRead('family', 'tree'), FamilyController.getFamilyTree);

/**
 * @swagger
 * /api/family/members:
 *   get:
 *     summary: Get all family members
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other]
 *       - in: query
 *         name: isAlive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Family members retrieved successfully
 */
router.get('/members', canRead('family', 'members'), FamilyController.getFamilyMembers);

/**
 * @swagger
 * /api/family/member:
 *   post:
 *     summary: Add family member
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - gender
 *             properties:
 *               firstName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               relationshipType:
 *                 type: string
 *               relationshipSubtype:
 *                 type: string
 *     responses:
 *       201:
 *         description: Family member added successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/member', canCreate('family', 'members'), FamilyController.addFamilyMember);

/**
 * @swagger
 * /api/family/member/{id}:
 *   put:
 *     summary: Update family member
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Family member updated successfully
 */
router.put('/member/:id', canUpdate('family', 'members'), FamilyController.updateFamilyMember);

/**
 * @swagger
 * /api/family/member/{id}:
 *   delete:
 *     summary: Remove family member
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Family member removed successfully
 */
router.delete('/member/:id', auth, FamilyController.removeFamilyMember);

/**
 * @swagger
 * /api/family/relationship-dropdown:
 *   get:
 *     summary: Get relationship dropdown options
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Relationship options retrieved successfully
 */
router.get('/relationship-dropdown', auth, FamilyController.getRelationshipDropdown);

/**
 * @swagger
 * /api/family/relationships/{userId}:
 *   get:
 *     summary: Get user relationships
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID (optional)
 *     responses:
 *       200:
 *         description: User relationships retrieved successfully
 */
router.get('/relationships', auth, FamilyController.getUserRelationships);
router.get('/relationships/:userId', auth, FamilyController.getUserRelationships);

/**
 * @swagger
 * /api/family/relationships:
 *   post:
 *     summary: Create relationship
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toUserId
 *               - relationshipType
 *             properties:
 *               fromUserId:
 *                 type: string
 *               toUserId:
 *                 type: string
 *               relationshipType:
 *                 type: string
 *               relationshipSubtype:
 *                 type: string
 *     responses:
 *       201:
 *         description: Relationship created successfully
 */
router.post('/relationships', auth, FamilyController.createRelationship);

/**
 * @swagger
 * /api/family/relationships/{id}:
 *   put:
 *     summary: Update relationship
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Relationship updated successfully
 */
router.put('/relationships/:id', auth, FamilyController.updateRelationship);

/**
 * @swagger
 * /api/family/relationships/{id}:
 *   delete:
 *     summary: Delete relationship
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Relationship deleted successfully
 */
router.delete('/relationships/:id', auth, FamilyController.deleteRelationship);

/**
 * @swagger
 * /api/family/stats:
 *   get:
 *     summary: Get family statistics
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Family statistics retrieved successfully
 */
router.get('/stats', auth, FamilyController.getFamilyStats);

/**
 * @swagger
 * /api/family/validate-relationship:
 *   post:
 *     summary: Validate relationship constraints
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromUserId
 *               - toUserId
 *               - relationshipType
 *             properties:
 *               fromUserId:
 *                 type: string
 *               toUserId:
 *                 type: string
 *               relationshipType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Relationship is valid
 *       400:
 *         description: Relationship validation failed
 */
router.post('/validate-relationship', auth, FamilyController.validateRelationship);

/**
 * @swagger
 * /api/family/relationship-suggestions:
 *   get:
 *     summary: Get relationship suggestions
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Relationship suggestions retrieved successfully
 */
router.get('/relationship-suggestions', auth, FamilyController.getRelationshipSuggestions);

/**
 * @swagger
 * /api/family/bulk-add:
 *   post:
 *     summary: Bulk add family members
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - members
 *             properties:
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Bulk add completed
 */
router.post('/bulk-add', requireRole(['admin', 'super_admin']), FamilyController.bulkAddMembers);

module.exports = router;