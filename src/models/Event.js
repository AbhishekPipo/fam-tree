const gremlin = require('gremlin');
const { v4: uuidv4 } = require('crypto').webcrypto ? { v4: () => crypto.randomUUID() } : require('uuid');
const db = require('../../config/database');

const __ = gremlin.process.statics;

// Event types with metadata
const EVENT_TYPES = {
    // Life Events
    'birth': {
        category: 'life',
        description: 'Birth event',
        requiredFields: ['date'],
        defaultParticipantRole: 'subject'
    },
    'death': {
        category: 'life',
        description: 'Death event',
        requiredFields: ['date'],
        defaultParticipantRole: 'subject'
    },
    'baptism': {
        category: 'religious',
        description: 'Baptism ceremony',
        requiredFields: ['date'],
        defaultParticipantRole: 'subject'
    },
    'confirmation': {
        category: 'religious',
        description: 'Confirmation ceremony',
        requiredFields: ['date'],
        defaultParticipantRole: 'subject'
    },

    // Marriage Events
    'engagement': {
        category: 'marriage',
        description: 'Engagement event',
        requiredFields: ['date'],
        defaultParticipantRole: 'participant'
    },
    'marriage': {
        category: 'marriage',
        description: 'Marriage ceremony',
        requiredFields: ['date'],
        defaultParticipantRole: 'participant'
    },
    'wedding_anniversary': {
        category: 'marriage',
        description: 'Wedding anniversary celebration',
        requiredFields: ['date'],
        defaultParticipantRole: 'celebrant'
    },
    'divorce': {
        category: 'marriage',
        description: 'Divorce finalization',
        requiredFields: ['date'],
        defaultParticipantRole: 'participant'
    },

    // Education Events
    'graduation': {
        category: 'education',
        description: 'Graduation ceremony',
        requiredFields: ['date'],
        defaultParticipantRole: 'graduate'
    },
    'school_enrollment': {
        category: 'education',
        description: 'School enrollment',
        requiredFields: ['date'],
        defaultParticipantRole: 'student'
    },
    'award_ceremony': {
        category: 'education',
        description: 'Award or recognition ceremony',
        requiredFields: ['date'],
        defaultParticipantRole: 'recipient'
    },

    // Career Events
    'job_start': {
        category: 'career',
        description: 'Started new job',
        requiredFields: ['date'],
        defaultParticipantRole: 'employee'
    },
    'job_end': {
        category: 'career',
        description: 'Left job',
        requiredFields: ['date'],
        defaultParticipantRole: 'employee'
    },
    'promotion': {
        category: 'career',
        description: 'Job promotion',
        requiredFields: ['date'],
        defaultParticipantRole: 'promotee'
    },
    'retirement': {
        category: 'career',
        description: 'Retirement from work',
        requiredFields: ['date'],
        defaultParticipantRole: 'retiree'
    },

    // Military Events
    'military_enlistment': {
        category: 'military',
        description: 'Military enlistment',
        requiredFields: ['date'],
        defaultParticipantRole: 'enlistee'
    },
    'military_discharge': {
        category: 'military',
        description: 'Military discharge',
        requiredFields: ['date'],
        defaultParticipantRole: 'veteran'
    },
    'military_deployment': {
        category: 'military',
        description: 'Military deployment',
        requiredFields: ['date'],
        defaultParticipantRole: 'deployed'
    },

    // Immigration Events
    'immigration': {
        category: 'immigration',
        description: 'Immigration to new country',
        requiredFields: ['date'],
        defaultParticipantRole: 'immigrant'
    },
    'naturalization': {
        category: 'immigration',
        description: 'Citizenship naturalization',
        requiredFields: ['date'],
        defaultParticipantRole: 'new_citizen'
    },

    // Health Events
    'medical_diagnosis': {
        category: 'health',
        description: 'Medical diagnosis',
        requiredFields: ['date'],
        defaultParticipantRole: 'patient'
    },
    'surgery': {
        category: 'health',
        description: 'Surgical procedure',
        requiredFields: ['date'],
        defaultParticipantRole: 'patient'
    },
    'recovery': {
        category: 'health',
        description: 'Recovery from illness/surgery',
        requiredFields: ['date'],
        defaultParticipantRole: 'patient'
    },

    // Family Events
    'family_reunion': {
        category: 'family',
        description: 'Family reunion gathering',
        requiredFields: ['date'],
        defaultParticipantRole: 'attendee'
    },
    'birthday': {
        category: 'family',
        description: 'Birthday celebration',
        requiredFields: ['date'],
        defaultParticipantRole: 'celebrant'
    },
    'adoption': {
        category: 'family',
        description: 'Adoption finalization',
        requiredFields: ['date'],
        defaultParticipantRole: 'adopted'
    },

    // Travel Events
    'travel': {
        category: 'travel',
        description: 'Travel or vacation',
        requiredFields: ['date'],
        defaultParticipantRole: 'traveler'
    },
    'relocation': {
        category: 'travel',
        description: 'Moved to new location',
        requiredFields: ['date'],
        defaultParticipantRole: 'mover'
    },

    // Achievement Events
    'achievement': {
        category: 'achievement',
        description: 'Personal achievement',
        requiredFields: ['date'],
        defaultParticipantRole: 'achiever'
    },
    'publication': {
        category: 'achievement',
        description: 'Published work',
        requiredFields: ['date'],
        defaultParticipantRole: 'author'
    },

    // Legal Events
    'legal_proceeding': {
        category: 'legal',
        description: 'Legal proceeding',
        requiredFields: ['date'],
        defaultParticipantRole: 'participant'
    },
    'will_signing': {
        category: 'legal',
        description: 'Will or testament signing',
        requiredFields: ['date'],
        defaultParticipantRole: 'testator'
    },

    // Custom Events
    'other': {
        category: 'other',
        description: 'Other event',
        requiredFields: ['date'],
        defaultParticipantRole: 'participant'
    }
};

