const gremlin = require('gremlin');
const { v4: uuidv4 } = require('crypto').webcrypto ? { v4: () => crypto.randomUUID() } : require('uuid');
const db = require('../../config/database');

const __ = gremlin.process.statics;

// Media types and configurations
const MEDIA_TYPES = {
    'image': {
        category: 'visual',
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
        maxSize: 10 * 1024 * 1024, // 10MB
        thumbnailSupported: true,
        description: 'Image files'
    },
    'video': {
        category: 'visual',
        allowedExtensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'],
        maxSize: 100 * 1024 * 1024, // 100MB
        thumbnailSupported: true,
        description: 'Video files'
    },
    'audio': {
        category: 'media',
        allowedExtensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
        maxSize: 50 * 1024 * 1024, // 50MB
        thumbnailSupported: false,
        description: 'Audio files'
    },
    'document': {
        category: 'document',
        allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
        maxSize: 25 * 1024 * 1024, // 25MB
        thumbnailSupported: true,
        description: 'Document files'
    },
    'spreadsheet': {
        category: 'document',
        allowedExtensions: ['.xls', '.xlsx', '.csv', '.ods'],
        maxSize: 25 * 1024 * 1024, // 25MB
        thumbnailSupported: true,
        description: 'Spreadsheet files'
    },
    'presentation': {
        category: 'document',
        allowedExtensions: ['.ppt', '.pptx', '.odp'],
        maxSize: 25 * 1024 * 1024, // 25MB
        thumbnailSupported: true,
        description: 'Presentation files'
    },
    'archive': {
        category: 'utility',
        allowedExtensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
        maxSize: 100 * 1024 * 1024, // 100MB
        thumbnailSupported: false,
        description: 'Archive files'
    }
};

// Media quality/resolution types
const MEDIA_QUALITY = {
    'original': { width: null, height: null, quality: 100 },
    'high': { width: 1920, height: 1080, quality: 90 },
    'medium': { width: 1280, height: 720, quality: 80 },
    'low': { width: 854, height: 480, quality: 70 },
    'thumbnail': { width: 300, height: 300, quality: 60 }
};

class Media {
    constructor(data) {
        this.id = data.id || uuidv4();
        this.filename = data.filename;
        this.originalName = data.originalName;
        this.mimeType = data.mimeType;
        this.mediaType = data.mediaType || this.determineMediaType();
        this.extension = data.extension || this.extractExtension();
        
        // File properties
        this.size = data.size || 0;
        this.fileHash = data.fileHash || null; // For duplicate detection
        this.checksum = data.checksum || null;
        
        // Storage information
        this.url = data.url;
        this.publicUrl = data.publicUrl || null;
        this.cdnUrl = data.cdnUrl || null;
        this.storageProvider = data.storageProvider || 'local';
        this.storageLocation = data.storageLocation || null;
        this.bucket = data.bucket || null;
        this.path = data.path || null;
        
        // Media metadata
        this.dimensions = data.dimensions || { width: null, height: null };
        this.duration = data.duration || null; // For video/audio
        this.resolution = data.resolution || null;
        this.aspectRatio = data.aspectRatio || null;
        this.colorSpace = data.colorSpace || null;
        this.bitrate = data.bitrate || null;
        this.frameRate = data.frameRate || null;
        
        // Thumbnails and variants
        this.thumbnails = data.thumbnails || {};
        this.variants = data.variants || {}; // Different quality versions
        this.previewUrl = data.previewUrl || null;
        
        // Content information
        this.title = data.title || this.originalName;
        this.description = data.description || null;
        this.altText = data.altText || null;
        this.caption = data.caption || null;
        this.keywords = data.keywords || [];
        this.tags = data.tags || [];
        
        // Ownership and permissions
        this.uploadedBy = data.uploadedBy;
        this.ownerId = data.ownerId || data.uploadedBy;
        this.visibility = data.visibility || 'private';
        this.permissions = data.permissions || {
            view: ['owner'],
            edit: ['owner'],
            delete: ['owner'],
            share: ['owner']
        };
        
        // EXIF and technical metadata
        this.exifData = data.exifData || {};
        this.gpsData = data.gpsData || null;
        this.cameraInfo = data.cameraInfo || {};
        this.shootingConditions = data.shootingConditions || {};
        
        // Date and location context
        this.dateTaken = data.dateTaken || null; // When photo/video was taken
        this.dateUploaded = data.dateUploaded || new Date().toISOString();
        this.location = data.location || null;
        this.venue = data.venue || null;
        this.coordinates = data.coordinates || null;
        
        // Family tree context
        this.peopleTagged = data.peopleTagged || [];
        this.eventsLinked = data.eventsLinked || [];
        this.familyTreeIds = data.familyTreeIds || [];
        this.relatedPosts = data.relatedPosts || [];
        this.historicalPeriod = data.historicalPeriod || null;
        this.decade = data.decade || null;
        
        // Processing status
        this.processingStatus = data.processingStatus || 'pending'; // pending, processing, completed, failed
        this.processingErrors = data.processingErrors || [];
        this.isProcessed = data.isProcessed || false;
        this.thumbnailGenerated = data.thumbnailGenerated || false;
        this.variantsGenerated = data.variantsGenerated || false;
        
        // Engagement and usage
        this.viewCount = data.viewCount || 0;
        this.downloadCount = data.downloadCount || 0;
        this.shareCount = data.shareCount || 0;
        this.favoriteCount = data.favoriteCount || 0;
        this.usageHistory = data.usageHistory || [];
        
        // Quality and content analysis
        this.qualityScore = data.qualityScore || 0;
        this.contentScore = data.contentScore || 0;
        this.faceCount = data.faceCount || 0;
        this.objectsDetected = data.objectsDetected || [];
        this.textExtracted = data.textExtracted || null;
        this.languageDetected = data.languageDetected || null;
        
        // System fields
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.lastAccessedAt = data.lastAccessedAt || null;
        this.lastModifiedBy = data.lastModifiedBy || data.uploadedBy;
        
        // Status and lifecycle
        this.status = data.status || 'active'; // active, archived, deleted, quarantined
        this.isPublic = data.isPublic || false;
        this.isFeatured = data.isFeatured || false;
        this.isOriginal = data.isOriginal !== false;
        this.parentMediaId = data.parentMediaId || null; // For variants/derivatives
        
        // Backup and sync
        this.backupStatus = data.backupStatus || 'pending';
        this.backupLocations = data.backupLocations || [];
        this.syncStatus = data.syncStatus || 'synced';
        this.lastBackupAt = data.lastBackupAt || null;
        
        // Content moderation
        this.moderationStatus = data.moderationStatus || 'pending';
        this.moderationFlags = data.moderationFlags || [];
        this.isApproved = data.isApproved || false;
        this.contentWarnings = data.contentWarnings || [];
    }

