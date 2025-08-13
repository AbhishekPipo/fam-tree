const express = require('express');
const router = express.Router();
const graphService = require('../services/graphService');
const { authenticateToken: auth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/graph/family-tree:
 *   get:
 *     summary: Get family tree in graph format
 *     tags: [Graph]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: layout
 *         schema:
 *           type: string
 *           enum: [hierarchical, force, circular]
 *         description: Graph layout type
 *       - in: query
 *         name: includeInLaws
 *         schema:
 *           type: boolean
 *         description: Include in-law family members
 *       - in: query
 *         name: maxDepth
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Maximum relationship depth
 *       - in: query
 *         name: includeExtended
 *         schema:
 *           type: boolean
 *         description: Include extended family members
 *     responses:
 *       200:
 *         description: Family tree graph data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nodes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       label:
 *                         type: string
 *                       category:
 *                         type: string
 *                       level:
 *                         type: integer
 *                       data:
 *                         type: object
 *                       style:
 *                         type: object
 *                 edges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       from:
 *                         type: integer
 *                       to:
 *                         type: integer
 *                       label:
 *                         type: string
 *                       category:
 *                         type: string
 *                       style:
 *                         type: object
 *                 metadata:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/family-tree', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const options = {
      layout: req.query.layout || 'hierarchical',
      includeInLaws: req.query.includeInLaws === 'true',
      maxDepth: parseInt(req.query.maxDepth) || 3,
      includeExtended: req.query.includeExtended !== 'false'
    };

    const graphData = await graphService.getFamilyTreeGraph(userId, options);
    
    res.json({
      success: true,
      data: graphData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/graph/family-tree/{userId}:
 *   get:
 *     summary: Get specific user's family tree in graph format
 *     tags: [Graph]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to get family tree for
 *       - in: query
 *         name: layout
 *         schema:
 *           type: string
 *           enum: [hierarchical, force, circular]
 *         description: Graph layout type
 *       - in: query
 *         name: includeInLaws
 *         schema:
 *           type: boolean
 *         description: Include in-law family members
 *       - in: query
 *         name: maxDepth
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Maximum relationship depth
 *     responses:
 *       200:
 *         description: Family tree graph data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/family-tree/:userId', auth, async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId);
    const options = {
      layout: req.query.layout || 'hierarchical',
      includeInLaws: req.query.includeInLaws === 'true',
      maxDepth: parseInt(req.query.maxDepth) || 3,
      includeExtended: req.query.includeExtended !== 'false'
    };

    const graphData = await graphService.getFamilyTreeGraph(targetUserId, options);
    
    res.json({
      success: true,
      data: graphData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/graph/relationship-path/{targetUserId}:
 *   get:
 *     summary: Get relationship path between current user and target user
 *     tags: [Graph]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Target user ID to find path to
 *     responses:
 *       200:
 *         description: Relationship path graph data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nodes:
 *                   type: array
 *                 edges:
 *                   type: array
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     fromUserId:
 *                       type: integer
 *                     toUserId:
 *                       type: integer
 *                     pathsFound:
 *                       type: integer
 *                     shortestPath:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Target user not found or no relationship path exists
 *       500:
 *         description: Internal server error
 */
router.get('/relationship-path/:targetUserId', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const targetUserId = parseInt(req.params.targetUserId);

    if (userId === targetUserId) {
      throw new AppError('Cannot find path to yourself', 400, 'INVALID_TARGET');
    }

    const pathData = await graphService.getRelationshipPath(userId, targetUserId);
    
    if (pathData.metadata.pathsFound === 0) {
      throw new AppError('No relationship path found between users', 404, 'NO_PATH_FOUND');
    }
    
    res.json({
      success: true,
      data: pathData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/graph/layouts:
 *   get:
 *     summary: Get available graph layout options
 *     tags: [Graph]
 *     responses:
 *       200:
 *         description: Available layout options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 layouts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       bestFor:
 *                         type: string
 */
router.get('/layouts', (req, res) => {
  const layouts = [
    {
      id: 'hierarchical',
      name: 'Hierarchical',
      description: 'Traditional family tree layout with generations in levels',
      bestFor: 'Clear generational structure, easy to follow lineage'
    },
    {
      id: 'force',
      name: 'Force-Directed',
      description: 'Physics-based layout that groups related members naturally',
      bestFor: 'Complex relationships, discovering connections'
    },
    {
      id: 'circular',
      name: 'Circular',
      description: 'Circular layout with user at center and family around',
      bestFor: 'Focusing on one person\'s immediate connections'
    }
  ];

  res.json({
    success: true,
    data: { layouts }
  });
});

/**
 * @swagger
 * /api/graph/statistics:
 *   get:
 *     summary: Get family tree graph statistics
 *     tags: [Graph]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Graph statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalNodes:
 *                   type: integer
 *                 totalEdges:
 *                   type: integer
 *                 generations:
 *                   type: integer
 *                 largestFamily:
 *                   type: object
 *                 relationshipTypes:
 *                   type: object
 */
router.get('/statistics', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const graphData = await graphService.getFamilyTreeGraph(userId, { includeExtended: true });
    
    // Calculate statistics
    const statistics = {
      totalNodes: graphData.nodes.length,
      totalEdges: graphData.edges.length,
      generations: _calculateGenerations(graphData.nodes),
      nodesByCategory: _groupNodesByCategory(graphData.nodes),
      edgesByType: _groupEdgesByType(graphData.edges),
      averageConnections: graphData.edges.length / graphData.nodes.length,
      onlineMembers: graphData.nodes.filter(node => node.data.isOnline).length
    };
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions for statistics
function _calculateGenerations(nodes) {
  const levels = nodes.map(node => Math.abs(node.level));
  return Math.max(...levels) + 1;
}

function _groupNodesByCategory(nodes) {
  return nodes.reduce((acc, node) => {
    acc[node.category] = (acc[node.category] || 0) + 1;
    return acc;
  }, {});
}

function _groupEdgesByType(edges) {
  return edges.reduce((acc, edge) => {
    acc[edge.category] = (acc[edge.category] || 0) + 1;
    return acc;
  }, {});
}

module.exports = router;