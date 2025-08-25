const { Post } = require('../models');
const { catchAsync, AppError } = require('../middleware/errorHandler');

/**
 * @swagger
 * /posts/feed:
 *   get:
 *     summary: Get user's feed
 *     description: Retrieves personalized feed with posts from family members
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of posts to return
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PostWithStats'
 *                     totalCount:
 *                       type: integer
 */
const getFeed = catchAsync(async (req, res) => {
  const filters = {
    limit: parseInt(req.query.limit) || 50
  };

  const posts = await Post.getFeed(req.user.id, filters);

  res.json({
    success: true,
    data: {
      posts,
      totalCount: posts.length
    }
  });
});

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     description: Retrieves all posts with optional filtering
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [text, photo, video, memory, announcement, emergency]
 *         description: Filter by post type
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: Filter by author user ID
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [public, family, private]
 *         description: Filter by visibility
 *       - in: query
 *         name: isMemory
 *         schema:
 *           type: boolean
 *         description: Filter memory posts
 *       - in: query
 *         name: isEmergency
 *         schema:
 *           type: boolean
 *         description: Filter emergency posts
 *       - in: query
 *         name: isPinned
 *         schema:
 *           type: boolean
 *         description: Filter pinned posts
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of posts to return
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 */
const getAllPosts = catchAsync(async (req, res) => {
  const filters = {
    type: req.query.type,
    authorId: req.query.authorId,
    visibility: req.query.visibility,
    isMemory: req.query.isMemory !== undefined ? req.query.isMemory === 'true' : undefined,
    isEmergency: req.query.isEmergency !== undefined ? req.query.isEmergency === 'true' : undefined,
    isPinned: req.query.isPinned !== undefined ? req.query.isPinned === 'true' : undefined,
    limit: parseInt(req.query.limit) || 50
  };

  // Remove undefined values
  Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

  const posts = await Post.findAll(filters);

  res.json({
    success: true,
    data: {
      posts,
      totalCount: posts.length
    }
  });
});

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     description: Retrieves a specific post with full details including comments and likes
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         description: Post not found
 */
const getPostById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id);

  if (!post) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }

  res.json({
    success: true,
    data: post
  });
});

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     description: Creates a new post in the family feed
 *     tags: [Posts]
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
 *                 maxLength: 5000
 *                 example: "Had a wonderful family dinner today!"
 *               title:
 *                 type: string
 *                 example: "Family Dinner"
 *               type:
 *                 type: string
 *                 enum: [text, photo, video, memory, announcement, emergency]
 *                 default: text
 *                 example: "text"
 *               visibility:
 *                 type: string
 *                 enum: [public, family, private]
 *                 default: family
 *                 example: "family"
 *               targetAudience:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific user IDs for private posts
 *               isMemory:
 *                 type: boolean
 *                 default: false
 *               isEmergency:
 *                 type: boolean
 *                 default: false
 *               isAnnouncement:
 *                 type: boolean
 *                 default: false
 *               isPinned:
 *                 type: boolean
 *                 default: false
 *               location:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               mentionedUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation error
 */
const createPost = catchAsync(async (req, res) => {
  const postData = {
    ...req.body,
    authorId: req.user.id
  };

  const post = await Post.create(postData);

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: post
  });
});

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post
 *     description: Updates an existing post (only by author)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, photo, video, memory, announcement, emergency]
 *               visibility:
 *                 type: string
 *                 enum: [public, family, private]
 *               targetAudience:
 *                 type: array
 *                 items:
 *                   type: string
 *               isMemory:
 *                 type: boolean
 *               isEmergency:
 *                 type: boolean
 *               isAnnouncement:
 *                 type: boolean
 *               isPinned:
 *                 type: boolean
 *               location:
 *                 type: object
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               mentionedUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       404:
 *         description: Post not found
 *       403:
 *         description: Unauthorized to update this post
 */
const updatePost = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if post exists and user is the author
  const existingPost = await Post.findById(id);
  if (!existingPost) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }
  
  if (existingPost.authorId !== req.user.id) {
    throw new AppError('Unauthorized to update this post', 403, 'UNAUTHORIZED');
  }

  const updateData = req.body;
  const post = await Post.update(id, updateData);

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: post
  });
});

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     description: Deletes a post (only by author)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 *       403:
 *         description: Unauthorized to delete this post
 */
const deletePost = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if post exists and user is the author
  const existingPost = await Post.findById(id);
  if (!existingPost) {
    throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
  }
  
  if (existingPost.authorId !== req.user.id) {
    throw new AppError('Unauthorized to delete this post', 403, 'UNAUTHORIZED');
  }

  await Post.delete(id);

  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
});

/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     summary: Toggle like on a post
 *     description: Likes or unlikes a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Post liked successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     action:
 *                       type: string
 *                       enum: [liked, unliked]
 *                       example: "liked"
 */
const toggleLike = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await Post.toggleLike(id, req.user.id);

  res.json({
    success: true,
    message: `Post ${result.action} successfully`,
    data: result
  });
});

/**
 * @swagger
 * /posts/{id}/comments:
 *   post:
 *     summary: Add comment to a post
 *     description: Adds a new comment to a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
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
 *                 maxLength: 1000
 *                 example: "Great post! Thanks for sharing."
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error
 */
const addComment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new AppError('Comment content is required', 400, 'VALIDATION_ERROR');
  }

  if (content.length > 1000) {
    throw new AppError('Comment must be less than 1000 characters', 400, 'VALIDATION_ERROR');
  }

  const result = await Post.addComment(id, req.user.id, content.trim());

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: result
  });
});

/**
 * @swagger
 * /posts/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     description: Deletes a comment (only by comment author)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       404:
 *         description: Comment not found or unauthorized
 */
const deleteComment = catchAsync(async (req, res) => {
  const { commentId } = req.params;
  await Post.deleteComment(commentId, req.user.id);

  res.json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

/**
 * @swagger
 * /posts/user/{userId}:
 *   get:
 *     summary: Get posts by user
 *     description: Retrieves all posts by a specific user
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [text, photo, video, memory, announcement, emergency]
 *         description: Filter by post type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of posts to return
 *     responses:
 *       200:
 *         description: User posts retrieved successfully
 */
const getUserPosts = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const filters = {
    type: req.query.type,
    limit: parseInt(req.query.limit) || 50
  };

  // Remove undefined values
  Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

  const posts = await Post.findByUser(userId, filters);

  res.json({
    success: true,
    data: {
      posts,
      totalCount: posts.length
    }
  });
});

/**
 * @swagger
 * /posts/search:
 *   get:
 *     summary: Search posts
 *     description: Search posts by content, title, or tags
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
const searchPosts = catchAsync(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim().length === 0) {
    throw new AppError('Search query is required', 400, 'SEARCH_QUERY_REQUIRED');
  }

  const results = await Post.search(q.trim());

  res.json({
    success: true,
    data: {
      results,
      totalCount: results.length
    }
  });
});

module.exports = {
  getFeed,
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
  getUserPosts,
  searchPosts
};