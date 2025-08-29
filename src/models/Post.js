const gremlin = require('gremlin');
const { v4: uuidv4 } = require('crypto').webcrypto ? { v4: () => crypto.randomUUID() } : require('uuid');
const db = require('../../config/database');

const __ = gremlin.process.statics;

// Post types with metadata
const POST_TYPES = {
    'text': {
        category: 'content',
        description: 'Text-only post',
        maxLength: 5000,
        allowsMedia: false
    },
    'memory': {
        category: 'special',
        description: 'Family memory or story',
        maxLength: 10000,
        isMemory: true
    },
    'announcement': {
        category: 'special',
        description: 'Family announcement',
        maxLength: 3000,
        isAnnouncement: true
    },
    'emergency': {
        category: 'urgent',
        description: 'Emergency alert',
        maxLength: 1000,
        isEmergency: true,
        priority: 'high'
    },
    'milestone': {
        category: 'special',
        description: 'Life milestone',
        maxLength: 3000,
        isMilestone: true
    },
    'tribute': {
        category: 'special',
        description: 'Tribute or memorial',
        maxLength: 10000,
        isTribute: true
    },
    'recipe': {
        category: 'content',
        description: 'Family recipe',
        maxLength: 5000,
        isRecipe: true
    },
    'story': {
        category: 'content',
        description: 'Family story',
        maxLength: 15000,
        isStory: true
    }
};

// Post visibility levels
const VISIBILITY_LEVELS = {
    'public': {
        level: 0,
        description: 'Visible to everyone',
        canView: 'all'
    },
    'family': {
        level: 1,
        description: 'Visible to family members',
        canView: 'family'
    },
    'private': {
        level: 2,
        description: 'Visible only to author',
        canView: 'author'
    },
    'custom': {
        level: 3,
        description: 'Visible to specific people',
        canView: 'specified'
    }
};

class Post {
    constructor(data) {
        this.id = data.id || uuidv4();
        this.content = data.content;
        this.title = data.title || null;
        this.type = data.type || 'text';
        this.subtype = data.subtype || null;
        
        
        // Author and audience
        this.authorId = data.authorId;
        this.visibility = data.visibility || 'family';
        this.targetAudience = data.targetAudience || [];
        this.excludeAudience = data.excludeAudience || [];
        
        // Interaction counters
        this.shares = data.shares || [];
        this.shareCount = data.shareCount || 0;
        this.views = data.views || [];
        this.viewCount = data.viewCount || 0;
        
        // Post characteristics
        this.isMemory = data.isMemory || false;
        this.isAnnouncement = data.isAnnouncement || false;
        this.isEmergency = data.isEmergency || false;
        this.isMilestone = data.isMilestone || false;
        this.isTribute = data.isTribute || false;
        this.isRecipe = data.isRecipe || false;
        this.isStory = data.isStory || false;
        this.isPinned = data.isPinned || false;
        this.isFeatured = data.isFeatured || false;
        
        // Location and tagging
        this.location = data.location || null;
        this.tags = data.tags || [];
        this.hashtags = data.hashtags || [];
        this.mentionedUsers = data.mentionedUsers || [];
        this.linkedEvents = data.linkedEvents || [];
        
        // Metadata
        this.mood = data.mood || null;
        this.weather = data.weather || null;
        this.occasion = data.occasion || null;
        this.significance = data.significance || 'medium'; // low, medium, high
        this.category = data.category || null;
        
        // Dates and context
        this.eventDate = data.eventDate || null; // Date the content refers to (different from createdAt)
        this.isHistorical = data.isHistorical || false;
        this.decade = data.decade || null;
        this.era = data.era || null;
        
        // Collaboration and sources
        this.collaborators = data.collaborators || [];
        this.contributors = data.contributors || [];
        this.sources = data.sources || [];
        this.references = data.references || [];
        this.credits = data.credits || [];
        
        // System fields
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.publishedAt = data.publishedAt || null;
        this.lastActivityAt = data.lastActivityAt || this.createdAt;
        
        // Status and moderation
        this.status = data.status || 'published'; // draft, published, archived, deleted
        this.isEdited = data.isEdited || false;
        this.editHistory = data.editHistory || [];
        this.moderationStatus = data.moderationStatus || 'approved';
        this.flags = data.flags || [];
        
        // Engagement and analytics
        this.engagementScore = data.engagementScore || 0;
        this.reachScore = data.reachScore || 0;
        this.qualityScore = data.qualityScore || 0;
        this.sentimentScore = data.sentimentScore || 0;
        
        // Notification and distribution
        this.notificationSent = data.notificationSent || false;
        this.distributionChannels = data.distributionChannels || [];
        this.scheduledFor = data.scheduledFor || null;
    }