    determineMediaType() {
        if (!this.mimeType) return 'unknown';
        
        if (this.mimeType.startsWith('image/')) return 'image';
        if (this.mimeType.startsWith('video/')) return 'video';
        if (this.mimeType.startsWith('audio/')) return 'audio';
        if (this.mimeType.includes('pdf') || this.mimeType.includes('document')) return 'document';
        if (this.mimeType.includes('spreadsheet') || this.mimeType.includes('excel')) return 'spreadsheet';
        if (this.mimeType.includes('presentation') || this.mimeType.includes('powerpoint')) return 'presentation';
        if (this.mimeType.includes('zip') || this.mimeType.includes('archive')) return 'archive';
        
        return 'unknown';
    }

    extractExtension() {
        if (!this.originalName) return '';
        const lastDot = this.originalName.lastIndexOf('.');
        return lastDot > 0 ? this.originalName.substring(lastDot).toLowerCase() : '';
    }

    static getMediaTypes() {
        return MEDIA_TYPES;
    }

    static getMediaType(type) {
        return MEDIA_TYPES[type] || null;
    }

    static getMediaQualityOptions() {
        return MEDIA_QUALITY;
    }

    validate() {
        if (!this.filename) {
            throw new Error('Filename is required');
        }

        if (!this.uploadedBy) {
            throw new Error('Uploader ID is required');
        }

        if (!this.mimeType) {
            throw new Error('MIME type is required');
        }

        const mediaConfig = MEDIA_TYPES[this.mediaType];
        if (mediaConfig) {
            // Check file extension
            if (!mediaConfig.allowedExtensions.includes(this.extension)) {
                throw new Error(`File extension '${this.extension}' not allowed for media type '${this.mediaType}'`);
            }

            // Check file size
            if (this.size > mediaConfig.maxSize) {
                throw new Error(`File size exceeds maximum allowed size of ${mediaConfig.maxSize} bytes for media type '${this.mediaType}'`);
            }
        }

        return true;
    }

