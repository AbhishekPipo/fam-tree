const express = require('express');
const router = express.Router();
const EventController = require('../controllers/EventController');
const { authenticateToken: auth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management system
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
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
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 */
router.get('/', auth, EventController.getAllEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeParticipants
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *       404:
 *         description: Event not found
 */
router.get('/:id', auth, EventController.getEventById);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - eventType
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               eventType:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: object
 *               significance:
 *                 type: string
 *                 enum: [low, medium, high]
 *               privacy:
 *                 type: string
 *                 enum: [public, family, private]
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/', auth, EventController.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event
 *     tags: [Events]
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
 *         description: Event updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.put('/:id', auth, EventController.updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event
 *     tags: [Events]
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
 *         description: Event deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.delete('/:id', auth, EventController.deleteEvent);

/**
 * @swagger
 * /api/events/user/{userId}:
 *   get:
 *     summary: Get events for a user
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User events retrieved successfully
 */
router.get('/user/:userId', auth, EventController.getUserEvents);

/**
 * @swagger
 * /api/events/search:
 *   get:
 *     summary: Search events
 *     tags: [Events]
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
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search', auth, EventController.searchEvents);

/**
 * @swagger
 * /api/events/{id}/participants:
 *   post:
 *     summary: Add participant to event
 *     tags: [Events]
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
 *               role:
 *                 type: string
 *                 default: participant
 *               properties:
 *                 type: object
 *     responses:
 *       200:
 *         description: Participant added successfully
 *       400:
 *         description: Invalid input or user already participant
 *       404:
 *         description: Event or user not found
 */
router.post('/:id/participants', auth, EventController.addParticipant);

/**
 * @swagger
 * /api/events/{id}/participants/{userId}:
 *   delete:
 *     summary: Remove participant from event
 *     tags: [Events]
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
 *         description: Participant removed successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.delete('/:id/participants/:userId', auth, EventController.removeParticipant);

/**
 * @swagger
 * /api/events/{id}/participants:
 *   get:
 *     summary: Get event participants
 *     tags: [Events]
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
 *         description: Participants retrieved successfully
 *       404:
 *         description: Event not found
 */
router.get('/:id/participants', auth, EventController.getEventParticipants);

/**
 * @swagger
 * /api/events/types:
 *   get:
 *     summary: Get event types and configurations
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event types retrieved successfully
 */
router.get('/types', auth, EventController.getEventTypes);

/**
 * @swagger
 * /api/events/calendar/date-range:
 *   get:
 *     summary: Get events by date range (for calendar view)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *       400:
 *         description: Missing date parameters
 */
router.get('/calendar/date-range', auth, EventController.getEventsByDateRange);

/**
 * @swagger
 * /api/events/upcoming:
 *   get:
 *     summary: Get upcoming events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Upcoming events retrieved successfully
 */
router.get('/upcoming', auth, EventController.getUpcomingEvents);

/**
 * @swagger
 * /api/events/stats:
 *   get:
 *     summary: Get event statistics
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [month, quarter, year]
 *           default: year
 *     responses:
 *       200:
 *         description: Event statistics retrieved successfully
 */
router.get('/stats', auth, EventController.getEventStats);

module.exports = router;