// Participant roles
const PARTICIPANT_ROLES = [
    'subject', 'participant', 'witness', 'officiant', 'photographer',
    'celebrant', 'graduate', 'student', 'recipient', 'employee',
    'attendee', 'traveler', 'achiever', 'patient', 'immigrant',
    'veteran', 'bride', 'groom', 'best_man', 'maid_of_honor',
    'parent', 'grandparent', 'sibling', 'friend', 'other'
];

class Event {
    constructor(data) {
        this.id = data.id || uuidv4();
        this.title = data.title;
        this.description = data.description || null;
        this.eventType = data.eventType;
        this.eventSubtype = data.eventSubtype || null;
        
        // Date information
        this.date = data.date;
        this.endDate = data.endDate || null;
        this.isApproximate = data.isApproximate || false;
        this.timeOfDay = data.timeOfDay || null;
        this.duration = data.duration || null;
        
        // Location information
        this.location = {
            address: data.location?.address || null,
            city: data.location?.city || null,
            state: data.location?.state || null,
            country: data.location?.country || null,
            postalCode: data.location?.postalCode || null,
            coordinates: data.location?.coordinates || null,
            venue: data.location?.venue || null,
            venueType: data.location?.venueType || null
        };
        
        // Media and documentation
        this.photos = data.photos || [];
        this.videos = data.videos || [];
        this.documents = data.documents || [];
        this.mediaCount = data.mediaCount || 0;
        
        // Event metadata
        this.significance = data.significance || 'medium'; // low, medium, high
        this.privacy = data.privacy || 'family'; // public, family, private
        this.isVerified = data.isVerified || false;
        this.sources = data.sources || [];
        this.references = data.references || [];
        this.notes = data.notes || null;
        this.tags = data.tags || [];
        
        // Weather and context (optional)
        this.weather = data.weather || null;
        this.context = data.context || null;
        this.culturalNotes = data.culturalNotes || null;
        
        // Cost and organization (optional)
        this.cost = data.cost || null;
        this.currency = data.currency || null;
        this.organizer = data.organizer || null;
        
        // System fields
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.createdBy = data.createdBy;
        this.lastModifiedBy = data.lastModifiedBy || data.createdBy;
        
        // Status and lifecycle
        this.status = data.status || 'active'; // active, archived, deleted
        this.isPublic = data.isPublic || false;
        this.isRecurring = data.isRecurring || false;
        this.recurrencePattern = data.recurrencePattern || null;
        
        // Collaboration
        this.collaborators = data.collaborators || [];
        this.contributions = data.contributions || [];
    }

