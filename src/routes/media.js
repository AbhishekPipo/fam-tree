const express = require('express');
const router = express.Router();
const MediaController = require('../controllers/MediaController');
const { authenticateToken: auth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media management system
 */

/**
 * @swagger
 * /api/media:
 *   get:
 *     summary: Get all media
 *     tags: [Media]
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
 *         name: mediaType
 *         schema:
 *           type: string
 *           enum: [image, video, audio, document, spreadsheet, presentation, archive]
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [public, private]
 *       - in: query
 *         name: uploadedBy
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Media retrieved successfully
 */
router.get('/', auth, MediaController.getAllMedia);

/**
 * @swagger
 * /api/media/search:
 *   get:
 *     summary: Search media
 *     tags: [Media]
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
 *         name: mediaType
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search', auth, MediaController.searchMedia);

/**
 * @swagger
 * /api/media/types:
 *   get:
 *     summary: Get media types and configurations
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Media types retrieved successfully
 */
router.get('/types', auth, MediaController.getMediaTypes);

/**
 * @swagger
 * /api/media/gallery:
 *   get:
 *     summary: Get media gallery (organized view)
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [date, type, none]
 *           default: date
 *       - in: query
 *         name: mediaType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Media gallery retrieved successfully
 */
router.get('/gallery', auth, MediaController.getMediaGallery);

/**
 * @swagger
 * /api/media/stats:
 *   get:
 *     summary: Get media statistics
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Get stats for specific user (optional)
 *     responses:
 *       200:
 *         description: Media statistics retrieved successfully
 */
router.get('/stats', auth, MediaController.getMediaStats);

/**
 * @swagger
 * /api/media/user/{userId}:
 *   get:
 *     summary: Get media by user
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: mediaType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User media retrieved successfully
 */
router.get('/user/:userId', auth, MediaController.getUserMedia);

/**
 * @swagger
 * /api/media/event/{eventId}:
 *   get:
 *     summary: Get media by event
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event media retrieved successfully
 */
router.get('/event/:eventId', auth, MediaController.getEventMedia);

/**
 * @swagger
 * /api/media/{id}:
 *   get:
 *     summary: Get media by ID
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: incrementView
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Media retrieved successfully
 *       404:
 *         description: Media not found
 */
router.get('/:id', auth, MediaController.getMediaById);

/**
 * @swagger
 * /api/media:
 *   post:
 *     summary: Upload media
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - originalName
 *               - mimeType
 *               - size
 *               - url
 *             properties:
 *               filename:
 *                 type: string
 *               originalName:
 *                 type: string
 *               mimeType:
 *                 type: string
 *               size:
 *                 type: integer
 *               url:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *                 default: private
 *               location:
 *                 type: object
 *               dateTaken:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Media uploaded successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/', auth, MediaController.uploadMedia);

/**
 * @swagger
 * /api/media/{id}:
 *   put:
 *     summary: Update media
 *     tags: [Media]
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
 *         description: Media updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Media not found
 */
router.put('/:id', auth, MediaController.updateMedia);

/**
 * @swagger
 * /api/media/{id}:
 *   delete:
 *     summary: Delete media
 *     tags: [Media]
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
 *         description: Media deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Media not found
 */
router.delete('/:id', auth, MediaController.deleteMedia);

/**
 * @swagger
 * /api/media/{id}/tag:
 *   post:
 *     summary: Tag person in media
 *     tags: [Media]
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Person tagged successfully
 *       400:
 *         description: Person already tagged or invalid input
 *       404:
 *         description: Media or user not found
 */
router.post('/:id/tag', auth, MediaController.tagPerson);

/**
 * @swagger
 * /api/media/{id}/untag/{userId}:
 *   delete:
 *     summary: Untag person from media
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Person untagged successfully
 *       404:
 *         description: Media not found
 */
router.delete('/:id/untag/:userId', auth, MediaController.untagPerson);

/**
 * @swagger
 * /api/media/{id}/link-event:
 *   post:
 *     summary: Link media to event
 *     tags: [Media]
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
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Media linked to event successfully
 *       404:
 *         description: Media not found
 */
router.post('/:id/link-event', auth, MediaController.linkToEvent);

module.exports = router;