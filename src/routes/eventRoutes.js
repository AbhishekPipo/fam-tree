const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimiter');
const eventController = require('../controllers/eventController');

// Apply authentication to all routes
router.use(auth);

// Apply rate limiting
router.use(apiLimiter);

// Event CRUD routes
router.get('/', eventController.getAllEvents);
router.get('/search', eventController.searchEvents);
router.get('/:id', eventController.getEventById);
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// Person-specific events
router.get('/person/:personId', eventController.getPersonEvents);

// Participant management
router.get('/:eventId/participants', eventController.getEventParticipants);
router.post('/:eventId/participants', eventController.addParticipant);
router.delete('/:eventId/participants/:personId', eventController.removeParticipant);

module.exports = router;