    static getEventTypes() {
        return EVENT_TYPES;
    }

    static getEventType(type) {
        return EVENT_TYPES[type] || null;
    }

    static getEventsByCategory(category) {
        return Object.entries(EVENT_TYPES)
            .filter(([_, config]) => config.category === category)
            .reduce((obj, [key, config]) => ({ ...obj, [key]: config }), {});
    }

    static getParticipantRoles() {
        return PARTICIPANT_ROLES;
    }

    validate() {
        if (!this.title || this.title.trim().length === 0) {
            throw new Error('Event title is required');
        }

        if (!this.eventType) {
            throw new Error('Event type is required');
        }

        const eventConfig = EVENT_TYPES[this.eventType];
        if (!eventConfig) {
            throw new Error(`Invalid event type: ${this.eventType}`);
        }

        // Check required fields
        if (eventConfig.requiredFields) {
            for (const field of eventConfig.requiredFields) {
                if (!this[field]) {
                    throw new Error(`Required field '${field}' is missing for event type '${this.eventType}'`);
                }
            }
        }

        // Validate date
        if (!this.date) {
            throw new Error('Event date is required');
        }

        try {
            new Date(this.date);
        } catch (error) {
            throw new Error('Invalid event date format');
        }

        // Validate end date if provided
        if (this.endDate) {
            try {
                const startDate = new Date(this.date);
                const endDate = new Date(this.endDate);
                if (endDate < startDate) {
                    throw new Error('End date cannot be before start date');
                }
            } catch (error) {
                throw new Error('Invalid end date format');
            }
        }

        return true;
    }

    async save() {
        const g = db.getTraversal();
        
        try {
            this.validate();
            this.updatedAt = new Date().toISOString();

            // Check if event exists
            const existingEvent = await g.V().has('Event', 'id', this.id).toList();
            
            if (existingEvent.length > 0) {
                // Update existing event
                const updateQuery = g.V().has('Event', 'id', this.id);
                
                // Update properties
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
                // Create new event
                const eventVertex = await g.addV('Event')
                    .property('id', this.id)
                    .property('title', this.title)
                    .property('description', this.description)
                    .property('eventType', this.eventType)
                    .property('eventSubtype', this.eventSubtype)
                    .property('date', this.date)
                    .property('endDate', this.endDate)
                    .property('isApproximate', this.isApproximate)
                    .property('timeOfDay', this.timeOfDay)
                    .property('duration', this.duration)
                    .property('location', JSON.stringify(this.location))
                    .property('photos', JSON.stringify(this.photos))
                    .property('videos', JSON.stringify(this.videos))
                    .property('documents', JSON.stringify(this.documents))
                    .property('mediaCount', this.mediaCount)
                    .property('significance', this.significance)
                    .property('privacy', this.privacy)
                    .property('isVerified', this.isVerified)
                    .property('sources', JSON.stringify(this.sources))
                    .property('references', JSON.stringify(this.references))
                    .property('notes', this.notes)
                    .property('tags', JSON.stringify(this.tags))
                    .property('weather', this.weather)
                    .property('context', this.context)
                    .property('culturalNotes', this.culturalNotes)
                    .property('cost', this.cost)
                    .property('currency', this.currency)
                    .property('organizer', this.organizer)
                    .property('createdAt', this.createdAt)
                    .property('updatedAt', this.updatedAt)
                    .property('createdBy', this.createdBy)
                    .property('lastModifiedBy', this.lastModifiedBy)
                    .property('status', this.status)
                    .property('isPublic', this.isPublic)
                    .property('isRecurring', this.isRecurring)
                    .property('recurrencePattern', this.recurrencePattern)
                    .property('collaborators', JSON.stringify(this.collaborators))
                    .property('contributions', JSON.stringify(this.contributions))
                    .next();

                return this;
            }
        } catch (error) {
            throw new Error(`Error saving event: ${error.message}`);
        }
    }

