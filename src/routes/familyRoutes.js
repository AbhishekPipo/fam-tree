const express = require('express');
const familyController = require('../controllers/familyController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Family Tree
 *   description: Family tree management
 */

/**
 * @swagger
 * /api/family/tree:
 *   get:
 *     summary: Get the family tree for the authenticated user
 *     tags: [Family Tree]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The family tree data for the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/tree', auth, familyController.getFamilyTree);

module.exports = router;
