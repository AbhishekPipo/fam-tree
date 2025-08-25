const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class Post {
  constructor(data) {
    // Identity
    this.id = data.id || uuidv4();
    
    // Content
    this.content = data.content;
    this.title = data.title || null;
    this.type = data.type || 'text'; // text, photo, video, memory, announcement, emergency
    
    // Media
    this.media = data.media || [];
    this.attachments = data.attachments || [];
    
    // Metadata
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.authorId = data.authorId;
    
    // Visibility and targeting
    this.visibility = data.visibility || 'family'; // public, family, private
    this.targetAudience = data.targetAudience || []; // specific family member IDs
    
    // Interaction
    this.likes = data.likes || [];
    this.comments = data.comments || [];
    this.shares = data.shares || [];
    
    // Special properties
    this.isMemory = data.isMemory || false;
    this.isEmergency = data.isEmergency || false;
    this.isAnnouncement = data.isAnnouncement || false;
    this.isPinned = data.isPinned || false;
    
    // Location
    this.location = data.location || null;
    
    // Tags
    this.tags = data.tags || [];
    this.mentionedUsers = data.mentionedUsers || [];
  }

  // Validation
  validate() {
    const errors = [];

    if (!this.content || this.content.trim().length === 0) {
      errors.push('Post content is required');
    }

    if (this.content && this.content.length > 5000) {
      errors.push('Post content must be less than 5000 characters');
    }

    if (!this.authorId) {
      errors.push('Author ID is required');
    }

    const validTypes = ['text', 'photo', 'video', 'memory', 'announcement', 'emergency'];
    if (!validTypes.includes(this.type)) {
      errors.push('Invalid post type');
    }

    const validVisibilities = ['public', 'family', 'private'];
    if (!validVisibilities.includes(this.visibility)) {
      errors.push('Invalid visibility setting');
    }

    return errors;
  }

  // Convert to JSON
  toJSON() {
    return { ...this };
  }

  // Save post to Neo4j
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    this.updatedAt = new Date().toISOString();

    const cypher = `
      MERGE (p:Post {id: $id})
      SET p += $properties
      WITH p
      MATCH (u:User {id: $authorId})
      MERGE (u)-[:AUTHORED]->(p)
      RETURN p
    `;

    const result = await database.runQuery(cypher, {
      id: this.id,
      authorId: this.authorId,
      properties: this.toJSON()
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to save post', 500, 'SAVE_FAILED');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'p');
  }

  // Static methods
  static async findById(id) {
    const cypher = `
      MATCH (p:Post {id: $id})
      OPTIONAL MATCH (u:User)-[:AUTHORED]->(p)
      OPTIONAL MATCH (p)-[:HAS_MEDIA]->(m:Media)
      OPTIONAL MATCH (liker:User)-[:LIKED]->(p)
      OPTIONAL MATCH (p)<-[:COMMENTED_ON]-(c:Comment)<-[:AUTHORED]-(commenter:User)
      RETURN p, 
             u as author,
             collect(DISTINCT m) as media,
             collect(DISTINCT liker) as likers,
             collect(DISTINCT {comment: c, commenter: commenter}) as comments
    `;
    
    const result = await database.runQuery(cypher, { id });
    
    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const post = database.constructor.extractNodeProperties(record, 'p');
    const author = database.constructor.extractNodeProperties(record, 'author');
    
    const media = record.get('media')
      .filter(m => m !== null)
      .map(m => database.constructor.extractNodeProperties({ get: () => m }, ''));

    const likers = record.get('likers')
      .filter(l => l !== null)
      .map(l => database.constructor.extractNodeProperties({ get: () => l }, ''));

    const comments = record.get('comments')
      .filter(c => c.comment !== null)
      .map(c => ({
        comment: database.constructor.extractNodeProperties({ get: () => c.comment }, ''),
        commenter: database.constructor.extractNodeProperties({ get: () => c.commenter }, '')
      }));

    return {
      ...post,
      author,
      media,
      likers,
      comments,
      likesCount: likers.length,
      commentsCount: comments.length
    };
  }

  static async findAll(filters = {}) {
    let cypher = `
      MATCH (p:Post)
      OPTIONAL MATCH (u:User)-[:AUTHORED]->(p)
    `;
    const params = {};
    const conditions = [];

    // Apply filters
    if (filters.type) {
      conditions.push('p.type = $type');
      params.type = filters.type;
    }

    if (filters.authorId) {
      conditions.push('u.id = $authorId');
      params.authorId = filters.authorId;
    }

    if (filters.visibility) {
      conditions.push('p.visibility = $visibility');
      params.visibility = filters.visibility;
    }

    if (filters.isMemory !== undefined) {
      conditions.push('p.isMemory = $isMemory');
      params.isMemory = filters.isMemory;
    }

    if (filters.isEmergency !== undefined) {
      conditions.push('p.isEmergency = $isEmergency');
      params.isEmergency = filters.isEmergency;
    }

    if (filters.isPinned !== undefined) {
      conditions.push('p.isPinned = $isPinned');
      params.isPinned = filters.isPinned;
    }

    if (conditions.length > 0) {
      cypher += ' WHERE ' + conditions.join(' AND ');
    }

    cypher += `
      OPTIONAL MATCH (liker:User)-[:LIKED]->(p)
      OPTIONAL MATCH (p)<-[:COMMENTED_ON]-(c:Comment)
      RETURN p, u as author,
             count(DISTINCT liker) as likesCount,
             count(DISTINCT c) as commentsCount
      ORDER BY p.isPinned DESC, p.createdAt DESC
    `;

    if (filters.limit) {
      cypher += ` LIMIT ${parseInt(filters.limit)}`;
    }

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => ({
      ...database.constructor.extractNodeProperties(record, 'p'),
      author: database.constructor.extractNodeProperties(record, 'author'),
      likesCount: record.get('likesCount').toNumber(),
      commentsCount: record.get('commentsCount').toNumber()
    }));
  }

  static async getFeed(userId, filters = {}) {
    // Get posts from family members and user's own posts
    const cypher = `
      MATCH (currentUser:User {id: $userId})
      MATCH (currentUser)-[:FAMILY_MEMBER*1..3]-(familyMember:User)
      MATCH (familyMember)-[:AUTHORED]->(p:Post)
      WHERE p.visibility IN ['public', 'family']
         OR (p.visibility = 'private' AND familyMember.id = $userId)
         OR (p.visibility = 'private' AND $userId IN p.targetAudience)
      
      OPTIONAL MATCH (liker:User)-[:LIKED]->(p)
      OPTIONAL MATCH (p)<-[:COMMENTED_ON]-(c:Comment)
      
      RETURN p, familyMember as author,
             count(DISTINCT liker) as likesCount,
             count(DISTINCT c) as commentsCount
      ORDER BY p.isPinned DESC, p.isEmergency DESC, p.createdAt DESC
      LIMIT ${filters.limit || 50}
    `;

    const result = await database.runQuery(cypher, { userId });
    
    return result.records.map(record => ({
      ...database.constructor.extractNodeProperties(record, 'p'),
      author: database.constructor.extractNodeProperties(record, 'author'),
      likesCount: record.get('likesCount').toNumber(),
      commentsCount: record.get('commentsCount').toNumber()
    }));
  }

  static async create(postData) {
    const post = new Post(postData);
    return await post.save();
  }

  static async update(id, updateData) {
    updateData.updatedAt = new Date().toISOString();

    const cypher = `
      MATCH (p:Post {id: $id})
      SET p += $properties
      RETURN p
    `;

    const result = await database.runQuery(cypher, {
      id,
      properties: updateData
    });

    if (result.records.length === 0) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'p');
  }

  static async delete(id) {
    const cypher = `
      MATCH (p:Post {id: $id})
      DETACH DELETE p
      RETURN count(p) as deletedCount
    `;

    const result = await database.runQuery(cypher, { id });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('Post not found', 404, 'POST_NOT_FOUND');
    }

    return { deletedCount };
  }

  // Like/Unlike functionality
  static async toggleLike(postId, userId) {
    const checkCypher = `
      MATCH (u:User {id: $userId})
      MATCH (p:Post {id: $postId})
      OPTIONAL MATCH (u)-[r:LIKED]->(p)
      RETURN r
    `;

    const checkResult = await database.runQuery(checkCypher, { postId, userId });
    const existingLike = checkResult.records[0].get('r');

    if (existingLike) {
      // Unlike
      const unlikeCypher = `
        MATCH (u:User {id: $userId})-[r:LIKED]->(p:Post {id: $postId})
        DELETE r
        RETURN count(r) as deletedCount
      `;
      
      await database.runQuery(unlikeCypher, { postId, userId });
      return { action: 'unliked' };
    } else {
      // Like
      const likeCypher = `
        MATCH (u:User {id: $userId})
        MATCH (p:Post {id: $postId})
        MERGE (u)-[r:LIKED]->(p)
        SET r.createdAt = datetime()
        RETURN r
      `;
      
      await database.runQuery(likeCypher, { postId, userId });
      return { action: 'liked' };
    }
  }

  // Comment functionality
  static async addComment(postId, userId, content) {
    const commentId = uuidv4();
    
    const cypher = `
      MATCH (u:User {id: $userId})
      MATCH (p:Post {id: $postId})
      CREATE (c:Comment {
        id: $commentId,
        content: $content,
        createdAt: datetime(),
        updatedAt: datetime()
      })
      CREATE (u)-[:AUTHORED]->(c)
      CREATE (c)-[:COMMENTED_ON]->(p)
      RETURN c, u as author
    `;

    const result = await database.runQuery(cypher, {
      postId,
      userId,
      commentId,
      content
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to add comment', 500, 'COMMENT_FAILED');
    }

    const record = result.records[0];
    return {
      comment: database.constructor.extractNodeProperties(record, 'c'),
      author: database.constructor.extractNodeProperties(record, 'author')
    };
  }

  static async deleteComment(commentId, userId) {
    const cypher = `
      MATCH (u:User {id: $userId})-[:AUTHORED]->(c:Comment {id: $commentId})
      DETACH DELETE c
      RETURN count(c) as deletedCount
    `;

    const result = await database.runQuery(cypher, { commentId, userId });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('Comment not found or unauthorized', 404, 'COMMENT_NOT_FOUND');
    }

    return { deletedCount };
  }

  // Search functionality
  static async search(searchTerm) {
    const cypher = `
      CALL db.index.fulltext.queryNodes('post_search_index', $searchTerm)
      YIELD node, score
      MATCH (author:User)-[:AUTHORED]->(node)
      RETURN node as p, author, score
      ORDER BY score DESC
      LIMIT 50
    `;

    const result = await database.runQuery(cypher, { searchTerm });
    
    return result.records.map(record => ({
      post: {
        ...database.constructor.extractNodeProperties(record, 'p'),
        author: database.constructor.extractNodeProperties(record, 'author')
      },
      score: record.get('score')
    }));
  }

  // Get posts by user
  static async findByUser(userId, filters = {}) {
    let cypher = `
      MATCH (u:User {id: $userId})-[:AUTHORED]->(p:Post)
    `;
    const params = { userId };
    const conditions = [];

    if (filters.type) {
      conditions.push('p.type = $type');
      params.type = filters.type;
    }

    if (conditions.length > 0) {
      cypher += ' WHERE ' + conditions.join(' AND ');
    }

    cypher += `
      OPTIONAL MATCH (liker:User)-[:LIKED]->(p)
      OPTIONAL MATCH (p)<-[:COMMENTED_ON]-(c:Comment)
      RETURN p, u as author,
             count(DISTINCT liker) as likesCount,
             count(DISTINCT c) as commentsCount
      ORDER BY p.createdAt DESC
    `;

    if (filters.limit) {
      cypher += ` LIMIT ${parseInt(filters.limit)}`;
    }

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => ({
      ...database.constructor.extractNodeProperties(record, 'p'),
      author: database.constructor.extractNodeProperties(record, 'author'),
      likesCount: record.get('likesCount').toNumber(),
      commentsCount: record.get('commentsCount').toNumber()
    }));
  }
}

module.exports = Post;