    async addParticipant(userId, role = 'participant', properties = {}) {
        const g = db.getTraversal();
        
        try {
            // Check if participation already exists
            const existing = await g.V()
                .has('User', 'id', userId)
                .outE('PARTICIPATED_IN')
                .filter(__.inV().has('Event', 'id', this.id))
                .toList();

            if (existing.length > 0) {
                throw new Error('User is already a participant in this event');
            }

            await g.V()
                .has('User', 'id', userId)
                .addE('PARTICIPATED_IN')
                .to(__.V().has('Event', 'id', this.id))
                .property('role', role)
                .property('addedAt', new Date().toISOString())
                .property('addedBy', this.createdBy)
                .property('properties', JSON.stringify(properties))
                .iterate();

            return true;
        } catch (error) {
            throw new Error(`Error adding participant: ${error.message}`);
        }
    }

    async removeParticipant(userId) {
        const g = db.getTraversal();
        
        try {
            await g.V()
                .has('User', 'id', userId)
                .outE('PARTICIPATED_IN')
                .filter(__.inV().has('Event', 'id', this.id))
                .drop()
                .iterate();

            return true;
        } catch (error) {
            throw new Error(`Error removing participant: ${error.message}`);
        }
    }

    async getParticipants() {
        const g = db.getTraversal();
        
        try {
            const participants = await g.V()
                .has('Event', 'id', this.id)
                .inE('PARTICIPATED_IN')
                .project('user', 'role', 'properties', 'addedAt')
                .by(__.outV().elementMap())
                .by('role')
                .by('properties')
                .by('addedAt')
                .toList();

            return participants.map(p => ({
                user: this.mapUserData(p.get('user')),
                role: p.get('role'),
                properties: p.get('properties') ? JSON.parse(p.get('properties')) : {},
                addedAt: p.get('addedAt')
            }));
        } catch (error) {
            throw new Error(`Error getting participants: ${error.message}`);
        }
    }

    mapUserData(userData) {
        const user = {};
        for (const [key, value] of userData.entries()) {
            if (key !== gremlin.process.T.label && key !== gremlin.process.T.id) {
                user[key] = value;
            }
        }
        return user;
    }

    static async findById(id) {
        const g = db.getTraversal();
        
        try {
            const events = await g.V().has('Event', 'id', id).elementMap().toList();
            
            if (events.length === 0) {
                return null;
            }

            return Event.fromGraphData(events[0]);
        } catch (error) {
            throw new Error(`Error finding event by ID: ${error.message}`);
        }
    }