    static getPostTypes() {
        return POST_TYPES;
    }

    static getPostType(type) {
        return POST_TYPES[type] || null;
    }

    static getVisibilityLevels() {
        return VISIBILITY_LEVELS;
    }

    validate() {
        if (!this.content || this.content.trim().length === 0) {
            throw new Error('Post content is required');
        }

        if (!this.authorId) {
            throw new Error('Author ID is required');
        }

        const postConfig = POST_TYPES[this.type];
        if (!postConfig) {
            throw new Error(`Invalid post type: ${this.type}`);
        }

        // Check content length
        if (this.content.length > postConfig.maxLength) {
            throw new Error(`Content exceeds maximum length of ${postConfig.maxLength} characters for post type '${this.type}'`);
        }


        // Validate visibility
        if (!VISIBILITY_LEVELS[this.visibility]) {
            throw new Error(`Invalid visibility level: ${this.visibility}`);
        }

        return true;
    }

    async save() {
        const g = db.getTraversal();
        
        try {
            this.validate();
            this.updatedAt = new Date().toISOString();

            // Set published date if not set and status is published
            if (this.status === 'published' && !this.publishedAt) {
                this.publishedAt = new Date().toISOString();
            }

            // Update activity timestamp
            this.lastActivityAt = new Date().toISOString();

            // Check if post exists
            const existingPost = await g.V().has('Post', 'id', this.id).toList();
            
            if (existingPost.length > 0) {
                // Update existing post
                this.isEdited = true;
                this.editHistory.push({
                    editedAt: new Date().toISOString(),
                    editedBy: this.authorId,
                    changes: 'Content updated'
                });

                const updateQuery = g.V().has('Post', 'id', this.id);
                
                // Update properties
                Object.keys(this).forEach(key => {
                    if (this[key] !== null && key !== 'id') {
                        if (typeof this[key] === 'object') {
                            updateQuery.property(key, JSON.stringify(this[key]));
                        } else {
                            updateQuery.property(key, this[key]);
                        }
                    }
                });

                await updateQuery.iterate();
                return this;
            } else {
                // Create new post
                const postVertex = await g.addV('Post')
                    .property('id', this.id)
                    .property('content', this.content)
                    .property('title', this.title)
                    .property('type', this.type)
                    .property('subtype', this.subtype)
                    .property('authorId', this.authorId)
                    .property('visibility', this.visibility)
                    .property('targetAudience', JSON.stringify(this.targetAudience))
                    .property('excludeAudience', JSON.stringify(this.excludeAudience))
                    .property('shares', JSON.stringify(this.shares))
                    .property('shareCount', this.shareCount)
                    .property('views', JSON.stringify(this.views))
                    .property('viewCount', this.viewCount)
                    .property('isMemory', this.isMemory)
                    .property('isAnnouncement', this.isAnnouncement)
                    .property('isEmergency', this.isEmergency)
                    .property('isMilestone', this.isMilestone)
                    .property('isTribute', this.isTribute)
                    .property('isRecipe', this.isRecipe)
                    .property('isStory', this.isStory)
                    .property('isPinned', this.isPinned)
                    .property('isFeatured', this.isFeatured)
                    .property('location', JSON.stringify(this.location))
                    .property('tags', JSON.stringify(this.tags))
                    .property('hashtags', JSON.stringify(this.hashtags))
                    .property('mentionedUsers', JSON.stringify(this.mentionedUsers))
                    .property('linkedEvents', JSON.stringify(this.linkedEvents))
                    .property('mood', this.mood)
                    .property('weather', this.weather)
                    .property('occasion', this.occasion)
                    .property('significance', this.significance)
                    .property('category', this.category)
                    .property('eventDate', this.eventDate)
                    .property('isHistorical', this.isHistorical)
                    .property('decade', this.decade)
                    .property('era', this.era)
                    .property('collaborators', JSON.stringify(this.collaborators))
                    .property('contributors', JSON.stringify(this.contributors))
                    .property('sources', JSON.stringify(this.sources))
                    .property('references', JSON.stringify(this.references))
                    .property('credits', JSON.stringify(this.credits))
                    .property('createdAt', this.createdAt)
                    .property('updatedAt', this.updatedAt)
                    .property('publishedAt', this.publishedAt)
                    .property('lastActivityAt', this.lastActivityAt)
                    .property('status', this.status)
                    .property('isEdited', this.isEdited)
                    .property('editHistory', JSON.stringify(this.editHistory))
                    .property('moderationStatus', this.moderationStatus)
                    .property('flags', JSON.stringify(this.flags))
                    .property('engagementScore', this.engagementScore)
                    .property('reachScore', this.reachScore)
                    .property('qualityScore', this.qualityScore)
                    .property('sentimentScore', this.sentimentScore)
                    .property('notificationSent', this.notificationSent)
                    .property('distributionChannels', JSON.stringify(this.distributionChannels))
                    .property('scheduledFor', this.scheduledFor)
                    .next();

                // Create AUTHORED relationship
                await g.V()
                    .has('User', 'id', this.authorId)
                    .addE('AUTHORED')
                    .to(__.V().has('Post', 'id', this.id))
                    .property('createdAt', this.createdAt)
                    .iterate();

                return this;
            }
        } catch (error) {
            throw new Error(`Error saving post: ${error.message}`);
        }
    }





