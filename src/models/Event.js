const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class Event {
  constructor(data) {
    // Identity
    this.id = data.id || uuidv4();
    
    // Event Details
    this.title = data.title;
    this.description = data.description || null;
    this.eventType = data.eventType || 'other';
    
    // Timing
    this.date = data.date;
    this.endDate = data.endDate || null;
    this.isApproximate = data.isApproximate || false;
    
    // Location
    this.location = data.location || {};
    
    // Media
    this.photos = data.photos || [];
    this.documents = data.documents || [];
    
    // Metadata
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.createdBy = data.createdBy || null;
    
    // Verification
    this.isVerified = data.isVerified || false;
    this.sources = data.sources || [];
  }

  // Validation
  validate() {
    const errors = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Event title is required');
    }

    if (this.title && this.title.length > 200) {
      errors.push('Event title must be less than 200 characters');
    }

    if (!this.date) {
      errors.push('Event date is required');
    }

    if (this.date && isNaN(new Date(this.date).getTime())) {
      errors.push('Invalid event date format');
    }

    if (this.endDate && isNaN(new Date(this.endDate).getTime())) {
      errors.push('Invalid end date format');
    }

    if (this.date && this.endDate && new Date(this.endDate) < new Date(this.date)) {
      errors.push('End date cannot be before start date');
    }

    const validEventTypes = [
      'birth', 'death', 'marriage', 'divorce', 'graduation', 
      'career', 'military', 'immigration', 'other'
    ];
    
    if (!validEventTypes.includes(this.eventType)) {
      errors.push('Invalid event type');
    }

    return errors;
  }

  // Convert to JSON
  toJSON() {
    return { ...this };
  }

  // Save event to Neo4j
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new AppError(`Validation failed: ${errors.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    this.updatedAt = new Date().toISOString();

    const cypher = `
      MERGE (e:Event {id: $id})
      SET e += $properties
      RETURN e
    `;

    const result = await database.runQuery(cypher, {
      id: this.id,
      properties: this.toJSON()
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to save event', 500, 'SAVE_FAILED');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'e');
  }

  // Static methods
  static async findById(id) {
    const cypher = `
      MATCH (e:Event {id: $id})
      OPTIONAL MATCH (p:Person)-[r:PARTICIPATED_IN]->(e)
      OPTIONAL MATCH (e)-[:DOCUMENTED_BY]->(m:Media)
      RETURN e, 
             collect(DISTINCT {person: p, role: r.role}) as participants,
             collect(DISTINCT m) as media
    `;
    
    const result = await database.runQuery(cypher, { id });
    
    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const event = database.constructor.extractNodeProperties(record, 'e');
    
    const participants = record.get('participants')
      .filter(p => p.person !== null)
      .map(p => ({
        person: database.constructor.extractNodeProperties({ get: () => p.person }, ''),
        role: p.role
      }));

    const media = record.get('media')
      .filter(m => m !== null)
      .map(m => database.constructor.extractNodeProperties({ get: () => m }, ''));

    return {
      ...event,
      participants,
      media
    };
  }

  static async findAll(filters = {}) {
    let cypher = 'MATCH (e:Event)';
    const params = {};
    const conditions = [];

    // Apply filters
    if (filters.eventType) {
      conditions.push('e.eventType = $eventType');
      params.eventType = filters.eventType;
    }

    if (filters.startDate) {
      conditions.push('e.date >= $startDate');
      params.startDate = filters.startDate;
    }

    if (filters.endDate) {
      conditions.push('e.date <= $endDate');
      params.endDate = filters.endDate;
    }

    if (filters.isVerified !== undefined) {
      conditions.push('e.isVerified = $isVerified');
      params.isVerified = filters.isVerified;
    }

    if (filters.createdBy) {
      conditions.push('e.createdBy = $createdBy');
      params.createdBy = filters.createdBy;
    }

    if (conditions.length > 0) {
      cypher += ' WHERE ' + conditions.join(' AND ');
    }

    cypher += ' RETURN e ORDER BY e.date DESC';

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => 
      database.constructor.extractNodeProperties(record, 'e')
    );
  }

  static async findByPerson(personId) {
    const cypher = `
      MATCH (p:Person {id: $personId})-[r:PARTICIPATED_IN]->(e:Event)
      RETURN e, r.role as role
      ORDER BY e.date
    `;

    const result = await database.runQuery(cypher, { personId });
    
    return result.records.map(record => ({
      event: database.constructor.extractNodeProperties(record, 'e'),
      role: record.get('role')
    }));
  }

  static async search(searchTerm) {
    const cypher = `
      CALL db.index.fulltext.queryNodes('event_search_index', $searchTerm)
      YIELD node, score
      RETURN node as e, score
      ORDER BY score DESC
      LIMIT 50
    `;

    const result = await database.runQuery(cypher, { searchTerm });
    
    return result.records.map(record => ({
      event: database.constructor.extractNodeProperties(record, 'e'),
      score: record.get('score')
    }));
  }

  static async create(eventData) {
    const event = new Event(eventData);
    return await event.save();
  }

  static async update(id, updateData) {
    updateData.updatedAt = new Date().toISOString();

    const cypher = `
      MATCH (e:Event {id: $id})
      SET e += $properties
      RETURN e
    `;

    const result = await database.runQuery(cypher, {
      id,
      properties: updateData
    });

    if (result.records.length === 0) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'e');
  }

  static async delete(id) {
    const cypher = `
      MATCH (e:Event {id: $id})
      DETACH DELETE e
      RETURN count(e) as deletedCount
    `;

    const result = await database.runQuery(cypher, { id });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
    }

    return { deletedCount };
  }

  // Participant management
  static async addParticipant(eventId, personId, role = 'attendee') {
    const validRoles = ['subject', 'witness', 'officiant', 'attendee', 'photographer'];
    
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid participant role', 400, 'INVALID_ROLE');
    }

    const cypher = `
      MATCH (e:Event {id: $eventId})
      MATCH (p:Person {id: $personId})
      MERGE (p)-[r:PARTICIPATED_IN]->(e)
      SET r.role = $role
      RETURN r
    `;

    const result = await database.runQuery(cypher, {
      eventId,
      personId,
      role
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to add participant', 500, 'ADD_PARTICIPANT_FAILED');
    }

    return database.constructor.extractRelationshipProperties(result.records[0], 'r');
  }

  static async removeParticipant(eventId, personId) {
    const cypher = `
      MATCH (p:Person {id: $personId})-[r:PARTICIPATED_IN]->(e:Event {id: $eventId})
      DELETE r
      RETURN count(r) as deletedCount
    `;

    const result = await database.runQuery(cypher, { eventId, personId });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('Participant relationship not found', 404, 'PARTICIPANT_NOT_FOUND');
    }

    return { deletedCount };
  }

  static async getParticipants(eventId) {
    const cypher = `
      MATCH (e:Event {id: $eventId})
      OPTIONAL MATCH (p:Person)-[r:PARTICIPATED_IN]->(e)
      RETURN p, r.role as role
      ORDER BY 
        CASE r.role 
          WHEN 'subject' THEN 1
          WHEN 'officiant' THEN 2
          WHEN 'witness' THEN 3
          WHEN 'attendee' THEN 4
          ELSE 5
        END,
        p.firstName, p.lastName
    `;

    const result = await database.runQuery(cypher, { eventId });
    
    return result.records
      .filter(record => record.get('p') !== null)
      .map(record => ({
        person: database.constructor.extractNodeProperties(record, 'p'),
        role: record.get('role')
      }));
  }

  // Media management
  static async addMedia(eventId, mediaId, documentType = 'photo', isPrimary = false) {
    const validDocumentTypes = ['photo', 'certificate', 'video', 'audio', 'document'];
    
    if (!validDocumentTypes.includes(documentType)) {
      throw new AppError('Invalid document type', 400, 'INVALID_DOCUMENT_TYPE');
    }

    const cypher = `
      MATCH (e:Event {id: $eventId})
      MATCH (m:Media {id: $mediaId})
      MERGE (e)-[r:DOCUMENTED_BY]->(m)
      SET r.documentType = $documentType,
          r.isPrimary = $isPrimary
      RETURN r
    `;

    const result = await database.runQuery(cypher, {
      eventId,
      mediaId,
      documentType,
      isPrimary
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to add media', 500, 'ADD_MEDIA_FAILED');
    }

    return database.constructor.extractRelationshipProperties(result.records[0], 'r');
  }

  static async removeMedia(eventId, mediaId) {
    const cypher = `
      MATCH (e:Event {id: $eventId})-[r:DOCUMENTED_BY]->(m:Media {id: $mediaId})
      DELETE r
      RETURN count(r) as deletedCount
    `;

    const result = await database.runQuery(cypher, { eventId, mediaId });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      throw new AppError('Media relationship not found', 404, 'MEDIA_NOT_FOUND');
    }

    return { deletedCount };
  }

  static async getEventMedia(eventId) {
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

  // Timeline and chronological methods
  static async getPersonTimeline(personId, startDate = null, endDate = null) {
    let cypher = `
      MATCH (p:Person {id: $personId})-[r:PARTICIPATED_IN]->(e:Event)
    `;

    const params = { personId };
    const conditions = [];

    if (startDate) {
      conditions.push('e.date >= $startDate');
      params.startDate = startDate;
    }

    if (endDate) {
      conditions.push('e.date <= $endDate');
      params.endDate = endDate;
    }

    if (conditions.length > 0) {
      cypher += ' WHERE ' + conditions.join(' AND ');
    }

    cypher += `
      RETURN e, r.role as role
      ORDER BY e.date
    `;

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => ({
      event: database.constructor.extractNodeProperties(record, 'e'),
      role: record.get('role')
    }));
  }

  static async getFamilyTimeline(familyTreeId, startDate = null, endDate = null) {
    let cypher = `
      MATCH (ft:FamilyTree {id: $familyTreeId})<-[:BELONGS_TO]-(p:Person)
      MATCH (p)-[r:PARTICIPATED_IN]->(e:Event)
    `;

    const params = { familyTreeId };
    const conditions = [];

    if (startDate) {
      conditions.push('e.date >= $startDate');
      params.startDate = startDate;
    }

    if (endDate) {
      conditions.push('e.date <= $endDate');
      params.endDate = endDate;
    }

    if (conditions.length > 0) {
      cypher += ' WHERE ' + conditions.join(' AND ');
    }

    cypher += `
      RETURN e, p, r.role as role
      ORDER BY e.date
    `;

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => ({
      event: database.constructor.extractNodeProperties(record, 'e'),
      person: database.constructor.extractNodeProperties(record, 'p'),
      role: record.get('role')
    }));
  }

  // Event type specific methods
  static async createBirthEvent(personId, birthData, createdBy) {
    const eventData = {
      title: `Birth of ${birthData.personName || 'Person'}`,
      description: birthData.description,
      eventType: 'birth',
      date: birthData.date,
      location: birthData.location,
      createdBy,
      isVerified: birthData.isVerified || false,
      sources: birthData.sources || []
    };

    const event = await Event.create(eventData);
    await Event.addParticipant(event.id, personId, 'subject');

    return event;
  }

  static async createMarriageEvent(spouse1Id, spouse2Id, marriageData, createdBy) {
    const eventData = {
      title: marriageData.title || 'Marriage',
      description: marriageData.description,
      eventType: 'marriage',
      date: marriageData.date,
      location: marriageData.location,
      createdBy,
      isVerified: marriageData.isVerified || false,
      sources: marriageData.sources || []
    };

    const event = await Event.create(eventData);
    await Event.addParticipant(event.id, spouse1Id, 'subject');
    await Event.addParticipant(event.id, spouse2Id, 'subject');

    // Add witnesses if provided
    if (marriageData.witnesses && marriageData.witnesses.length > 0) {
      for (const witnessId of marriageData.witnesses) {
        await Event.addParticipant(event.id, witnessId, 'witness');
      }
    }

    return event;
  }

  static async createDeathEvent(personId, deathData, createdBy) {
    const eventData = {
      title: `Death of ${deathData.personName || 'Person'}`,
      description: deathData.description,
      eventType: 'death',
      date: deathData.date,
      location: deathData.location,
      createdBy,
      isVerified: deathData.isVerified || false,
      sources: deathData.sources || []
    };

    const event = await Event.create(eventData);
    await Event.addParticipant(event.id, personId, 'subject');

    return event;
  }
}

module.exports = Event;