    static async findAll(filters = {}) {
        const g = db.getTraversal();
        
        try {
            let query = g.V().hasLabel('Event');

            // Apply filters
            if (filters.eventType) {
                query = query.has('eventType', filters.eventType);
            }
            if (filters.category) {
                const typesInCategory = Object.entries(EVENT_TYPES)
                    .filter(([_, config]) => config.category === filters.category)
                    .map(([type, _]) => type);
                query = query.has('eventType', gremlin.process.P.within(typesInCategory));
            }
            if (filters.createdBy) {
                query = query.has('createdBy', filters.createdBy);
            }
            if (filters.privacy) {
                query = query.has('privacy', filters.privacy);
            }
            if (filters.isVerified !== undefined) {
                query = query.has('isVerified', filters.isVerified);
            }
            if (filters.status) {
                query = query.has('status', filters.status);
            }
            if (filters.dateFrom) {
                query = query.has('date', gremlin.process.P.gte(filters.dateFrom));
            }
            if (filters.dateTo) {
                query = query.has('date', gremlin.process.P.lte(filters.dateTo));
            }

            // Apply sorting
            if (filters.sortBy === 'date') {
                query = query.order().by('date', filters.sortOrder === 'desc' ? gremlin.process.Order.desc : gremlin.process.Order.asc);
            } else if (filters.sortBy === 'created') {
                query = query.order().by('createdAt', filters.sortOrder === 'desc' ? gremlin.process.Order.desc : gremlin.process.Order.asc);
            }

            // Apply pagination
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.skip) {
                query = query.skip(filters.skip);
            }

            const events = await query.elementMap().toList();
            return events.map(eventData => Event.fromGraphData(eventData));
        } catch (error) {
            throw new Error(`Error finding events: ${error.message}`);
        }
    }

    static async findByUser(userId, role = null) {
        const g = db.getTraversal();
        
        try {
            let query = g.V()
                .has('User', 'id', userId)
                .outE('PARTICIPATED_IN');

            if (role) {
                query = query.has('role', role);
            }

            const events = await query
                .inV()
                .elementMap()
                .toList();

            return events.map(eventData => Event.fromGraphData(eventData));
        } catch (error) {
            throw new Error(`Error finding events for user: ${error.message}`);
        }
    }

    static async search(searchTerm, filters = {}) {
        const g = db.getTraversal();
        
        try {
            let query = g.V().hasLabel('Event');

            // Apply text search (simplified - in production, use full-text search)
            if (searchTerm) {
                query = query.or(
                    __.has('title', gremlin.process.P.containing(searchTerm)),
                    __.has('description', gremlin.process.P.containing(searchTerm)),
                    __.has('notes', gremlin.process.P.containing(searchTerm))
                );
            }

            // Apply additional filters
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null) {
                    query = query.has(key, filters[key]);
                }
            });

            const events = await query.elementMap().limit(50).toList();
            return events.map(eventData => Event.fromGraphData(eventData));
        } catch (error) {
            throw new Error(`Error searching events: ${error.message}`);
        }
    }

    static async delete(id) {
        const g = db.getTraversal();
        
        try {
            // Delete all participation edges first
            await g.V().has('Event', 'id', id).inE('PARTICIPATED_IN').drop().iterate();
            
            // Delete event vertex
            await g.V().has('Event', 'id', id).drop().iterate();
            
            return true;
        } catch (error) {
            throw new Error(`Error deleting event: ${error.message}`);
        }
    }

    static fromGraphData(data) {
        const eventData = {};
        
        // Convert Map to object and parse JSON fields
        for (const [key, value] of data.entries()) {
            if (key === gremlin.process.T.label || key === gremlin.process.T.id) {
                continue;
            }
            
            // Parse JSON fields
            const jsonFields = [
                'location', 'photos', 'videos', 'documents', 'sources',
                'references', 'tags', 'collaborators', 'contributions'
            ];
            
            if (jsonFields.includes(key) && typeof value === 'string') {
                try {
                    eventData[key] = JSON.parse(value);
                } catch (e) {
                    eventData[key] = value;
                }
            } else {
                eventData[key] = value;
            }
        }

        return new Event(eventData);
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            eventType: this.eventType,
            eventSubtype: this.eventSubtype,
            date: this.date,
            endDate: this.endDate,
            isApproximate: this.isApproximate,
            timeOfDay: this.timeOfDay,
            duration: this.duration,
            location: this.location,
            photos: this.photos,
            videos: this.videos,
            documents: this.documents,
            mediaCount: this.mediaCount,
            significance: this.significance,
            privacy: this.privacy,
            isVerified: this.isVerified,
            sources: this.sources,
            references: this.references,
            notes: this.notes,
            tags: this.tags,
            weather: this.weather,
            context: this.context,
            culturalNotes: this.culturalNotes,
            cost: this.cost,
            currency: this.currency,
            organizer: this.organizer,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            createdBy: this.createdBy,
            lastModifiedBy: this.lastModifiedBy,
            status: this.status,
            isPublic: this.isPublic,
            isRecurring: this.isRecurring,
            recurrencePattern: this.recurrencePattern,
            collaborators: this.collaborators,
            contributions: this.contributions
        };
    }
}

module.exports = { Event, EVENT_TYPES, PARTICIPANT_ROLES };