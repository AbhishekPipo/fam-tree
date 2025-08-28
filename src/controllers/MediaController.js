const { Media, MEDIA_TYPES, MEDIA_QUALITY } = require('../models/Media');
const User = require('../models/User');

class MediaController {
    // Get all media
    static async getAllMedia(req, res) {
        try {
            const filters = {
                limit: parseInt(req.query.limit) || 20,
                skip: parseInt(req.query.skip) || 0,
                ...req.query
            };

            const mediaItems = await Media.findAll(filters);

            res.status(200).json({
                success: true,
                data: {
                    media: mediaItems.map(item => item.toJSON()),
                    totalCount: mediaItems.length,
                    filters
                }
            });
        } catch (error) {
            console.error('Get all media error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get media by ID
    static async getMediaById(req, res) {
        try {
            const { id } = req.params;
            const { incrementView = true } = req.query;

            const media = await Media.findById(id);
            if (!media) {
                return res.status(404).json({
                    success: false,
                    message: 'Media not found'
                });
            }

            // Increment view count
            if (incrementView === 'true' || incrementView === true) {
                await media.incrementViewCount();
            }

            // Get uploader info
            const uploader = await User.findById(media.uploadedBy);
            const mediaData = media.toJSON();
            mediaData.uploader = uploader ? {
                id: uploader.id,
                firstName: uploader.firstName,
                lastName: uploader.lastName,
                profilePicture: uploader.profilePicture
            } : null;

            // Get tagged people info
            if (media.peopleTagged.length > 0) {
                const taggedPeople = await Promise.all(
                    media.peopleTagged.map(async (userId) => {
                        const user = await User.findById(userId);
                        return user ? {
                            id: user.id,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            profilePicture: user.profilePicture
                        } : null;
                    })
                );
                mediaData.taggedPeople = taggedPeople.filter(person => person !== null);
            }

            res.status(200).json({
                success: true,
                data: mediaData
            });
        } catch (error) {
            console.error('Get media by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Upload media
    static async uploadMedia(req, res) {
        try {
            const {
                filename,
                originalName,
                mimeType,
                size,
                url,
                title,
                description,
                tags = [],
                visibility = 'private',
                location,
                dateTaken,
                ...mediaData
            } = req.body;

            const media = new Media({
                filename,
                originalName,
                mimeType,
                size,
                url,
                title,
                description,
                tags,
                visibility,
                location,
                dateTaken,
                uploadedBy: req.user.id,
                ownerId: req.user.id,
                ...mediaData
            });

            await media.save();

            res.status(201).json({
                success: true,
                message: 'Media uploaded successfully',
                data: media.toJSON()
            });
        } catch (error) {
            console.error('Upload media error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Update media
    static async updateMedia(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const media = await Media.findById(id);
            if (!media) {
                return res.status(404).json({
                    success: false,
                    message: 'Media not found'
                });
            }

            // Check authorization
            if (media.ownerId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this media'
                });
            }

            // Update properties
            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined && key !== 'id' && key !== 'uploadedBy') {
                    media[key] = updates[key];
                }
            });

            media.lastModifiedBy = req.user.id;
            await media.save();

            res.status(200).json({
                success: true,
                message: 'Media updated successfully',
                data: media.toJSON()
            });
        } catch (error) {
            console.error('Update media error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Delete media
    static async deleteMedia(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const success = await Media.delete(id, userId);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Media not found or not authorized'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Media deleted successfully'
            });
        } catch (error) {
            console.error('Delete media error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get media by user
    static async getUserMedia(req, res) {
        try {
            const { userId } = req.params;
            const { mediaType } = req.query;

            const mediaItems = await Media.findByUser(userId, mediaType);

            res.status(200).json({
                success: true,
                data: {
                    media: mediaItems.map(item => item.toJSON()),
                    totalCount: mediaItems.length,
                    userId,
                    mediaType
                }
            });
        } catch (error) {
            console.error('Get user media error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get media by event
    static async getEventMedia(req, res) {
        try {
            const { eventId } = req.params;

            const mediaItems = await Media.findByEvent(eventId);

            res.status(200).json({
                success: true,
                data: {
                    media: mediaItems.map(item => item.toJSON()),
                    totalCount: mediaItems.length,
                    eventId
                }
            });
        } catch (error) {
            console.error('Get event media error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Search media
    static async searchMedia(req, res) {
        try {
            const { q: searchTerm } = req.query;
            const filters = { ...req.query };
            delete filters.q;

            const mediaItems = await Media.search(searchTerm, filters);

            res.status(200).json({
                success: true,
                data: {
                    media: mediaItems.map(item => item.toJSON()),
                    totalCount: mediaItems.length,
                    searchTerm,
                    filters
                }
            });
        } catch (error) {
            console.error('Search media error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Tag person in media
    static async tagPerson(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            const media = await Media.findById(id);
            if (!media) {
                return res.status(404).json({
                    success: false,
                    message: 'Media not found'
                });
            }

            // Verify user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const success = await media.tagPerson(userId);
            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: 'Person is already tagged in this media'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Person tagged successfully',
                data: {
                    mediaId: id,
                    taggedUser: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName
                    }
                }
            });
        } catch (error) {
            console.error('Tag person error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Untag person from media
    static async untagPerson(req, res) {
        try {
            const { id, userId } = req.params;

            const media = await Media.findById(id);
            if (!media) {
                return res.status(404).json({
                    success: false,
                    message: 'Media not found'
                });
            }

            await media.untagPerson(userId);

            res.status(200).json({
                success: true,
                message: 'Person untagged successfully'
            });
        } catch (error) {
            console.error('Untag person error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Link media to event
    static async linkToEvent(req, res) {
        try {
            const { id } = req.params;
            const { eventId } = req.body;

            const media = await Media.findById(id);
            if (!media) {
                return res.status(404).json({
                    success: false,
                    message: 'Media not found'
                });
            }

            await media.linkToEvent(eventId);

            res.status(200).json({
                success: true,
                message: 'Media linked to event successfully',
                data: {
                    mediaId: id,
                    eventId
                }
            });
        } catch (error) {
            console.error('Link to event error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get media types and configurations
    static async getMediaTypes(req, res) {
        try {
            const mediaTypes = Object.entries(MEDIA_TYPES).map(([key, config]) => ({
                id: key,
                label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                category: config.category,
                description: config.description,
                allowedExtensions: config.allowedExtensions,
                maxSize: config.maxSize,
                maxSizeMB: Math.round(config.maxSize / (1024 * 1024)),
                thumbnailSupported: config.thumbnailSupported
            }));

            // Group by category
            const groupedByCategory = mediaTypes.reduce((acc, mediaType) => {
                if (!acc[mediaType.category]) {
                    acc[mediaType.category] = [];
                }
                acc[mediaType.category].push(mediaType);
                return acc;
            }, {});

            res.status(200).json({
                success: true,
                data: {
                    mediaTypes,
                    groupedByCategory,
                    categories: Object.keys(groupedByCategory),
                    qualityOptions: MEDIA_QUALITY
                }
            });
        } catch (error) {
            console.error('Get media types error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get media gallery (organized view)
    static async getMediaGallery(req, res) {
        try {
            const {
                groupBy = 'date',
                mediaType,
                limit = 100,
                skip = 0
            } = req.query;

            const filters = {
                limit: parseInt(limit),
                skip: parseInt(skip),
                visibility: 'public', // Only public media in gallery
                status: 'active'
            };

            if (mediaType) {
                filters.mediaType = mediaType;
            }

            const mediaItems = await Media.findAll(filters);

            // Group media items
            let groupedMedia = {};
            
            if (groupBy === 'date') {
                groupedMedia = mediaItems.reduce((acc, item) => {
                    const date = new Date(item.dateUploaded);
                    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    
                    if (!acc[dateKey]) {
                        acc[dateKey] = {
                            label: monthName,
                            items: []
                        };
                    }
                    acc[dateKey].items.push(item.toJSON());
                    return acc;
                }, {});
            } else if (groupBy === 'type') {
                groupedMedia = mediaItems.reduce((acc, item) => {
                    if (!acc[item.mediaType]) {
                        acc[item.mediaType] = {
                            label: item.mediaType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                            items: []
                        };
                    }
                    acc[item.mediaType].items.push(item.toJSON());
                    return acc;
                }, {});
            } else {
                groupedMedia = {
                    all: {
                        label: 'All Media',
                        items: mediaItems.map(item => item.toJSON())
                    }
                };
            }

            res.status(200).json({
                success: true,
                data: {
                    gallery: groupedMedia,
                    totalCount: mediaItems.length,
                    groupBy,
                    mediaType
                }
            });
        } catch (error) {
            console.error('Get media gallery error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get media statistics
    static async getMediaStats(req, res) {
        try {
            const { userId } = req.query;
            
            const filters = {};
            if (userId) {
                filters.uploadedBy = userId;
            }

            const mediaItems = await Media.findAll(filters);

            // Calculate statistics
            const stats = {
                totalItems: mediaItems.length,
                totalSize: 0,
                totalSizeMB: 0,
                mediaTypes: {},
                uploadsByMonth: {},
                topTags: {},
                avgQualityScore: 0,
                avgViewCount: 0,
                mostViewedItem: null,
                recentUploads: [],
                storageDistribution: {}
            };

            let totalQuality = 0;
            let totalViews = 0;
            let mostViews = 0;

            mediaItems.forEach(item => {
                // Size calculations
                stats.totalSize += item.size || 0;

                // Media types
                stats.mediaTypes[item.mediaType] = (stats.mediaTypes[item.mediaType] || 0) + 1;

                // Uploads by month
                const uploadDate = new Date(item.dateUploaded);
                const monthKey = `${uploadDate.getFullYear()}-${String(uploadDate.getMonth() + 1).padStart(2, '0')}`;
                stats.uploadsByMonth[monthKey] = (stats.uploadsByMonth[monthKey] || 0) + 1;

                // Tags
                if (item.tags) {
                    item.tags.forEach(tag => {
                        stats.topTags[tag] = (stats.topTags[tag] || 0) + 1;
                    });
                }

                // Quality and views
                totalQuality += item.qualityScore || 0;
                totalViews += item.viewCount || 0;

                if (item.viewCount > mostViews) {
                    mostViews = item.viewCount;
                    stats.mostViewedItem = {
                        id: item.id,
                        title: item.title,
                        viewCount: item.viewCount
                    };
                }

                // Storage distribution
                const provider = item.storageProvider || 'unknown';
                stats.storageDistribution[provider] = (stats.storageDistribution[provider] || 0) + 1;
            });

            // Calculate averages and conversions
            stats.totalSizeMB = Math.round(stats.totalSize / (1024 * 1024));
            stats.avgQualityScore = mediaItems.length > 0 ? Math.round((totalQuality / mediaItems.length) * 10) / 10 : 0;
            stats.avgViewCount = mediaItems.length > 0 ? Math.round(totalViews / mediaItems.length) : 0;

            // Get top tags (sorted by frequency)
            stats.topTags = Object.entries(stats.topTags)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .reduce((obj, [tag, count]) => ({ ...obj, [tag]: count }), {});

            // Get recent uploads
            stats.recentUploads = mediaItems
                .sort((a, b) => new Date(b.dateUploaded) - new Date(a.dateUploaded))
                .slice(0, 5)
                .map(item => ({
                    id: item.id,
                    title: item.title,
                    mediaType: item.mediaType,
                    dateUploaded: item.dateUploaded
                }));

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get media stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = MediaController;