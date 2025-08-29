const { Post, POST_TYPES, VISIBILITY_LEVELS } = require('../models/Post');
const User = require('../models/User');

class PostController {
    // Get personalized feed
    static async getFeed(req, res) {
        try {
            const userId = req.user.id;
            const filters = {
                limit: parseInt(req.query.limit) || 20,
                skip: parseInt(req.query.skip) || 0,
                ...req.query
            };

            const posts = await Post.getFeed(userId, filters);

            // Get additional data for each post
            const enrichedPosts = await Promise.all(
                posts.map(async (post) => {
                    const postData = post.toJSON();
                    
                    // Get author info
                    const author = await User.findById(post.authorId);
                    postData.author = author ? {
                        id: author.id,
                        firstName: author.firstName,
                        lastName: author.lastName,
                        profilePicture: author.profilePicture
                    } : null;


                    return postData;
                })
            );

            res.status(200).json({
                success: true,
                data: {
                    posts: enrichedPosts,
                    totalCount: posts.length,
                    hasMore: posts.length === filters.limit,
                    nextSkip: filters.skip + posts.length
                }
            });
        } catch (error) {
            console.error('Get feed error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get all posts
    static async getAllPosts(req, res) {
        try {
            const filters = {
                limit: parseInt(req.query.limit) || 20,
                skip: parseInt(req.query.skip) || 0,
                ...req.query
            };

            const posts = await Post.findAll(filters);

            res.status(200).json({
                success: true,
                data: {
                    posts: posts.map(post => post.toJSON()),
                    totalCount: posts.length,
                    filters
                }
            });
        } catch (error) {
            console.error('Get all posts error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get post by ID
    static async getPostById(req, res) {
        try {
            const { id } = req.params;

            const post = await Post.findById(id);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            const postData = post.toJSON();

            // Get author info
            const author = await User.findById(post.authorId);
            postData.author = author ? {
                id: author.id,
                firstName: author.firstName,
                lastName: author.lastName,
                fullName: author.fullName,
                profilePicture: author.profilePicture
            } : null;


            // Include likes
            postData.likedBy = await post.getLikes();

            res.status(200).json({
                success: true,
                data: postData
            });
        } catch (error) {
            console.error('Get post by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Create new post
    static async createPost(req, res) {
        try {
            const postData = {
                ...req.body,
                authorId: req.user.id
            };

            const post = new Post(postData);
            await post.save();

            // Get author info for response
            const author = await User.findById(req.user.id);
            const responseData = post.toJSON();
            responseData.author = author ? {
                id: author.id,
                firstName: author.firstName,
                lastName: author.lastName,
                profilePicture: author.profilePicture
            } : null;

            res.status(201).json({
                success: true,
                message: 'Post created successfully',
                data: responseData
            });
        } catch (error) {
            console.error('Create post error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Update post
    static async updatePost(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const post = await Post.findById(id);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            // Check authorization
            if (post.authorId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this post'
                });
            }

            // Update properties
            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined && key !== 'id' && key !== 'authorId') {
                    post[key] = updates[key];
                }
            });

            await post.save();

            res.status(200).json({
                success: true,
                message: 'Post updated successfully',
                data: post.toJSON()
            });
        } catch (error) {
            console.error('Update post error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Delete post
    static async deletePost(req, res) {
        try {
            const { id } = req.params;

            const post = await Post.findById(id);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            // Check authorization
            if (post.authorId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this post'
                });
            }

            await Post.delete(id);

            res.status(200).json({
                success: true,
                message: 'Post deleted successfully'
            });
        } catch (error) {
            console.error('Delete post error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Toggle like on post
    static async toggleLike(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const post = await Post.findById(id);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            let isLiked = false;
            let action = '';

            if (post.likes.includes(userId)) {
                await post.removeLike(userId);
                isLiked = false;
                action = 'unliked';
            } else {
                await post.addLike(userId);
                isLiked = true;
                action = 'liked';
            }

            res.status(200).json({
                success: true,
                message: `Post ${action} successfully`,
                data: {
                    postId: id,
                    isLiked,
                    likeCount: post.likeCount,
                    action
                }
            });
        } catch (error) {
            console.error('Toggle like error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get posts by user
    static async getUserPosts(req, res) {
        try {
            const { userId } = req.params;
            const filters = {
                authorId: userId,
                limit: parseInt(req.query.limit) || 20,
                skip: parseInt(req.query.skip) || 0,
                ...req.query
            };

            const posts = await Post.findAll(filters);

            res.status(200).json({
                success: true,
                data: {
                    posts: posts.map(post => post.toJSON()),
                    totalCount: posts.length,
                    userId
                }
            });
        } catch (error) {
            console.error('Get user posts error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Search posts
    static async searchPosts(req, res) {
        try {
            const { q: searchTerm } = req.query;
            const filters = { ...req.query };
            delete filters.q;

            const posts = await Post.search(searchTerm, filters);

            res.status(200).json({
                success: true,
                data: {
                    posts: posts.map(post => post.toJSON()),
                    totalCount: posts.length,
                    searchTerm,
                    filters
                }
            });
        } catch (error) {
            console.error('Search posts error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get post types
    static async getPostTypes(req, res) {
        try {
            const postTypes = Object.entries(POST_TYPES).map(([key, config]) => ({
                id: key,
                label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                category: config.category,
                description: config.description,
                maxLength: config.maxLength,
                allowsMedia: config.allowsMedia,
                requiredMedia: config.requiredMedia,
                isSpecial: config.isMemory || config.isAnnouncement || config.isEmergency
            }));

            // Group by category
            const groupedByCategory = postTypes.reduce((acc, postType) => {
                if (!acc[postType.category]) {
                    acc[postType.category] = [];
                }
                acc[postType.category].push(postType);
                return acc;
            }, {});

            res.status(200).json({
                success: true,
                data: {
                    postTypes,
                    groupedByCategory,
                    categories: Object.keys(groupedByCategory),
                    visibilityLevels: Object.entries(VISIBILITY_LEVELS).map(([key, config]) => ({
                        id: key,
                        label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                        description: config.description,
                        level: config.level
                    }))
                }
            });
        } catch (error) {
            console.error('Get post types error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get trending posts
    static async getTrendingPosts(req, res) {
        try {
            const { limit = 10, timeframe = 'week' } = req.query;
            
            // Calculate date range based on timeframe
            const endDate = new Date();
            const startDate = new Date();
            
            switch (timeframe) {
                case 'day':
                    startDate.setDate(startDate.getDate() - 1);
                    break;
                case 'week':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
                default:
                    startDate.setDate(startDate.getDate() - 7);
            }

            const filters = {
                dateFrom: startDate.toISOString(),
                dateTo: endDate.toISOString(),
                sortBy: 'engagement',
                limit: parseInt(limit)
            };

            const posts = await Post.findAll(filters);

            res.status(200).json({
                success: true,
                data: {
                    posts: posts.map(post => post.toJSON()),
                    totalCount: posts.length,
                    timeframe,
                    dateRange: {
                        from: startDate.toISOString(),
                        to: endDate.toISOString()
                    }
                }
            });
        } catch (error) {
            console.error('Get trending posts error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get memories (historical posts)
    static async getMemories(req, res) {
        try {
            const { date, decade } = req.query;
            const filters = {
                isMemory: true,
                limit: parseInt(req.query.limit) || 20,
                skip: parseInt(req.query.skip) || 0
            };

            if (date) {
                // Get memories from this day in previous years
                const targetDate = new Date(date);
                const startOfDay = new Date(targetDate);
                startOfDay.setFullYear(startOfDay.getFullYear() - 10); // Look back 10 years
                const endOfDay = new Date(targetDate);
                
                filters.eventDate = {
                    month: targetDate.getMonth() + 1,
                    day: targetDate.getDate()
                };
            }

            if (decade) {
                filters.decade = decade;
            }

            const posts = await Post.findAll(filters);

            res.status(200).json({
                success: true,
                data: {
                    memories: posts.map(post => post.toJSON()),
                    totalCount: posts.length,
                    date,
                    decade
                }
            });
        } catch (error) {
            console.error('Get memories error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get emergency posts
    static async getEmergencyPosts(req, res) {
        try {
            const filters = {
                isEmergency: true,
                status: 'published',
                sortBy: 'created',
                sortOrder: 'desc',
                limit: parseInt(req.query.limit) || 50
            };

            const posts = await Post.findAll(filters);

            // Enrich with author information
            const enrichedPosts = await Promise.all(
                posts.map(async (post) => {
                    const postData = post.toJSON();
                    const author = await User.findById(post.authorId);
                    postData.author = author ? {
                        id: author.id,
                        firstName: author.firstName,
                        lastName: author.lastName,
                        profilePicture: author.profilePicture
                    } : null;
                    return postData;
                })
            );

            res.status(200).json({
                success: true,
                data: {
                    emergencyPosts: enrichedPosts,
                    totalCount: posts.length
                }
            });
        } catch (error) {
            console.error('Get emergency posts error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Pin/unpin post
    static async togglePinPost(req, res) {
        try {
            const { id } = req.params;

            const post = await Post.findById(id);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Post not found'
                });
            }

            // Check authorization
            if (post.authorId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to pin/unpin this post'
                });
            }

            post.isPinned = !post.isPinned;
            await post.save();

            res.status(200).json({
                success: true,
                message: `Post ${post.isPinned ? 'pinned' : 'unpinned'} successfully`,
                data: {
                    postId: id,
                    isPinned: post.isPinned
                }
            });
        } catch (error) {
            console.error('Toggle pin post error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = PostController;