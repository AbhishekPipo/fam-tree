const familyService = require('../services/familyService');
const { AppError } = require('../middleware/errorHandler');

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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
const getFamilyTree = async (req, res, next) => {
  try {
    const familyTree = await familyService.getFamilyTree(req.user.id);
    
    res.json({
      success: true,
      data: familyTree
    });
  } catch (error) {
    next(error);
  }
};

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
 *                             context:
 *                               type: string
 *                               enum: [primary, extended]
 */
const getExtendedFamilyTree = async (req, res, next) => {
  try {
    const includeInLaws = req.query.includeInLaws === 'true';
    const extendedTree = await familyService.getExtendedFamilyTree(req.user.id, includeInLaws);
    
    res.json({
      success: true,
      data: extendedTree
    });
  } catch (error) {
    next(error);
  }
};

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
 *           type: string
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
 *                               type: string
 *                             primaryUserId:
 *                               type: string
 */
const getSpouseFamilyTree = async (req, res, next) => {
  try {
    const { spouseId } = req.params;
    const inLawTree = await familyService.getSpouseFamilyTree(spouseId, req.user.id);
    
    res.json({
      success: true,
      data: inLawTree
    });
  } catch (error) {
    next(error);
  }
};

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
 */
const getAllFamilyMembers = async (req, res, next) => {
  try {
    const familyMembers = await familyService.getAllFamilyMembers(req.user.id);
    
    res.json({
      success: true,
      data: familyMembers
    });
  } catch (error) {
    next(error);
  }
};

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
 *       409:
 *         description: User with email already exists
 */
const addFamilyMember = async (req, res, next) => {
  try {
    const newMember = await familyService.addFamilyMember(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Family member added successfully',
      data: {
        user: newMember
      }
    });
  } catch (error) {
    next(error);
  }
};

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
const addSpouse = async (req, res, next) => {
  try {
    const result = await familyService.addSpouse(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

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
 *           type: string
 *         description: ID of the family member to remove
 *     responses:
 *       200:
 *         description: Family member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Family member not found or not related to current user
 */
const removeFamilyMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const result = await familyService.removeFamilyMember(memberId, req.user.id);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

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
 *                         relationshipTypes:
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
 *                               category:
 *                                 type: string
 *                                 enum: [direct, indirect]
 *                                 example: "indirect"
 *                               subcategory:
 *                                 type: string
 *                                 enum: [blood, marriage, adoption, step, half]
 *                                 example: "blood"
 */
const getRelationshipTypes = async (req, res, next) => {
  try {
    const relationshipTypes = familyService.getRelationshipTypes();
    
    res.json({
      success: true,
      data: {
        relationshipTypes
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /family/stats:
 *   get:
 *     summary: Get family relationship statistics
 *     description: Retrieves statistics about the family tree including counts by relationship type and generation
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
 *                         totalMembers:
 *                           type: integer
 *                           example: 15
 *                         ancestorCount:
 *                           type: integer
 *                           example: 4
 *                         descendantCount:
 *                           type: integer
 *                           example: 6
 *                         adjacentCount:
 *                           type: integer
 *                           example: 5
 *                         generationLevels:
 *                           type: object
 *                           additionalProperties:
 *                             type: integer
 *                           example:
 *                             "-2": 2
 *                             "-1": 4
 *                             "0": 5
 *                             "1": 2
 *                             "2": 2
 */
const getRelationshipStats = async (req, res, next) => {
  try {
    const familyTree = await familyService.getFamilyTree(req.user.id);
    
    // Calculate statistics
    const stats = {
      totalMembers: familyTree.totalMembers,
      ancestorCount: familyTree.ancestors.length,
      descendantCount: familyTree.descendants.length,
      adjacentCount: familyTree.adjacent.length,
      generationLevels: {}
    };

    // Count by generation levels
    [...familyTree.ancestors, ...familyTree.descendants, ...familyTree.adjacent].forEach(member => {
      const level = member.level.toString();
      stats.generationLevels[level] = (stats.generationLevels[level] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFamilyTree,
  getExtendedFamilyTree,
  getSpouseFamilyTree,
  getAllFamilyMembers,
  addFamilyMember,
  addSpouse,
  removeFamilyMember,
  getRelationshipTypes,
  getRelationshipStats
};