    async save() {
        const g = db.getTraversal();
        
        try {
            this.validate();
            this.updatedAt = new Date().toISOString();

            // Check if media exists
            const existingMedia = await g.V().has('Media', 'id', this.id).toList();
            
            if (existingMedia.length > 0) {
                // Update existing media
                const updateQuery = g.V().has('Media', 'id', this.id);
                
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
                // Create new media
                const mediaVertex = await g.addV('Media')
                    .property('id', this.id)
                    .property('filename', this.filename)
                    .property('originalName', this.originalName)
                    .property('mimeType', this.mimeType)
                    .property('mediaType', this.mediaType)
                    .property('extension', this.extension)
                    .property('size', this.size)
                    .property('fileHash', this.fileHash)
                    .property('checksum', this.checksum)
                    .property('url', this.url)
                    .property('publicUrl', this.publicUrl)
                    .property('cdnUrl', this.cdnUrl)
                    .property('storageProvider', this.storageProvider)
                    .property('storageLocation', this.storageLocation)
                    .property('bucket', this.bucket)
                    .property('path', this.path)
                    .property('dimensions', JSON.stringify(this.dimensions))
                    .property('duration', this.duration)
                    .property('resolution', this.resolution)
                    .property('aspectRatio', this.aspectRatio)
                    .property('colorSpace', this.colorSpace)
                    .property('bitrate', this.bitrate)
                    .property('frameRate', this.frameRate)
                    .property('thumbnails', JSON.stringify(this.thumbnails))
                    .property('variants', JSON.stringify(this.variants))
                    .property('previewUrl', this.previewUrl)
                    .property('title', this.title)
                    .property('description', this.description)
                    .property('altText', this.altText)
                    .property('caption', this.caption)
                    .property('keywords', JSON.stringify(this.keywords))
                    .property('tags', JSON.stringify(this.tags))
                    .property('uploadedBy', this.uploadedBy)
                    .property('ownerId', this.ownerId)
                    .property('visibility', this.visibility)
                    .property('permissions', JSON.stringify(this.permissions))
                    .property('exifData', JSON.stringify(this.exifData))
                    .property('gpsData', JSON.stringify(this.gpsData))
                    .property('cameraInfo', JSON.stringify(this.cameraInfo))
                    .property('shootingConditions', JSON.stringify(this.shootingConditions))
                    .property('dateTaken', this.dateTaken)
                    .property('dateUploaded', this.dateUploaded)
                    .property('location', JSON.stringify(this.location))
                    .property('venue', this.venue)
                    .property('coordinates', JSON.stringify(this.coordinates))
                    .property('peopleTagged', JSON.stringify(this.peopleTagged))
                    .property('eventsLinked', JSON.stringify(this.eventsLinked))
                    .property('familyTreeIds', JSON.stringify(this.familyTreeIds))
                    .property('relatedPosts', JSON.stringify(this.relatedPosts))
                    .property('historicalPeriod', this.historicalPeriod)
                    .property('decade', this.decade)
                    .property('processingStatus', this.processingStatus)
                    .property('processingErrors', JSON.stringify(this.processingErrors))
                    .property('isProcessed', this.isProcessed)
                    .property('thumbnailGenerated', this.thumbnailGenerated)
                    .property('variantsGenerated', this.variantsGenerated)
                    .property('viewCount', this.viewCount)
                    .property('downloadCount', this.downloadCount)
                    .property('shareCount', this.shareCount)
                    .property('favoriteCount', this.favoriteCount)
                    .property('usageHistory', JSON.stringify(this.usageHistory))
                    .property('qualityScore', this.qualityScore)
                    .property('contentScore', this.contentScore)
                    .property('faceCount', this.faceCount)
                    .property('objectsDetected', JSON.stringify(this.objectsDetected))
                    .property('textExtracted', this.textExtracted)
                    .property('languageDetected', this.languageDetected)
                    .property('createdAt', this.createdAt)
                    .property('updatedAt', this.updatedAt)
                    .property('lastAccessedAt', this.lastAccessedAt)
                    .property('lastModifiedBy', this.lastModifiedBy)
                    .property('status', this.status)
                    .property('isPublic', this.isPublic)
                    .property('isFeatured', this.isFeatured)
                    .property('isOriginal', this.isOriginal)
                    .property('parentMediaId', this.parentMediaId)
                    .property('backupStatus', this.backupStatus)
                    .property('backupLocations', JSON.stringify(this.backupLocations))
                    .property('syncStatus', this.syncStatus)
                    .property('lastBackupAt', this.lastBackupAt)
                    .property('moderationStatus', this.moderationStatus)
                    .property('moderationFlags', JSON.stringify(this.moderationFlags))
                    .property('isApproved', this.isApproved)
                    .property('contentWarnings', JSON.stringify(this.contentWarnings))
                    .next();

                // Create UPLOADED_BY relationship
                await g.V()
                    .has('User', 'id', this.uploadedBy)
                    .addE('UPLOADED')
                    .to(__.V().has('Media', 'id', this.id))
                    .property('uploadedAt', this.dateUploaded)
                    .iterate();

                return this;
            }
        } catch (error) {
            throw new Error(`Error saving media: ${error.message}`);
        }
    }

