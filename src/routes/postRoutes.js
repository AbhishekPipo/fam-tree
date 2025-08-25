const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimiter');
const postController = require('../controllers/postController');

// Apply authentication to all routes
router.use(auth);

// Apply rate limiting
router.use(apiLimiter);

// Feed and search routes (before parameterized routes)
router.get('/feed', postController.getFeed);
router.get('/search', postController.searchPosts);

// Post CRUD routes
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);
router.post('/', postController.createPost);
router.put('/:id', postController.updatePost);
router.delete('/:id', postController.deletePost);

// User-specific posts
router.get('/user/:userId', postController.getUserPosts);

// Post interactions
router.post('/:id/like', postController.toggleLike);
router.post('/:id/comments', postController.addComment);
router.delete('/comments/:commentId', postController.deleteComment);

module.exports = router;