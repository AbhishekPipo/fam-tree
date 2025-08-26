const express = require('express');
const SearchService = require('../services/searchService');
const { authenticateToken } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');
const { searchSchemas, validate } = require('../validation/schemas');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Advanced search across users, events, and family trees
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [user, event, tree, all]
 *           default: all
 *         description: Type of entities to search
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     query:
 *                       type: string
 *                     type:
 *                       type: string
 *                     totalResults:
 *                       type: integer
 *                     results:
 *                       type: object
 *                     pagination:
 *                       type: object
 */
router.get('/', searchLimiter, validate(searchSchemas.query, 'query'), async (req, res, next) => {
  try {
    const results = await SearchService.search(req.query);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions/autocomplete
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Partial search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Maximum number of suggestions
 *     responses:
 *       200:
 *         description: Search suggestions
 */
router.get('/suggestions', searchLimiter, async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length === 0) {
      throw new AppError('Query parameter is required', 400, 'MISSING_QUERY');
    }
    
    const suggestions = await SearchService.getSearchSuggestions(q.trim(), parseInt(limit));
    
    res.json({
      success: true,
      data: {
        query: q,
        suggestions
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/search/relationship-path:
 *   get:
 *     summary: Find relationship path between two users
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         description: From user ID
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         description: To user ID
 *       - in: query
 *         name: maxDepth
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 6
 *         description: Maximum relationship depth
 *     responses:
 *       200:
 *         description: Relationship paths
 */
router.get('/relationship-path', async (req, res, next) => {
  try {
    const { from, to, maxDepth = 6 } = req.query;
    
    if (!from || !to) {
      throw new AppError('Both from and to user IDs are required', 400, 'MISSING_USER_IDS');
    }
    
    const paths = await SearchService.findRelationshipPath(from, to, parseInt(maxDepth));
    
    res.json({
      success: true,
      data: {
        fromUserId: from,
        toUserId: to,
        maxDepth: parseInt(maxDepth),
        paths
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/search/relationship-suggestions/{userId}:
 *   get:
 *     summary: Get relationship suggestions for a user
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of suggestions
 *     responses:
 *       200:
 *         description: Relationship suggestions
 */
router.get('/relationship-suggestions/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    const suggestions = await SearchService.getRelationshipSuggestions(userId, parseInt(limit, 10));

    res.json({
      success: true,
      data: {
        userId,
        suggestions
      }
    });
  } catch (error) {
    next(error);
  }
});/**
 * @swagger
 * /api/search/analyze-tree/{treeId}:
 *   get:
 *     summary: Analyze family tree statistics
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: treeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Family tree ID
 *     responses:
 *       200:
 *         description: Tree analysis results
 */
router.get('/analyze-tree/:treeId', async (req, res, next) => {
  try {
    const { treeId } = req.params;
    
    const analysis = await SearchService.analyzeFamilyTree(treeId);
    
    res.json({
      success: true,
      data: {
        treeId,
        analysis
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;