    async tagPerson(userId) {
        const g = db.getTraversal();
        
        try {
            // Check if person is already tagged
            if (this.peopleTagged.includes(userId)) {
                return false;
            }

            // Create TAGGED_IN relationship
            await g.V()
                .has('User', 'id', userId)
                .addE('TAGGED_IN')
                .to(__.V().has('Media', 'id', this.id))
                .property('taggedAt', new Date().toISOString())
                .property('taggedBy', this.uploadedBy)
                .iterate();

            // Update tagged people array
            this.peopleTagged.push(userId);
            await g.V().has('Media', 'id', this.id)
                .property('peopleTagged', JSON.stringify(this.peopleTagged))
                .property('updatedAt', new Date().toISOString())
                .iterate();

            return true;
        } catch (error) {
            throw new Error(`Error tagging person: ${error.message}`);
        }
    }

    async untagPerson(userId) {
        const g = db.getTraversal();
        
        try {
            // Remove TAGGED_IN relationship
            await g.V()
                .has('User', 'id', userId)
                .outE('TAGGED_IN')
                .filter(__.inV().has('Media', 'id', this.id))
                .drop()
                .iterate();

            // Update tagged people array
            this.peopleTagged = this.peopleTagged.filter(id => id !== userId);
            await g.V().has('Media', 'id', this.id)
                .property('peopleTagged', JSON.stringify(this.peopleTagged))
                .property('updatedAt', new Date().toISOString())
                .iterate();

            return true;
        } catch (error) {
            throw new Error(`Error untagging person: ${error.message}`);
        }
    }

    async linkToEvent(eventId) {
        const g = db.getTraversal();
        
        try {
            // Create DOCUMENTED_BY relationship
            await g.V()
                .has('Media', 'id', this.id)
                .addE('DOCUMENTED_BY')
                .to(__.V().has('Event', 'id', eventId))
                .property('linkedAt', new Date().toISOString())
                .iterate();

            // Update linked events array
            if (!this.eventsLinked.includes(eventId)) {
                this.eventsLinked.push(eventId);
                await g.V().has('Media', 'id', this.id)
                    .property('eventsLinked', JSON.stringify(this.eventsLinked))
                    .property('updatedAt', new Date().toISOString())
                    .iterate();
            }

            return true;
        } catch (error) {
            throw new Error(`Error linking to event: ${error.message}`);
        }
    }

    async incrementViewCount() {
        const g = db.getTraversal();
        
        try {
            this.viewCount += 1;
            this.lastAccessedAt = new Date().toISOString();

            await g.V().has('Media', 'id', this.id)
                .property('viewCount', this.viewCount)
                .property('lastAccessedAt', this.lastAccessedAt)
                .iterate();

            return this.viewCount;
        } catch (error) {
            throw new Error(`Error incrementing view count: ${error.message}`);
        }
    }

    static async findById(id) {
        const g = db.getTraversal();
        
        try {
            const mediaItems = await g.V().has('Media', 'id', id).elementMap().toList();
            
            if (mediaItems.length === 0) {
                return null;
            }

            return Media.fromGraphData(mediaItems[0]);
        } catch (error) {
            throw new Error(`Error finding media by ID: ${error.message}`);
        }
    }

