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
 * /api/family/tree/{userId}:
 *   get:
 *     summary: Get the family tree for a user
 *     tags: [Family Tree]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The family tree data
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
router.get('/tree/:userId', auth, familyController.getFamilyTree);

module.exports = router;
