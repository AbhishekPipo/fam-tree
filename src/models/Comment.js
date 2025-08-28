const gremlin = require('gremlin');
const { v4: uuidv4 } = require('crypto').webcrypto ? { v4: () => crypto.randomUUID() } : require('uuid');
const db = require('../../config/database');

const __ = gremlin.process.statics;

class Comment {
    constructor(data) {
        this.id = data.id || uuidv4();
        this.content = data.content;
        this.authorId = data.authorId;
        this.postId = data.postId;
        
        // Parent comment for nested comments
        this.parentCommentId = data.parentCommentId || null;
        this.depth = data.depth || 0;
        this.threadId = data.threadId || this.id;
        
        // Interactions
        this.likes = data.likes || [];
        this.likeCount = data.likeCount || 0;
        this.replies = data.replies || [];
        this.replyCount = data.replyCount || 0;
        
        // Status and moderation
        this.status = data.status || 'active'; // active, edited, deleted, hidden
        this.isEdited = data.isEdited || false;
        this.editHistory = data.editHistory || [];
        this.moderationStatus = data.moderationStatus || 'approved';
        this.flags = data.flags || [];
        
        // Media and attachments
        this.attachments = data.attachments || [];
        this.mentions = data.mentions || [];
        
        // System fields
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.lastModifiedBy = data.lastModifiedBy || data.authorId;
        
        // Engagement metrics
        this.engagementScore = data.engagementScore || 0;
        this.qualityScore = data.qualityScore || 0;
        this.sentimentScore = data.sentimentScore || 0;
    }

    validate() {
        if (!this.content || this.content.trim().length === 0) {
            throw new Error('Comment content is required');
        }

        if (!this.authorId) {
            throw new Error('Author ID is required');
        }

        if (!this.postId) {
            throw new Error('Post ID is required');
        }

        if (this.content.length > 1000) {
            throw new Error('Comment content cannot exceed 1000 characters');
        }

        return true;
    }

    async save() {
        const g = db.getTraversal();
        
        try {
            this.validate();
            this.updatedAt = new Date().toISOString();

            // Check if comment exists
            const existingComment = await g.V().has('Comment', 'id', this.id).toList();
            
            if (existingComment.length > 0) {
                // Update existing comment
                this.isEdited = true;
                this.editHistory.push({
                    editedAt: new Date().toISOString(),
                    editedBy: this.lastModifiedBy,
                    previousContent: this.content
                });

                const updateQuery = g.V().has('Comment', 'id', this.id);
                
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
                // Create new comment
                const commentVertex = await g.addV('Comment')
                    .property('id', this.id)
                    .property('content', this.content)
                    .property('authorId', this.authorId)
                    .property('postId', this.postId)
                    .property('parentCommentId', this.parentCommentId)
                    .property('depth', this.depth)
                    .property('threadId', this.threadId)
                    .property('likes', JSON.stringify(this.likes))
                    .property('likeCount', this.likeCount)
                    .property('replies', JSON.stringify(this.replies))
                    .property('replyCount', this.replyCount)
                    .property('status', this.status)
                    .property('isEdited', this.isEdited)
                    .property('editHistory', JSON.stringify(this.editHistory))
                    .property('moderationStatus', this.moderationStatus)
                    .property('flags', JSON.stringify(this.flags))
                    .property('attachments', JSON.stringify(this.attachments))
                    .property('mentions', JSON.stringify(this.mentions))
                    .property('createdAt', this.createdAt)
                    .property('updatedAt', this.updatedAt)
                    .property('lastModifiedBy', this.lastModifiedBy)
                    .property('engagementScore', this.engagementScore)
                    .property('qualityScore', this.qualityScore)
                    .property('sentimentScore', this.sentimentScore)
                    .next();

                // Create relationships
                await Promise.all([
                    // AUTHORED relationship
                    g.V().has('User', 'id', this.authorId)
                        .addE('AUTHORED')
                        .to(__.V().has('Comment', 'id', this.id))
                        .property('createdAt', this.createdAt)
                        .iterate(),
                    
                    // COMMENTED_ON relationship
                    g.V().has('Comment', 'id', this.id)
                        .addE('COMMENTED_ON')
                        .to(__.V().has('Post', 'id', this.postId))
                        .property('createdAt', this.createdAt)
                        .iterate()
                ]);

                // If this is a reply, create REPLY_TO relationship
                if (this.parentCommentId) {
                    await g.V().has('Comment', 'id', this.id)
                        .addE('REPLY_TO')
                        .to(__.V().has('Comment', 'id', this.parentCommentId))
                        .property('createdAt', this.createdAt)
                        .iterate();

                    // Update parent comment reply count
                    await g.V().has('Comment', 'id', this.parentCommentId)
                        .property('replyCount', __.values('replyCount').math('_ + 1'))
                        .iterate();
                }

                return this;
            }
        } catch (error) {
            throw new Error(`Error saving comment: ${error.message}`);
        }
    }

    async addLike(userId) {
        const g = db.getTraversal();
        
        try {
            // Check if user already liked the comment
            const existingLike = await g.V()
                .has('User', 'id', userId)
                .outE('LIKED')
                .filter(__.inV().has('Comment', 'id', this.id))
                .toList();

            if (existingLike.length > 0) {
                return false; // Already liked
            }

            // Add like relationship
            await g.V()
                .has('User', 'id', userId)
                .addE('LIKED')
                .to(__.V().has('Comment', 'id', this.id))
                .property('likedAt', new Date().toISOString())
                .iterate();

            // Update like count
            this.likes.push(userId);
            this.likeCount = this.likes.length;
            this.engagementScore += 1;

            await g.V().has('Comment', 'id', this.id)
                .property('likes', JSON.stringify(this.likes))
                .property('likeCount', this.likeCount)
                .property('engagementScore', this.engagementScore)
                .iterate();

            return true;
        } catch (error) {
            throw new Error(`Error adding like to comment: ${error.message}`);
        }
    }