    static async findAll(filters = {}) {
        const g = db.getTraversal();
        
        try {
            let query = g.V().hasLabel('Media');

            // Apply filters
            if (filters.uploadedBy) {
                query = query.has('uploadedBy', filters.uploadedBy);
            }
            if (filters.mediaType) {
                query = query.has('mediaType', filters.mediaType);
            }
            if (filters.visibility) {
                query = query.has('visibility', filters.visibility);
            }
            if (filters.status) {
                query = query.has('status', filters.status);
            }
            if (filters.isPublic !== undefined) {
                query = query.has('isPublic', filters.isPublic);
            }
            if (filters.isFeatured !== undefined) {
                query = query.has('isFeatured', filters.isFeatured);
            }
            if (filters.dateFrom) {
                query = query.has('dateUploaded', gremlin.process.P.gte(filters.dateFrom));
            }
            if (filters.dateTo) {
                query = query.has('dateUploaded', gremlin.process.P.lte(filters.dateTo));
            }

            // Apply sorting
            if (filters.sortBy === 'size') {
                query = query.order().by('size', filters.sortOrder === 'asc' ? gremlin.process.Order.asc : gremlin.process.Order.desc);
            } else if (filters.sortBy === 'views') {
                query = query.order().by('viewCount', gremlin.process.Order.desc);
            } else {
                query = query.order().by('dateUploaded', gremlin.process.Order.desc);
            }

            // Apply pagination
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.skip) {
                query = query.skip(filters.skip);
            }

            const mediaItems = await query.elementMap().toList();
            return mediaItems.map(mediaData => Media.fromGraphData(mediaData));
        } catch (error) {
            throw new Error(`Error finding media: ${error.message}`);
        }
    }

    static async findByUser(userId, mediaType = null) {
        const g = db.getTraversal();
        
        try {
            let query = g.V()
                .has('User', 'id', userId)
                .out('UPLOADED')
                .hasLabel('Media');

            if (mediaType) {
                query = query.has('mediaType', mediaType);
            }

            const mediaItems = await query
                .order().by('dateUploaded', gremlin.process.Order.desc)
                .elementMap()
                .toList();

            return mediaItems.map(mediaData => Media.fromGraphData(mediaData));
        } catch (error) {
            throw new Error(`Error finding media by user: ${error.message}`);
        }
    }

    static async findByEvent(eventId) {
        const g = db.getTraversal();
        
        try {
            const mediaItems = await g.V()
                .has('Event', 'id', eventId)
                .inE('DOCUMENTED_BY')
                .outV()
                .elementMap()
                .toList();

            return mediaItems.map(mediaData => Media.fromGraphData(mediaData));
        } catch (error) {
            throw new Error(`Error finding media by event: ${error.message}`);
        }
    }

    static async search(searchTerm, filters = {}) {
        const g = db.getTraversal();
        
        try {
            let query = g.V().hasLabel('Media');

            // Apply text search
            if (searchTerm) {
                query = query.or(
                    __.has('title', gremlin.process.P.containing(searchTerm)),
                    __.has('description', gremlin.process.P.containing(searchTerm)),
                    __.has('caption', gremlin.process.P.containing(searchTerm)),
                    __.has('tags', gremlin.process.P.containing(searchTerm))
                );
            }

            // Apply additional filters
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null) {
                    query = query.has(key, filters[key]);
                }
            });

            const mediaItems = await query
                .order().by('viewCount', gremlin.process.Order.desc)
                .elementMap()
                .limit(50)
                .toList();

            return mediaItems.map(mediaData => Media.fromGraphData(mediaData));
        } catch (error) {
            throw new Error(`Error searching media: ${error.message}`);
        }
    }

    static async delete(id, userId) {
        const g = db.getTraversal();
        
        try {
            // Verify ownership
            const media = await g.V().has('Media', 'id', id).elementMap().next();
            if (!media.value) {
                throw new Error('Media not found');
            }

            const ownerId = media.value.get('ownerId');
            if (ownerId !== userId) {
                throw new Error('Not authorized to delete this media');
            }

            // Delete all relationships first
            await g.V().has('Media', 'id', id)
                .bothE()
                .drop()
                .iterate();
            
            // Delete media vertex
            await g.V().has('Media', 'id', id).drop().iterate();
            
            return true;
        } catch (error) {
            throw new Error(`Error deleting media: ${error.message}`);
        }
    }

    static fromGraphData(data) {
        const mediaData = {};
        
        // Convert Map to object and parse JSON fields
        for (const [key, value] of data.entries()) {
            if (key === gremlin.process.T.label || key === gremlin.process.T.id) {
                continue;
            }
            
            // Parse JSON fields
            const jsonFields = [
                'dimensions', 'thumbnails', 'variants', 'keywords', 'tags',
                'permissions', 'exifData', 'gpsData', 'cameraInfo',
                'shootingConditions', 'location', 'coordinates', 'peopleTagged',
                'eventsLinked', 'familyTreeIds', 'relatedPosts', 'processingErrors',
                'usageHistory', 'objectsDetected', 'backupLocations',
                'moderationFlags', 'contentWarnings'
            ];
            
            if (jsonFields.includes(key) && typeof value === 'string') {
                try {
                    mediaData[key] = JSON.parse(value);
                } catch (e) {
                    mediaData[key] = value;
                }
            } else {
                mediaData[key] = value;
            }
        }

        return new Media(mediaData);
    }

    toJSON() {
        const obj = { ...this };
        
        // Remove sensitive fields from public JSON
        delete obj.fileHash;
        delete obj.checksum;
        delete obj.processingErrors;
        delete obj.moderationFlags;
        
        return obj;
    }
}

module.exports = { Media, MEDIA_TYPES, MEDIA_QUALITY };