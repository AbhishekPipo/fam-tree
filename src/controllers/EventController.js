const { Event, EVENT_TYPES, PARTICIPANT_ROLES } = require('../models/Event');
const User = require('../models/User');

class EventController {
    // Get all events
    static async getAllEvents(req, res) {
        try {
            const filters = {
                ...req.query,
                limit: parseInt(req.query.limit) || 20,
                skip: parseInt(req.query.skip) || 0
            };

            const events = await Event.findAll(filters);

            res.status(200).json({
                success: true,
                data: {
                    events: events.map(event => event.toJSON()),
                    totalCount: events.length,
                    filters: filters
                }
            });
        } catch (error) {
            console.error('Get all events error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get event by ID
    static async getEventById(req, res) {
        try {
            const { id } = req.params;
            const { includeParticipants = true } = req.query;

            const event = await Event.findById(id);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            const eventData = event.toJSON();

            // Include participants if requested
            if (includeParticipants === 'true' || includeParticipants === true) {
                eventData.participants = await event.getParticipants();
            }

            res.status(200).json({
                success: true,
                data: eventData
            });
        } catch (error) {
            console.error('Get event by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Create new event
    static async createEvent(req, res) {
        try {
            const eventData = {
                ...req.body,
                createdBy: req.user.id
            };

            const event = new Event(eventData);
            await event.save();

            // Add creator as participant if not specified
            if (req.body.participants && !req.body.participants.includes(req.user.id)) {
                const eventConfig = EVENT_TYPES[event.eventType];
                const role = eventConfig ? eventConfig.defaultParticipantRole : 'participant';
                await event.addParticipant(req.user.id, role);
            }

            res.status(201).json({
                success: true,
                message: 'Event created successfully',
                data: event.toJSON()
            });
        } catch (error) {
            console.error('Create event error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Update event
    static async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const event = await Event.findById(id);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            // Check authorization
            if (event.createdBy !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this event'
                });
            }

            // Update properties
            Object.keys(updates).forEach(key => {
                if (updates[key] !== undefined && key !== 'id') {
                    event[key] = updates[key];
                }
            });

            event.lastModifiedBy = req.user.id;
            await event.save();

            res.status(200).json({
                success: true,
                message: 'Event updated successfully',
                data: event.toJSON()
            });
        } catch (error) {
            console.error('Update event error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Delete event
    static async deleteEvent(req, res) {
        try {
            const { id } = req.params;

            const event = await Event.findById(id);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            // Check authorization
            if (event.createdBy !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this event'
                });
            }

            await Event.delete(id);

            res.status(200).json({
                success: true,
                message: 'Event deleted successfully'
            });
        } catch (error) {
            console.error('Delete event error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get events for a user
    static async getUserEvents(req, res) {
        try {
            const { userId } = req.params;
            const { role } = req.query;

            const events = await Event.findByUser(userId, role);

            res.status(200).json({
                success: true,
                data: {
                    events: events.map(event => event.toJSON()),
                    totalCount: events.length,
                    userId,
                    role
                }
            });
        } catch (error) {
            console.error('Get user events error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Search events
    static async searchEvents(req, res) {
        try {
            const { q: searchTerm } = req.query;
            const filters = { ...req.query };
            delete filters.q;

            const events = await Event.search(searchTerm, filters);

            res.status(200).json({
                success: true,
                data: {
                    events: events.map(event => event.toJSON()),
                    totalCount: events.length,
                    searchTerm,
                    filters
                }
            });
        } catch (error) {
            console.error('Search events error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Add participant to event
    static async addParticipant(req, res) {
        try {
            const { id } = req.params;
            const { userId, role = 'participant', properties = {} } = req.body;

            const event = await Event.findById(id);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
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

            await event.addParticipant(userId, role, properties);

            res.status(200).json({
                success: true,
                message: 'Participant added to event',
                data: {
                    eventId: id,
                    userId,
                    role,
                    properties
                }
            });
        } catch (error) {
            console.error('Add participant error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Remove participant from event
    static async removeParticipant(req, res) {
        try {
            const { id, userId } = req.params;

            const event = await Event.findById(id);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            // Check authorization (event creator or the participant themselves)
            if (event.createdBy !== req.user.id && userId !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to remove this participant'
                });
            }

            await event.removeParticipant(userId);

            res.status(200).json({
                success: true,
                message: 'Participant removed from event'
            });
        } catch (error) {
            console.error('Remove participant error:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get event participants
    static async getEventParticipants(req, res) {
        try {
            const { id } = req.params;

            const event = await Event.findById(id);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found'
                });
            }

            const participants = await event.getParticipants();

            res.status(200).json({
                success: true,
                data: {
                    participants,
                    totalCount: participants.length
                }
            });
        } catch (error) {
            console.error('Get event participants error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get event types
    static async getEventTypes(req, res) {
        try {
            const eventTypes = Object.entries(EVENT_TYPES).map(([key, config]) => ({
                id: key,
                label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                category: config.category,
                description: config.description,
                requiredFields: config.requiredFields,
                defaultParticipantRole: config.defaultParticipantRole
            }));

            // Group by category
            const groupedByCategory = eventTypes.reduce((acc, eventType) => {
                if (!acc[eventType.category]) {
                    acc[eventType.category] = [];
                }
                acc[eventType.category].push(eventType);
                return acc;
            }, {});

            res.status(200).json({
                success: true,
                data: {
                    eventTypes,
                    groupedByCategory,
                    categories: Object.keys(groupedByCategory),
                    participantRoles: PARTICIPANT_ROLES
                }
            });
        } catch (error) {
            console.error('Get event types error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get events by date range (for calendar view)
    static async getEventsByDateRange(req, res) {
        try {
            const { startDate, endDate } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required'
                });
            }

            const filters = {
                dateFrom: startDate,
                dateTo: endDate,
                ...req.query
            };

            const events = await Event.findAll(filters);

            // Group events by date for calendar view
            const eventsByDate = events.reduce((acc, event) => {
                const dateKey = event.date.split('T')[0]; // Get date part only
                if (!acc[dateKey]) {
                    acc[dateKey] = [];
                }
                acc[dateKey].push(event.toJSON());
                return acc;
            }, {});

            res.status(200).json({
                success: true,
                data: {
                    events: events.map(event => event.toJSON()),
                    eventsByDate,
                    totalCount: events.length,
                    dateRange: { startDate, endDate }
                }
            });
        } catch (error) {
            console.error('Get events by date range error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get upcoming events
    static async getUpcomingEvents(req, res) {
        try {
            const { limit = 10, days = 30 } = req.query;
            const currentDate = new Date().toISOString();
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + parseInt(days));

            const filters = {
                dateFrom: currentDate,
                dateTo: futureDate.toISOString(),
                limit: parseInt(limit),
                sortBy: 'date',
                sortOrder: 'asc'
            };

            const events = await Event.findAll(filters);

            res.status(200).json({
                success: true,
                data: {
                    events: events.map(event => event.toJSON()),
                    totalCount: events.length,
                    period: `Next ${days} days`
                }
            });
        } catch (error) {
            console.error('Get upcoming events error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get event statistics
    static async getEventStats(req, res) {
        try {
            const { timeframe = 'year' } = req.query;
            
            // Calculate date range based on timeframe
            const endDate = new Date();
            const startDate = new Date();
            
            switch (timeframe) {
                case 'month':
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
                case 'quarter':
                    startDate.setMonth(startDate.getMonth() - 3);
                    break;
                case 'year':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setFullYear(startDate.getFullYear() - 1);
            }

            const events = await Event.findAll({
                dateFrom: startDate.toISOString(),
                dateTo: endDate.toISOString()
            });

            // Calculate statistics
            const stats = {
                totalEvents: events.length,
                eventsByType: {},
                eventsByCategory: {},
                eventsByMonth: {},
                eventsBySignificance: { low: 0, medium: 0, high: 0 },
                averageParticipants: 0,
                mostActiveMonth: null,
                upcomingEvents: 0
            };

            // Process events
            const now = new Date();
            events.forEach(event => {
                // By type
                stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;

                // By category
                const eventConfig = EVENT_TYPES[event.eventType];
                if (eventConfig) {
                    const category = eventConfig.category;
                    stats.eventsByCategory[category] = (stats.eventsByCategory[category] || 0) + 1;
                }

                // By month
                const eventDate = new Date(event.date);
                const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
                stats.eventsByMonth[monthKey] = (stats.eventsByMonth[monthKey] || 0) + 1;

                // By significance
                stats.eventsBySignificance[event.significance]++;

                // Upcoming events
                if (new Date(event.date) > now) {
                    stats.upcomingEvents++;
                }
            });

            // Find most active month
            const monthCounts = Object.entries(stats.eventsByMonth);
            if (monthCounts.length > 0) {
                const mostActive = monthCounts.reduce((max, [month, count]) => 
                    count > max.count ? { month, count } : max, 
                    { month: null, count: 0 }
                );
                stats.mostActiveMonth = mostActive;
            }

            res.status(200).json({
                success: true,
                data: {
                    ...stats,
                    timeframe,
                    dateRange: {
                        from: startDate.toISOString(),
                        to: endDate.toISOString()
                    }
                }
            });
        } catch (error) {
            console.error('Get event stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = EventController;