    async getLikes() {
        const g = db.getTraversal();
        
        try {
            const likes = await g.V()
                .has('Post', 'id', this.id)
                .inE('LIKED')
                .project('user', 'likedAt')
                .by(__.outV().elementMap())
                .by('likedAt')
                .toList();

            return likes.map(like => ({
                user: this.mapUserData(like.get('user')),
                likedAt: like.get('likedAt')
            }));
        } catch (error) {
            throw new Error(`Error getting likes: ${error.message}`);
        }
    }

    mapUserData(userData) {
        const user = {};
        for (const [key, value] of userData.entries()) {
            if (key !== gremlin.process.T.label && key !== gremlin.process.T.id) {
                user[key] = value;
            }
        }
        return user;
    }

    static async findById(id) {
        const g = db.getTraversal();
        
        try {
            const posts = await g.V().has('Post', 'id', id).elementMap().toList();
            
            if (posts.length === 0) {
                return null;
            }

            return Post.fromGraphData(posts[0]);
        } catch (error) {
            throw new Error(`Error finding post by ID: ${error.message}`);
        }
    }

    static async findAll(filters = {}) {
        const g = db.getTraversal();
        
        try {
            let query = g.V().hasLabel('Post');

            // Apply filters
            if (filters.authorId) {
                query = query.has('authorId', filters.authorId);
            }
            if (filters.type) {
                query = query.has('type', filters.type);
            }
            if (filters.visibility) {
                query = query.has('visibility', filters.visibility);
            }
            if (filters.status) {
                query = query.has('status', filters.status);
            }
            if (filters.isMemory !== undefined) {
                query = query.has('isMemory', filters.isMemory);
            }
            if (filters.isEmergency !== undefined) {
                query = query.has('isEmergency', filters.isEmergency);
            }
            if (filters.isPinned !== undefined) {
                query = query.has('isPinned', filters.isPinned);
            }
            if (filters.dateFrom) {
                query = query.has('createdAt', gremlin.process.P.gte(filters.dateFrom));
            }
            if (filters.dateTo) {
                query = query.has('createdAt', gremlin.process.P.lte(filters.dateTo));
            }

            // Apply sorting
            if (filters.sortBy === 'engagement') {
                query = query.order().by('engagementScore', gremlin.process.Order.desc);
            } else if (filters.sortBy === 'activity') {
                query = query.order().by('lastActivityAt', gremlin.process.Order.desc);
            } else {
                query = query.order().by('createdAt', gremlin.process.Order.desc);
            }

            // Apply pagination
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.skip) {
                query = query.skip(filters.skip);
            }

            const posts = await query.elementMap().toList();
            return posts.map(postData => Post.fromGraphData(postData));
        } catch (error) {
            throw new Error(`Error finding posts: ${error.message}`);
        }
    }

    static async getFeed(userId, filters = {}) {
        const g = db.getTraversal();
        
        try {
            // Get posts from family members and user's own posts
            let query = g.V().has('User', 'id', userId)
                .union(
                    // Own posts
                    __.out('AUTHORED').hasLabel('Post'),
                    // Family posts
                    __.both('FAMILY_RELATIONSHIP').out('AUTHORED').hasLabel('Post')
                )
                .dedup();

            // Filter by visibility
            query = query.or(
                __.has('visibility', 'public'),
                __.has('visibility', 'family'),
                __.and(__.has('visibility', 'custom'), __.has('targetAudience', gremlin.process.P.within([userId])))
            );

            // Apply additional filters
            if (filters.type) {
                query = query.has('type', filters.type);
            }
            if (filters.isEmergency !== undefined) {
                query = query.has('isEmergency', filters.isEmergency);
            }

            // Sort by relevance (pinned first, then by activity)
            query = query.order()
                .by('isPinned', gremlin.process.Order.desc)
                .by('isEmergency', gremlin.process.Order.desc)
                .by('lastActivityAt', gremlin.process.Order.desc);

            // Apply pagination
            const limit = filters.limit || 20;
            const skip = filters.skip || 0;
            query = query.skip(skip).limit(limit);

            const posts = await query.elementMap().toList();
            return posts.map(postData => Post.fromGraphData(postData));
        } catch (error) {
            throw new Error(`Error getting feed: ${error.message}`);
        }
    }

    static async search(searchTerm, filters = {}) {
        const g = db.getTraversal();
        
        try {
            let query = g.V().hasLabel('Post');

            // Apply text search
            if (searchTerm) {
                query = query.or(
                    __.has('content', gremlin.process.P.containing(searchTerm)),
                    __.has('title', gremlin.process.P.containing(searchTerm)),
                    __.has('tags', gremlin.process.P.containing(searchTerm))
                );
            }

            // Apply additional filters
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null) {
                    query = query.has(key, filters[key]);
                }
            });

            query = query.order().by('engagementScore', gremlin.process.Order.desc);
            
            const posts = await query.elementMap().limit(50).toList();
            return posts.map(postData => Post.fromGraphData(postData));
        } catch (error) {
            throw new Error(`Error searching posts: ${error.message}`);
        }
    }

    static async delete(id) {
        const g = db.getTraversal();
        
        try {
            // Delete all related edges first
            await g.V().has('Post', 'id', id)
                .bothE('LIKED', 'AUTHORED', 'COMMENTED_ON')
                .drop()
                .iterate();
            
            
            // Delete post vertex
            await g.V().has('Post', 'id', id).drop().iterate();
            
            return true;
        } catch (error) {
            throw new Error(`Error deleting post: ${error.message}`);
        }
    }

    static fromGraphData(data) {
        const postData = {};
        
        // Convert Map to object and parse JSON fields
        for (const [key, value] of data.entries()) {
            if (key === gremlin.process.T.label || key === gremlin.process.T.id) {
                continue;
            }
            
            // Parse JSON fields
            const jsonFields = [
                'media', 'attachments', 'targetAudience', 'excludeAudience',
                'likes', 'shares', 'views', 'tags', 'hashtags',
                'mentionedUsers', 'linkedEvents', 'location', 'collaborators',
                'contributors', 'sources', 'references', 'credits',
                'editHistory', 'flags', 'distributionChannels'
            ];
            
            if (jsonFields.includes(key) && typeof value === 'string') {
                try {
                    postData[key] = JSON.parse(value);
                } catch (e) {
                    postData[key] = value;
                }
            } else {
                postData[key] = value;
            }
        }

        return new Post(postData);
    }

    toJSON() {
        const obj = { ...this };
        
        // Remove sensitive or internal fields from public JSON
        delete obj.flags;
        delete obj.moderationStatus;
        delete obj.distributionChannels;
        
        return obj;
    }
}

module.exports = { Post, POST_TYPES, VISIBILITY_LEVELS };