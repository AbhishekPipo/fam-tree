const express = require('express');
const {
  getFamilyTree,
  addFamilyMember,
  getAllFamilyMembers,
  removeFamilyMember,
  getRelationshipTypes,
  getRelationshipStats,
  rebuildFamilyRelationships,
  updateUserParents
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
 * /family/tree/extended:
 *   get:
 *     summary: Get extended family tree including in-laws
 *     description: Retrieves the complete family tree including in-law relationships when includeInLaws=true
 *     tags: [Family Tree]
 *     parameters:
 *       - in: query
 *         name: includeInLaws
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include in-law family trees
 *     responses:
 *       200:
 *         description: Extended family tree retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/FamilyTree'
 *                         - type: object
 *                           properties:
 *                             inLaws:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/FamilyTree'
 *                             extendedInLaws:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   throughMember:
 *                                     $ref: '#/components/schemas/User'
 *                                   inLawTree:
 *                                     $ref: '#/components/schemas/FamilyTree'
 *                                   relationship:
 *                                     type: string
 *                             context:
 *                               type: string
 *                               enum: [primary, extended]
 */
router.get('/tree/extended', require('../controllers/familyController').getExtendedFamilyTree);

/**
 * @swagger
 * /family/tree/in-laws/{spouseId}:
 *   get:
 *     summary: Get spouse's family tree (in-laws)
 *     description: Retrieves the family tree of a spouse showing in-law relationships
 *     tags: [Family Tree]
 *     parameters:
 *       - in: path
 *         name: spouseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the spouse whose family tree to retrieve
 *     responses:
 *       200:
 *         description: In-law family tree retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/FamilyTree'
 *                         - type: object
 *                           properties:
 *                             context:
 *                               type: string
 *                               enum: [in-laws]
 *                             spouseId:
 *                               type: integer
 *                             primaryUserId:
 *                               type: integer
 */
router.get('/tree/in-laws/:spouseId', require('../controllers/familyController').getSpouseFamilyTree);

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
 * /family/spouse:
 *   post:
 *     summary: Add a spouse
 *     description: Creates a new spouse and establishes marriage relationship
 *     tags: [Family Tree]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - gender
 *               - dateOfBirth
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Jane"
 *               middleName:
 *                 type: string
 *                 example: "Marie"
 *               lastName:
 *                 type: string
 *                 example: "Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane.smith@family.com"
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *                 example: "female"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1980-05-15"
 *               location:
 *                 type: string
 *                 example: "New York, USA"
 *     responses:
 *       201:
 *         description: Spouse added successfully
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
 *                         spouse:
 *                           $ref: '#/components/schemas/User'
 *                         relationship:
 *                           type: string
 *                           example: "wife"
 *                         message:
 *                           type: string
 *                           example: "Spouse added successfully"
 */
router.post('/spouse', require('../controllers/familyController').addSpouse);

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

/**
 * @swagger
 * /family/relationship-types:
 *   get:
 *     summary: Get available relationship types
 *     description: Retrieves all available relationship types that can be used when adding family members, organized by category
 *     tags: [Family Tree]
 *     responses:
 *       200:
 *         description: Relationship types retrieved successfully
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
 *                         all:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: string
 *                                 example: "father"
 *                               label:
 *                                 type: string
 *                                 example: "Father"
 *                               level:
 *                                 type: integer
 *                                 example: 1
 *                               gender:
 *                                 type: string
 *                                 enum: [male, female, neutral]
 *                                 example: "male"
 *                               category:
 *                                 type: string
 *                                 enum: [direct, indirect]
 *                                 example: "indirect"
 *                               description:
 *                                 type: string
 *                                 example: "Male parent"
 *                         grouped:
 *                           type: object
 *                           properties:
 *                             direct:
 *                               type: array
 *                               description: "Spouse/partner relationships"
 *                             parents:
 *                               type: array
 *                               description: "Parent relationships (level 1)"
 *                             children:
 *                               type: array
 *                               description: "Child relationships (level -1)"
 *                             siblings:
 *                               type: array
 *                               description: "Sibling relationships (level 0)"
 *                             grandparents:
 *                               type: array
 *                               description: "Grandparent relationships (level 2)"
 *                             grandchildren:
 *                               type: array
 *                               description: "Grandchild relationships (level -2)"
 *                             extended:
 *                               type: array
 *                               description: "Extended family (uncles, aunts, cousins, etc.)"
 *                         totalTypes:
 *                           type: integer
 *                           example: 45
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/relationship-types', getRelationshipTypes);

/**
 * @swagger
 * /family/stats:
 *   get:
 *     summary: Get family relationship statistics
 *     description: Retrieves detailed statistics about the user's family relationships including generation spread, relationship counts, and breakdowns
 *     tags: [Family Tree]
 *     responses:
 *       200:
 *         description: Family statistics retrieved successfully
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
 *                         totalRelationships:
 *                           type: integer
 *                           example: 15
 *                           description: "Total number of family relationships"
 *                         directRelationships:
 *                           type: integer
 *                           example: 1
 *                           description: "Number of direct relationships (spouses/partners)"
 *                         indirectRelationships:
 *                           type: integer
 *                           example: 14
 *                           description: "Number of indirect relationships (blood/family)"
 *                         generationSpread:
 *                           type: object
 *                           properties:
 *                             ancestorGenerations:
 *                               type: integer
 *                               example: 2
 *                               description: "Number of ancestor generations"
 *                             descendantGenerations:
 *                               type: integer
 *                               example: 3
 *                               description: "Number of descendant generations"
 *                             totalGenerations:
 *                               type: integer
 *                               example: 6
 *                               description: "Total generations in family tree"
 *                         levelBreakdown:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               level:
 *                                 type: integer
 *                                 example: 1
 *                               count:
 *                                 type: integer
 *                                 example: 2
 *                               description:
 *                                 type: string
 *                                 example: "1 generation up"
 *                         typeBreakdown:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 example: "son"
 *                               count:
 *                                 type: integer
 *                                 example: 2
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', getRelationshipStats);

/**
 * @swagger
 * /family/rebuild-relationships:
 *   post:
 *     summary: Rebuild all family relationships
 *     description: Rebuilds all family relationships to ensure completeness. This fixes any missing relationships in the family tree by recalculating all connections between family members.
 *     tags: [Family Tree]
 *     responses:
 *       200:
 *         description: Family relationships rebuilt successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Family relationships rebuilt successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/rebuild-relationships', rebuildFamilyRelationships);

/**
 * @swagger
 * /family/update-parents:
 *   post:
 *     summary: Update user parent relationships
 *     description: Updates a user's parent relationships and rebuilds family tree
 *     tags: [Family Tree]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 9
 *               fatherId:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               motherId:
 *                 type: integer
 *                 nullable: true
 *                 example: 2
 *     responses:
 *       200:
 *         description: Parent relationships updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "User parent relationships updated successfully"
 */
router.post('/update-parents', updateUserParents);

module.exports = router;
