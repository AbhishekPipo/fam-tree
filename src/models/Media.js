const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class Media {
  constructor(data) {
    // Identity
    this.id = data.id || uuidv4();
    
    // File Information
    this.filename = data.filename;
    this.originalName = data.originalName;
    this.mimeType = data.mimeType;
    this.size = data.size;
    this.url = data.url;
    
    // Media Details
    this.mediaType = data.mediaType || this.determineMediaType(data.mimeType);
    this.title = data.title || null;
    this.description = data.description || null;
    
    // Photo/Video Specific
    this.dimensions = data.dimensions || null;
    this.duration = data.duration || null;
    
    // Metadata
    this.uploadedAt = data.uploadedAt || new Date().toISOString();
    this.uploadedBy = data.uploadedBy;
    
    // Organization
    this.tags = data.tags || [];
    this.album = data.album || null;
    
    // Privacy
    this.visibility = data.visibility || 'family';
    
    // Technical
    this.checksum = data.checksum || null;
  }

  // Determine media type from MIME type
  determineMediaType(mimeType) {
    if (!mimeType) return 'document';
    
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  // Validation
  validate() {
    const errors = [];

    if (!this.filename || this.filename.trim().length === 0) {
      errors.push('Filename is required');
    }

    if (!this.originalName || this.originalName.trim().length === 0) {
      errors.push('Original filename is required');
    }

    if (!this.mimeType) {
      errors.push('MIME type is required');
    }

    if (!this.size || this.size <= 0) {
      errors.push('Valid file size is required');
    }

    if (!this.url) {
      errors.push('File URL is required');
    }

    if (!this.uploadedBy) {
      errors.push('Uploader ID is required');
    }

    const validMediaTypes = ['photo', 'video', 'document', 'audio'];
    if (!validMediaTypes.includes(this.mediaType)) {
      errors.push('Invalid media type');
    }

    const validVisibilities = ['public', 'family', 'private'];
    if (!validVisibilities.includes(this.visibility)) {
      errors.push('Invalid visibility setting');
    }

    // File size limits (in bytes)
    const maxSizes = {
      photo: 10 * 1024 * 1024,    // 10MB
      video: 100 * 1024 * 1024,   // 100MB
      audio: 50 * 1024 * 1024,    // 50MB
      document: 25 * 1024 * 1024  // 25MB
    };

    if (this.size > maxSizes[this.mediaType]) {
      errors.push(`File size exceeds maximum allowed for ${this.mediaType} files`);
    }

    return errors;
  }

  // Generate file checksum
  async generateChecksum(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      console.error('Error generating checksum:', error);
      return null;
    }
  }

  // Convert to JSON
  toJSON() {
    return { ...this };
  }

  // Save media to Neo4j
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    const cypher = `
      MERGE (m:Media {id: $id})
      SET m += $properties
      RETURN m
    `;

    const result = await database.runQuery(cypher, {
      id: this.id,
      properties: this.toJSON()
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to save media', 500, 'SAVE_FAILED');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'm');
  }

  // Static methods
  static async findById(id) {
    const cypher = `
      MATCH (m:Media {id: $id})
      OPTIONAL MATCH (p:Person)-[r:HAS_PHOTO|TAGGED_IN]->(m)
      OPTIONAL MATCH (e:Event)-[:DOCUMENTED_BY]->(m)
      RETURN m, 
             collect(DISTINCT {person: p, relationship: type(r)}) as people,
             collect(DISTINCT e) as events
    `;
    
    const result = await database.runQuery(cypher, { id });
    
    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const media = database.constructor.extractNodeProperties(record, 'm');
    
    const people = record.get('people')
      .filter(p => p.person !== null)
      .map(p => ({
        person: database.constructor.extractNodeProperties({ get: () => p.person }, ''),
        relationship: p.relationship
      }));

    const events = record.get('events')
      .filter(e => e !== null)
      .map(e => database.constructor.extractNodeProperties({ get: () => e }, ''));

    return {
      ...media,
      people,
      events
    };
  }

  static async findAll(filters = {}) {
    let cypher = 'MATCH (m:Media)';
    const params = {};
    const conditions = [];

    // Apply filters
    if (filters.mediaType) {
      conditions.push('m.mediaType = $mediaType');
      params.mediaType = filters.mediaType;
    }

    if (filters.uploadedBy) {
      conditions.push('m.uploadedBy = $uploadedBy');
      params.uploadedBy = filters.uploadedBy;
    }

    if (filters.visibility) {
      conditions.push('m.visibility = $visibility');
      params.visibility = filters.visibility;
    }

    if (filters.album) {
      conditions.push('m.album = $album');
      params.album = filters.album;
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push('ANY(tag IN $tags WHERE tag IN m.tags)');
      params.tags = filters.tags;
    }

    if (filters.startDate) {
      conditions.push('m.uploadedAt >= $startDate');
      params.startDate = filters.startDate;
    }

    if (filters.endDate) {
      conditions.push('m.uploadedAt <= $endDate');
      params.endDate = filters.endDate;
    }

    if (conditions.length > 0) {
      cypher += ' WHERE ' + conditions.join(' AND ');
    }

    cypher += ' RETURN m ORDER BY m.uploadedAt DESC';

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => 
      database.constructor.extractNodeProperties(record, 'm')
    );
  }

  static async findByPerson(personId) {
    const cypher = `
      MATCH (p:Person {id: $personId})-[r:HAS_PHOTO|TAGGED_IN]->(m:Media)
      RETURN m, type(r) as relationshipType
      ORDER BY m.uploadedAt DESC
    `;

    const result = await database.runQuery(cypher, { personId });
    
    return result.records.map(record => ({
      media: database.constructor.extractNodeProperties(record, 'm'),
      relationshipType: record.get('relationshipType')
    }));
  }

  static async findByEvent(eventId) {
    const cypher = `
      MATCH (e:Event {id: $eventId})-[r:DOCUMENTED_BY]->(m:Media)
      RETURN m, r.documentType as documentType, r.isPrimary as isPrimary
      ORDER BY r.isPrimary DESC, m.uploadedAt
    `;

    const result = await database.runQuery(cypher, { eventId });
    
    return result.records.map(record => ({
      media: database.constructor.extractNodeProperties(record, 'm'),
      documentType: record.get('documentType'),
      isPrimary: record.get('isPrimary')
    }));
  }

  static async create(mediaData) {
    const media = new Media(mediaData);
    return await media.save();
  }

  static async update(id, updateData) {
    const cypher = `
      MATCH (m:Media {id: $id})
      SET m += $properties
      RETURN m
    `;

    const result = await database.runQuery(cypher, {
      id,
      properties: updateData
    });

    if (result.records.length === 0) {
      throw new AppError('Media not found', 404, 'MEDIA_NOT_FOUND');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'm');
  }

  static async delete(id) {
    // First get the media to access file path for cleanup
    const media = await Media.findById(id);
    if (!media) {
      throw new AppError('Media not found', 404, 'MEDIA_NOT_FOUND');
    }

    const cypher = `
      MATCH (m:Media {id: $id})
      DETACH DELETE m
      RETURN count(m) as deletedCount
    `;

    const result = await database.runQuery(cypher, { id });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('Media not found', 404, 'MEDIA_NOT_FOUND');
    }

    // Clean up physical file (optional - implement based on storage strategy)
    try {
      if (media.url && media.url.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', media.url);
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.warn('Could not delete physical file:', error.message);
    }

    return { deletedCount };
  }

  // Person-Media relationships
  static async addToPersonPhoto(personId, mediaId, isProfilePicture = false, photoDate = null, location = null, tags = []) {
    const cypher = `
      MATCH (p:Person {id: $personId})
      MATCH (m:Media {id: $mediaId})
      MERGE (p)-[r:HAS_PHOTO]->(m)
      SET r.isProfilePicture = $isProfilePicture,
          r.photoDate = $photoDate,
          r.location = $location,
          r.tags = $tags
      RETURN r
    `;

    const result = await database.runQuery(cypher, {
      personId,
      mediaId,
      isProfilePicture,
      photoDate,
      location,
      tags
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to add photo to person', 500, 'ADD_PHOTO_FAILED');
    }

    // If this is set as profile picture, remove profile picture flag from other photos
    if (isProfilePicture) {
      await database.runQuery(`
        MATCH (p:Person {id: $personId})-[r:HAS_PHOTO]->(m:Media)
        WHERE m.id <> $mediaId AND r.isProfilePicture = true
        SET r.isProfilePicture = false
      `, { personId, mediaId });
    }

    return database.constructor.extractRelationshipProperties(result.records[0], 'r');
  }

  static async tagPersonInMedia(mediaId, personId, taggedBy, position = null) {
    const cypher = `
      MATCH (p:Person {id: $personId})
      MATCH (m:Media {id: $mediaId})
      MERGE (p)-[r:TAGGED_IN]->(m)
      SET r.taggedBy = $taggedBy,
          r.taggedDate = $taggedDate,
          r.position = $position,
          r.confirmed = false
      RETURN r
    `;

    const result = await database.runQuery(cypher, {
      personId,
      mediaId,
      taggedBy,
      taggedDate: new Date().toISOString(),
      position
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to tag person in media', 500, 'TAG_PERSON_FAILED');
    }

    return database.constructor.extractRelationshipProperties(result.records[0], 'r');
  }

  static async confirmTag(mediaId, personId) {
    const cypher = `
      MATCH (p:Person {id: $personId})-[r:TAGGED_IN]->(m:Media {id: $mediaId})
      SET r.confirmed = true
      RETURN r
    `;

    const result = await database.runQuery(cypher, { personId, mediaId });
    
    if (result.records.length === 0) {
      throw new AppError('Tag not found', 404, 'TAG_NOT_FOUND');
    }

    return database.constructor.extractRelationshipProperties(result.records[0], 'r');
  }

  static async removePersonFromMedia(personId, mediaId, relationshipType = 'HAS_PHOTO') {
    const cypher = `
      MATCH (p:Person {id: $personId})-[r:${relationshipType}]->(m:Media {id: $mediaId})
      DELETE r
      RETURN count(r) as deletedCount
    `;

    const result = await database.runQuery(cypher, { personId, mediaId });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('Relationship not found', 404, 'RELATIONSHIP_NOT_FOUND');
    }

    return { deletedCount };
  }

  // Album management
  static async createAlbum(albumName, description = null, createdBy, visibility = 'family') {
    // Albums are represented as a special property on media items
    // This method helps organize media into albums
    return {
      name: albumName,
      description,
      createdBy,
      visibility,
      createdAt: new Date().toISOString()
    };
  }

  static async getAlbumMedia(albumName, filters = {}) {
    let cypher = 'MATCH (m:Media {album: $albumName})';
    const params = { albumName };
    const conditions = [];

    if (filters.mediaType) {
      conditions.push('m.mediaType = $mediaType');
      params.mediaType = filters.mediaType;
    }

    if (filters.visibility) {
      conditions.push('m.visibility = $visibility');
      params.visibility = filters.visibility;
    }

    if (conditions.length > 0) {
      cypher += ' WHERE ' + conditions.join(' AND ');
    }

    cypher += ' RETURN m ORDER BY m.uploadedAt';

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => 
      database.constructor.extractNodeProperties(record, 'm')
    );
  }

  static async getAlbums(userId = null) {
    let cypher = 'MATCH (m:Media) WHERE m.album IS NOT NULL';
    const params = {};

    if (userId) {
      cypher += ' AND m.uploadedBy = $userId';
      params.userId = userId;
    }

    cypher += `
      RETURN m.album as albumName, 
             count(m) as mediaCount,
             min(m.uploadedAt) as createdAt,
             collect(DISTINCT m.mediaType) as mediaTypes
      ORDER BY createdAt DESC
    `;

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => ({
      name: record.get('albumName'),
      mediaCount: record.get('mediaCount').toNumber(),
      createdAt: record.get('createdAt'),
      mediaTypes: record.get('mediaTypes')
    }));
  }

  // Search and discovery
  static async searchByTags(tags) {
    const cypher = `
      MATCH (m:Media)
      WHERE ANY(tag IN $tags WHERE tag IN m.tags)
      RETURN m, 
             size([tag IN $tags WHERE tag IN m.tags]) as matchCount
      ORDER BY matchCount DESC, m.uploadedAt DESC
    `;

    const result = await database.runQuery(cypher, { tags });
    
    return result.records.map(record => ({
      media: database.constructor.extractNodeProperties(record, 'm'),
      matchCount: record.get('matchCount').toNumber()
    }));
  }

  static async getMediaStats(userId = null) {
    let cypher = 'MATCH (m:Media)';
    const params = {};

    if (userId) {
      cypher += ' WHERE m.uploadedBy = $userId';
      params.userId = userId;
    }

    cypher += `
      RETURN 
        count(m) as totalMedia,
        sum(m.size) as totalSize,
        count(CASE WHEN m.mediaType = 'photo' THEN 1 END) as photoCount,
        count(CASE WHEN m.mediaType = 'video' THEN 1 END) as videoCount,
        count(CASE WHEN m.mediaType = 'document' THEN 1 END) as documentCount,
        count(CASE WHEN m.mediaType = 'audio' THEN 1 END) as audioCount,
        count(DISTINCT m.album) as albumCount
    `;

    const result = await database.runQuery(cypher, params);
    
    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    return {
      totalMedia: record.get('totalMedia').toNumber(),
      totalSize: record.get('totalSize').toNumber(),
      breakdown: {
        photos: record.get('photoCount').toNumber(),
        videos: record.get('videoCount').toNumber(),
        documents: record.get('documentCount').toNumber(),
        audio: record.get('audioCount').toNumber()
      },
      albumCount: record.get('albumCount').toNumber()
    };
  }

  // Utility methods
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isImageFile(mimeType) {
    return mimeType && mimeType.startsWith('image/');
  }

  static isVideoFile(mimeType) {
    return mimeType && mimeType.startsWith('video/');
  }

  static isAudioFile(mimeType) {
    return mimeType && mimeType.startsWith('audio/');
  }

  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase().substring(1);
  }
}

module.exports = Media;