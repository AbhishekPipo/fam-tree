const express = require('express');
const router = express.Router();
const PostController = require('../controllers/PostController');
const { authenticateToken: auth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Social feed and post management
 */

/**
 * @swagger
 * /api/posts/feed:
 *   get:
 *     summary: Get personalized feed
 *     tags: [Posts]
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
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: isEmergency
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 */
router.get('/feed', auth, PostController.getFeed);

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
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
 *         name: authorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [public, family, private, custom]
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 */
router.get('/', auth, PostController.getAllPosts);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeComments
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         description: Post not found
 */
router.get('/:id', auth, PostController.getPostById);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, photo, video, memory, announcement, emergency, milestone, tribute, recipe, story]
 *                 default: text
 *               visibility:
 *                 type: string
 *                 enum: [public, family, private, custom]
 *                 default: family
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: object
 *               isMemory:
 *                 type: boolean
 *               isAnnouncement:
 *                 type: boolean
 *               isEmergency:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/', auth, PostController.createPost);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update post
 *     tags: [Posts]
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
 *         description: Post updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Post not found
 */
router.put('/:id', auth, PostController.updatePost);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete post
 *     tags: [Posts]
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
 *         description: Post deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Post not found
 */
router.delete('/:id', auth, PostController.deletePost);

/**
 * @swagger
 * /api/posts/{id}/like:
 *   post:
 *     summary: Toggle like on post
 *     tags: [Posts]
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
 *         description: Like toggled successfully
 *       404:
 *         description: Post not found
 */
router.post('/:id/like', auth, PostController.toggleLike);

/**
 * @swagger
 * /api/posts/{id}/comments:
 *   post:
 *     summary: Add comment to post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               parentCommentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Post not found
 */
router.post('/:id/comments', auth, PostController.addComment);

/**
 * @swagger
 * /api/posts/comments/{commentId}:
 *   delete:
 *     summary: Delete comment
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       404:
 *         description: Comment not found or not authorized
 */
router.delete('/comments/:commentId', auth, PostController.deleteComment);

/**
 * @swagger
 * /api/posts/user/{userId}:
 *   get:
 *     summary: Get posts by user
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: User posts retrieved successfully
 */
router.get('/user/:userId', auth, PostController.getUserPosts);

/**
 * @swagger
 * /api/posts/search:
 *   get:
 *     summary: Search posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search', auth, PostController.searchPosts);

/**
 * @swagger
 * /api/posts/types:
 *   get:
 *     summary: Get post types and configurations
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Post types retrieved successfully
 */
router.get('/types', auth, PostController.getPostTypes);

/**
 * @swagger
 * /api/posts/trending:
 *   get:
 *     summary: Get trending posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *     responses:
 *       200:
 *         description: Trending posts retrieved successfully
 */
router.get('/trending', auth, PostController.getTrendingPosts);

/**
 * @swagger
 * /api/posts/memories:
 *   get:
 *     summary: Get memories (historical posts)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Get memories from this day in previous years
 *       - in: query
 *         name: decade
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Memories retrieved successfully
 */
router.get('/memories', auth, PostController.getMemories);

/**
 * @swagger
 * /api/posts/emergency:
 *   get:
 *     summary: Get emergency posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Emergency posts retrieved successfully
 */
router.get('/emergency', auth, PostController.getEmergencyPosts);

/**
 * @swagger
 * /api/posts/{id}/pin:
 *   post:
 *     summary: Toggle pin status of post
 *     tags: [Posts]
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
 *         description: Post pin status toggled successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Post not found
 */
router.post('/:id/pin', auth, PostController.togglePinPost);

module.exports = router;