    async removeLike(userId) {
        const g = db.getTraversal();
        
        try {
            // Remove like relationship
            await g.V()
                .has('User', 'id', userId)
                .outE('LIKED')
                .filter(__.inV().has('Comment', 'id', this.id))
                .drop()
                .iterate();

            // Update like count
            this.likes = this.likes.filter(id => id !== userId);
            this.likeCount = this.likes.length;
            this.engagementScore = Math.max(0, this.engagementScore - 1);

            await g.V().has('Comment', 'id', this.id)
                .property('likes', JSON.stringify(this.likes))
                .property('likeCount', this.likeCount)
                .property('engagementScore', this.engagementScore)
                .iterate();

            return true;
        } catch (error) {
            throw new Error(`Error removing like from comment: ${error.message}`);
        }
    }

    async getReplies() {
        const g = db.getTraversal();
        
        try {
            const replies = await g.V()
                .has('Comment', 'id', this.id)
                .inE('REPLY_TO')
                .outV()
                .elementMap()
                .toList();

            return replies.map(replyData => Comment.fromGraphData(replyData));
        } catch (error) {
            throw new Error(`Error getting replies: ${error.message}`);
        }
    }

    static async findById(id) {
        const g = db.getTraversal();
        
        try {
            const comments = await g.V().has('Comment', 'id', id).elementMap().toList();
            
            if (comments.length === 0) {
                return null;
            }

            return Comment.fromGraphData(comments[0]);
        } catch (error) {
            throw new Error(`Error finding comment by ID: ${error.message}`);
        }
    }

    static async findByPost(postId, includeReplies = true) {
        const g = db.getTraversal();
        
        try {
            let query = g.V().has('Comment', 'postId', postId);
            
            if (!includeReplies) {
                query = query.has('parentCommentId', null);
            }

            const comments = await query
                .order().by('createdAt', gremlin.process.Order.asc)
                .elementMap()
                .toList();

            const commentObjects = comments.map(commentData => Comment.fromGraphData(commentData));

            // If including replies, organize them in a nested structure
            if (includeReplies) {
                return this.organizeCommentsWithReplies(commentObjects);
            }

            return commentObjects;
        } catch (error) {
            throw new Error(`Error finding comments for post: ${error.message}`);
        }
    }

    static organizeCommentsWithReplies(comments) {
        const commentMap = new Map();
        const topLevelComments = [];

        // First pass: create map and identify top-level comments
        comments.forEach(comment => {
            commentMap.set(comment.id, { ...comment, replies: [] });
            if (!comment.parentCommentId) {
                topLevelComments.push(comment.id);
            }
        });

        // Second pass: organize replies under their parents
        comments.forEach(comment => {
            if (comment.parentCommentId) {
                const parent = commentMap.get(comment.parentCommentId);
                if (parent) {
                    parent.replies.push(commentMap.get(comment.id));
                }
            }
        });

        // Return only top-level comments with their nested replies
        return topLevelComments.map(id => commentMap.get(id));
    }

    static async findByUser(userId) {
        const g = db.getTraversal();
        
        try {
            const comments = await g.V()
                .has('Comment', 'authorId', userId)
                .order().by('createdAt', gremlin.process.Order.desc)
                .elementMap()
                .toList();

            return comments.map(commentData => Comment.fromGraphData(commentData));
        } catch (error) {
            throw new Error(`Error finding comments by user: ${error.message}`);
        }
    }

    static async delete(id, userId) {
        const g = db.getTraversal();
        
        try {
            // Verify ownership or admin rights
            const comment = await g.V().has('Comment', 'id', id).elementMap().next();
            if (!comment.value) {
                throw new Error('Comment not found');
            }

            const authorId = comment.value.get('authorId');
            if (authorId !== userId) {
                throw new Error('Not authorized to delete this comment');
            }

            // Soft delete - mark as deleted but keep for thread integrity
            await g.V().has('Comment', 'id', id)
                .property('status', 'deleted')
                .property('content', '[This comment has been deleted]')
                .property('updatedAt', new Date().toISOString())
                .iterate();

            return true;
        } catch (error) {
            throw new Error(`Error deleting comment: ${error.message}`);
        }
    }

    static async hardDelete(id) {
        const g = db.getTraversal();
        
        try {
            // Delete all relationships first
            await g.V().has('Comment', 'id', id)
                .bothE()
                .drop()
                .iterate();
            
            // Delete comment vertex
            await g.V().has('Comment', 'id', id).drop().iterate();
            
            return true;
        } catch (error) {
            throw new Error(`Error permanently deleting comment: ${error.message}`);
        }
    }

    static fromGraphData(data) {
        const commentData = {};
        
        // Convert Map to object and parse JSON fields
        for (const [key, value] of data.entries()) {
            if (key === gremlin.process.T.label || key === gremlin.process.T.id) {
                continue;
            }
            
            // Parse JSON fields
            const jsonFields = [
                'likes', 'replies', 'editHistory', 'flags',
                'attachments', 'mentions'
            ];
            
            if (jsonFields.includes(key) && typeof value === 'string') {
                try {
                    commentData[key] = JSON.parse(value);
                } catch (e) {
                    commentData[key] = value;
                }
            } else {
                commentData[key] = value;
            }
        }

        return new Comment(commentData);
    }

    toJSON() {
        const obj = { ...this };
        
        // Remove sensitive fields from public JSON
        delete obj.flags;
        delete obj.moderationStatus;
        
        return obj;
    }
}

module.exports = Comment;