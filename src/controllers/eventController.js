const { Event } = require('../models');
const { catchAsync, AppError } = require('../middleware/errorHandler');

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     description: Retrieves all events with optional filtering by type, date range, and verification status
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [birth, death, marriage, divorce, graduation, career, military, immigration, other]
 *         description: Filter by event type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events until this date
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *         description: Filter by creator user ID
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *                     totalCount:
 *                       type: integer
 */
const getAllEvents = catchAsync(async (req, res) => {
  const filters = {
    eventType: req.query.eventType,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
    createdBy: req.query.createdBy
  };

  // Remove undefined values
  Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

  const events = await Event.findAll(filters);

  res.json({
    success: true,
    data: {
      events,
      totalCount: events.length
    }
  });
});

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     description: Retrieves a specific event with participants and media
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EventWithDetails'
 *       404:
 *         description: Event not found
 */
const getEventById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);

  if (!event) {
    throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: event
  });
});

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     description: Creates a new event in the family tree
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - eventType
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: "John's Birthday"
 *               description:
 *                 type: string
 *                 example: "Annual birthday celebration"
 *               eventType:
 *                 type: string
 *                 enum: [birth, death, marriage, divorce, graduation, career, military, immigration, other]
 *                 example: "birth"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               isApproximate:
 *                 type: boolean
 *                 default: false
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *               isVerified:
 *                 type: boolean
 *                 default: false
 *               sources:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Event created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error
 */
const createEvent = catchAsync(async (req, res) => {
  const eventData = {
    ...req.body,
    createdBy: req.user.id
  };

  const event = await Event.create(eventData);

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: event
  });
});

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event
 *     description: Updates an existing event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *               eventType:
 *                 type: string
 *                 enum: [birth, death, marriage, divorce, graduation, career, military, immigration, other]
 *               date:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isApproximate:
 *                 type: boolean
 *               location:
 *                 type: object
 *               isVerified:
 *                 type: boolean
 *               sources:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Event updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
const updateEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const event = await Event.update(id, updateData);

  res.json({
    success: true,
    message: 'Event updated successfully',
    data: event
  });
});

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event
 *     description: Deletes an event and all its relationships
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Event deleted successfully"
 *       404:
 *         description: Event not found
 */
const deleteEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  await Event.delete(id);

  res.json({
    success: true,
    message: 'Event deleted successfully'
  });
});

/**
 * @swagger
 * /events/person/{personId}:
 *   get:
 *     summary: Get events for a person
 *     description: Retrieves all events associated with a specific person
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: personId
 *         required: true
 *         schema:
 *           type: string
 *         description: Person ID
 *     responses:
 *       200:
 *         description: Person events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           event:
 *                             $ref: '#/components/schemas/Event'
 *                           role:
 *                             type: string
 *                             example: "subject"
 *                     totalCount:
 *                       type: integer
 */
const getPersonEvents = catchAsync(async (req, res) => {
  const { personId } = req.params;
  const events = await Event.findByPerson(personId);

  res.json({
    success: true,
    data: {
      events,
      totalCount: events.length
    }
  });
});

/**
 * @swagger
 * /events/{eventId}/participants:
 *   post:
 *     summary: Add participant to event
 *     description: Adds a person as a participant to an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - personId
 *             properties:
 *               personId:
 *                 type: string
 *                 example: "person-uuid"
 *               role:
 *                 type: string
 *                 enum: [subject, witness, officiant, attendee, photographer]
 *                 default: attendee
 *                 example: "subject"
 *     responses:
 *       201:
 *         description: Participant added successfully
 *       400:
 *         description: Invalid role or validation error
 */
const addParticipant = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { personId, role = 'attendee' } = req.body;

  await Event.addParticipant(eventId, personId, role);

  res.status(201).json({
    success: true,
    message: 'Participant added successfully'
  });
});

/**
 * @swagger
 * /events/{eventId}/participants/{personId}:
 *   delete:
 *     summary: Remove participant from event
 *     description: Removes a person's participation from an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: path
 *         name: personId
 *         required: true
 *         schema:
 *           type: string
 *         description: Person ID
 *     responses:
 *       200:
 *         description: Participant removed successfully
 *       404:
 *         description: Participant relationship not found
 */
const removeParticipant = catchAsync(async (req, res) => {
  const { eventId, personId } = req.params;
  await Event.removeParticipant(eventId, personId);

  res.json({
    success: true,
    message: 'Participant removed successfully'
  });
});

/**
 * @swagger
 * /events/{eventId}/participants:
 *   get:
 *     summary: Get event participants
 *     description: Retrieves all participants of an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Participants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     participants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           person:
 *                             $ref: '#/components/schemas/Person'
 *                           role:
 *                             type: string
 *                             example: "subject"
 */
const getEventParticipants = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const participants = await Event.getParticipants(eventId);

  res.json({
    success: true,
    data: {
      participants
    }
  });
});

/**
 * @swagger
 * /events/search:
 *   get:
 *     summary: Search events
 *     description: Search events by title, description, or other text content
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           event:
 *                             $ref: '#/components/schemas/Event'
 *                           score:
 *                             type: number
 *                             example: 0.85
 *                     totalCount:
 *                       type: integer
 */
const searchEvents = catchAsync(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim().length === 0) {
    throw new AppError('Search query is required', 400, 'SEARCH_QUERY_REQUIRED');
  }

  const results = await Event.search(q.trim());

  res.json({
    success: true,
    data: {
      results,
      totalCount: results.length
    }
  });
});

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getPersonEvents,
  addParticipant,
  removeParticipant,
  getEventParticipants,
  searchEvents
};