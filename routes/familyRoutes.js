const express = require('express');
const {
  getFamilyTree,
  addFamilyMember,
  getAllFamilyMembers,
  removeFamilyMember
} = require('../controllers/familyController');
const { authenticateToken } = require('../middleware/auth');
const { validateFamilyMember } = require('../middleware/validation');

const router = express.Router();

// All family routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /family/tree:
 *   get:
 *     summary: Get complete family tree
 *     description: Retrieves the complete family tree for the authenticated user with ancestors, descendants, and adjacent family members organized by relationship levels
 *     tags: [Family Tree]
 *     responses:
 *       200:
 *         description: Family tree retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FamilyTree'
 *             example:
 *               success: true
 *               data:
 *                 currentUser:
 *                   id: 3
 *                   firstName: "Prashanth"
 *                   lastName: "Patel"
 *                   email: "prashanth@family.com"
 *                 ancestors:
 *                   - user:
 *                       id: 1
 *                       firstName: "Ramesh"
 *                       lastName: "Patel"
 *                     relationship: "father"
 *                     level: 1
 *                 descendants:
 *                   - user:
 *                       id: 5
 *                       firstName: "Simran"
 *                       lastName: "Patel"
 *                     relationship: "daughter"
 *                     level: -1
 *                 adjacent:
 *                   - user:
 *                       id: 4
 *                       firstName: "Anjali"
 *                       lastName: "Patel"
 *                     relationship: "wife"
 *                     level: 0
 *                 totalMembers: 7
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/tree', getFamilyTree);

/**
 * @swagger
 * /family/members:
 *   get:
 *     summary: Get all family members
 *     description: Retrieves a simplified list of all family members related to the authenticated user
 *     tags: [Family Tree]
 *     responses:
 *       200:
 *         description: Family members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         currentUser:
 *                           $ref: '#/components/schemas/User'
 *                         familyMembers:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/User'
 *                               - type: object
 *                                 properties:
 *                                   relationship:
 *                                     type: string
 *                                   level:
 *                                     type: integer
 *                         totalMembers:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/members', getAllFamilyMembers);

/**
 * @swagger
 * /family/member:
 *   post:
 *     summary: Add a new family member
 *     description: Creates a new family member and establishes the relationship with the authenticated user and existing family members
 *     tags: [Family Tree]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddFamilyMemberRequest'
 *           example:
 *             firstName: "New"
 *             lastName: "Son"
 *             email: "newson@family.com"
 *             relationshipType: "son"
 *             gender: "male"
 *             dateOfBirth: "2010-05-20"
 *             location: "Family Home"
 *     responses:
 *       201:
 *         description: Family member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or invalid relationship
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User with email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/member', validateFamilyMember, addFamilyMember);

/**
 * @swagger
 * /family/member/{memberId}:
 *   delete:
 *     summary: Remove a family member
 *     description: Removes a family member and all their relationships from the family tree
 *     tags: [Family Tree]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the family member to remove
 *         example: 8
 *     responses:
 *       200:
 *         description: Family member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Family member not found or not related to current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/member/:memberId', removeFamilyMember);

module.exports = router;
