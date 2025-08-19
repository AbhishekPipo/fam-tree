const database = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class Relationship {
  // Relationship type definitions with metadata
  static RELATIONSHIP_TYPES = {
    // Blood relationships
    PARENT_OF: {
      reciprocal: 'CHILD_OF',
      category: 'blood',
      level: 1,
      allowedSubtypes: ['biological', 'adoptive', 'step', 'foster'],
      requiredProperties: [],
      validationRules: ['preventSelfRelation', 'preventCircularRelation', 'ageValidation']
    },
    CHILD_OF: {
      reciprocal: 'PARENT_OF',
      category: 'blood',
      level: -1,
      allowedSubtypes: ['biological', 'adoptive', 'step', 'foster'],
      requiredProperties: [],
      validationRules: ['preventSelfRelation', 'preventCircularRelation']
    },
    SIBLING_OF: {
      reciprocal: 'SIBLING_OF',
      category: 'blood',
      level: 0,
      allowedSubtypes: ['full', 'half', 'step', 'adoptive'],
      requiredProperties: [],
      validationRules: ['preventSelfRelation', 'symmetricRelation']
    },
    
    // Marriage relationships
    MARRIED_TO: {
      reciprocal: 'MARRIED_TO',
      category: 'marriage',
      level: 0,
      allowedSubtypes: ['civil', 'religious', 'common-law'],
      requiredProperties: ['marriageDate'],
      validationRules: ['preventSelfRelation', 'preventPolygamy', 'symmetricRelation']
    },
    ENGAGED_TO: {
      reciprocal: 'ENGAGED_TO',
      category: 'engagement',
      level: 0,
      allowedSubtypes: [],
      requiredProperties: ['engagementDate'],
      validationRules: ['preventSelfRelation', 'symmetricRelation']
    },
    
    // Extended family
    GRANDPARENT_OF: {
      reciprocal: 'GRANDCHILD_OF',
      category: 'blood',
      level: 2,
      allowedSubtypes: ['paternal', 'maternal'],
      requiredProperties: [],
      validationRules: ['preventSelfRelation', 'ageValidation']
    },
    GRANDCHILD_OF: {
      reciprocal: 'GRANDPARENT_OF',
      category: 'blood',
      level: -2,
      allowedSubtypes: ['paternal', 'maternal'],
      requiredProperties: [],
      validationRules: ['preventSelfRelation']
    },
    UNCLE_AUNT_OF: {
      reciprocal: 'NEPHEW_NIECE_OF',
      category: 'blood',
      level: 1,
      allowedSubtypes: ['blood', 'marriage'],
      requiredProperties: [],
      validationRules: ['preventSelfRelation']
    },
    NEPHEW_NIECE_OF: {
      reciprocal: 'UNCLE_AUNT_OF',
      category: 'blood',
      level: -1,
      allowedSubtypes: ['blood', 'marriage'],
      requiredProperties: [],
      validationRules: ['preventSelfRelation']
    },
    COUSIN_OF: {
      reciprocal: 'COUSIN_OF',
      category: 'blood',
      level: 0,
      allowedSubtypes: ['first', 'second', 'third', 'removed'],
      requiredProperties: [],
      validationRules: ['preventSelfRelation', 'symmetricRelation']
    },
    
    // In-law relationships
    IN_LAW_OF: {
      reciprocal: 'IN_LAW_OF',
      category: 'marriage',
      level: 0,
      allowedSubtypes: ['parent', 'child', 'sibling'],
      requiredProperties: ['throughSpouse'],
      validationRules: ['preventSelfRelation', 'symmetricRelation']
    }
  };

  constructor(fromPersonId, toPersonId, relationshipType, properties = {}) {
    this.fromPersonId = fromPersonId;
    this.toPersonId = toPersonId;
    this.relationshipType = relationshipType;
    this.properties = {
      establishedDate: new Date().toISOString(),
      confidence: 1.0,
      isVerified: false,
      notes: null,
      sources: [],
      ...properties
    };
  }

  // Validation methods
  validate() {
    const errors = [];
    const relationshipDef = Relationship.RELATIONSHIP_TYPES[this.relationshipType];

    if (!relationshipDef) {
      errors.push(`Invalid relationship type: ${this.relationshipType}`);
      return errors;
    }

    // Check required properties
    for (const prop of relationshipDef.requiredProperties) {
      if (!this.properties[prop]) {
        errors.push(`Required property missing: ${prop}`);
      }
    }

    // Validate subtype if provided
    if (this.properties.relationshipSubtype && 
        relationshipDef.allowedSubtypes.length > 0 &&
        !relationshipDef.allowedSubtypes.includes(this.properties.relationshipSubtype)) {
      errors.push(`Invalid subtype: ${this.properties.relationshipSubtype}`);
    }

    // Validate confidence score
    if (this.properties.confidence < 0 || this.properties.confidence > 1) {
      errors.push('Confidence must be between 0 and 1');
    }

    // Validate dates
    if (this.properties.marriageDate && isNaN(new Date(this.properties.marriageDate).getTime())) {
      errors.push('Invalid marriage date');
    }

    if (this.properties.divorceDate && isNaN(new Date(this.properties.divorceDate).getTime())) {
      errors.push('Invalid divorce date');
    }

    if (this.properties.marriageDate && this.properties.divorceDate &&
        new Date(this.properties.divorceDate) < new Date(this.properties.marriageDate)) {
      errors.push('Divorce date cannot be before marriage date');
    }

    return errors;
  }

  async validateBusinessRules() {
    const errors = [];
    const relationshipDef = Relationship.RELATIONSHIP_TYPES[this.relationshipType];

    if (!relationshipDef) return errors;

    // Apply validation rules
    for (const rule of relationshipDef.validationRules) {
      try {
        switch (rule) {
          case 'preventSelfRelation':
            if (this.fromPersonId === this.toPersonId) {
              errors.push('Person cannot have relationship with themselves');
            }
            break;

          case 'preventCircularRelation':
            if (await this.hasCircularRelation()) {
              errors.push('Circular relationship detected');
            }
            break;

          case 'preventPolygamy':
            if (await this.hasActiveMarriage()) {
              errors.push('Person is already married');
            }
            break;

          case 'ageValidation':
            if (await this.hasInvalidAge()) {
              errors.push('Age difference is not valid for this relationship');
            }
            break;

          case 'symmetricRelation':
            // This will be handled during creation
            break;
        }
      } catch (error) {
        console.error(`Error validating rule ${rule}:`, error);
      }
    }

    return errors;
  }

  async hasCircularRelation() {
    // Check if creating this relationship would create a circular dependency
    const cypher = `
      MATCH path = (from:Person {id: $toPersonId})-[:PARENT_OF*1..10]->(to:Person {id: $fromPersonId})
      RETURN count(path) > 0 as hasCircular
    `;

    const result = await database.runQuery(cypher, {
      fromPersonId: this.fromPersonId,
      toPersonId: this.toPersonId
    });

    return result.records[0]?.get('hasCircular') || false;
  }

  async hasActiveMarriage() {
    if (this.relationshipType !== 'MARRIED_TO') return false;

    const cypher = `
      MATCH (p:Person {id: $personId})-[r:MARRIED_TO]-(spouse:Person)
      WHERE r.status = 'married' OR r.status IS NULL
      RETURN count(r) > 0 as hasActiveMarriage
    `;

    const fromResult = await database.runQuery(cypher, { personId: this.fromPersonId });
    const toResult = await database.runQuery(cypher, { personId: this.toPersonId });

    return fromResult.records[0]?.get('hasActiveMarriage') || 
           toResult.records[0]?.get('hasActiveMarriage') || false;
  }

  async hasInvalidAge() {
    // Check age differences for parent-child relationships
    if (!['PARENT_OF', 'CHILD_OF'].includes(this.relationshipType)) return false;

    const cypher = `
      MATCH (from:Person {id: $fromPersonId})
      MATCH (to:Person {id: $toPersonId})
      WHERE from.dateOfBirth IS NOT NULL AND to.dateOfBirth IS NOT NULL
      RETURN 
        duration.between(date(from.dateOfBirth), date(to.dateOfBirth)).years as ageDiff
    `;

    const result = await database.runQuery(cypher, {
      fromPersonId: this.fromPersonId,
      toPersonId: this.toPersonId
    });

    if (result.records.length === 0) return false;

    const ageDiff = result.records[0].get('ageDiff');
    
    // Parent should be at least 12 years older than child
    if (this.relationshipType === 'PARENT_OF' && ageDiff < 12) {
      return true;
    }

    return false;
  }

  // Create relationship
  async create() {
    const validationErrors = this.validate();
    if (validationErrors.length > 0) {
      throw new AppError(`Validation failed: ${validationErrors.join(', ')}`, 400, 'VALIDATION_ERROR');
    }

    const businessRuleErrors = await this.validateBusinessRules();
    if (businessRuleErrors.length > 0) {
      throw new AppError(`Business rule validation failed: ${businessRuleErrors.join(', ')}`, 400, 'BUSINESS_RULE_ERROR');
    }

    const relationshipDef = Relationship.RELATIONSHIP_TYPES[this.relationshipType];
    const queries = [];

    // Create primary relationship
    queries.push({
      cypher: `
        MATCH (from:Person {id: $fromPersonId})
        MATCH (to:Person {id: $toPersonId})
        CREATE (from)-[r:${this.relationshipType} $properties]->(to)
        RETURN r
      `,
      parameters: {
        fromPersonId: this.fromPersonId,
        toPersonId: this.toPersonId,
        properties: this.properties
      }
    });

    // Create reciprocal relationship if needed
    if (relationshipDef.validationRules.includes('symmetricRelation')) {
      queries.push({
        cypher: `
          MATCH (from:Person {id: $toPersonId})
          MATCH (to:Person {id: $fromPersonId})
          CREATE (from)-[r:${relationshipDef.reciprocal} $properties]->(to)
          RETURN r
        `,
        parameters: {
          fromPersonId: this.toPersonId,
          toPersonId: this.fromPersonId,
          properties: this.properties
        }
      });
    }

    const results = await database.runTransaction(queries);
    
    if (results.length === 0 || results[0].records.length === 0) {
      throw new AppError('Failed to create relationship', 500, 'RELATIONSHIP_CREATION_FAILED');
    }

    return database.constructor.extractRelationshipProperties(results[0].records[0], 'r');
  }

  // Static methods
  static async findRelationship(fromPersonId, toPersonId, relationshipType) {
    const cypher = `
      MATCH (from:Person {id: $fromPersonId})-[r:${relationshipType}]->(to:Person {id: $toPersonId})
      RETURN r, from, to
    `;

    const result = await database.runQuery(cypher, {
      fromPersonId,
      toPersonId
    });

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    return {
      relationship: database.constructor.extractRelationshipProperties(record, 'r'),
      fromPerson: database.constructor.extractNodeProperties(record, 'from'),
      toPerson: database.constructor.extractNodeProperties(record, 'to')
    };
  }

  static async getAllRelationships(personId) {
    const cypher = `
      MATCH (p:Person {id: $personId})-[r]-(related:Person)
      RETURN r, related, 
             CASE WHEN startNode(r).id = $personId THEN 'outgoing' ELSE 'incoming' END as direction
      ORDER BY type(r), related.firstName, related.lastName
    `;

    const result = await database.runQuery(cypher, { personId });

    return result.records.map(record => ({
      relationship: database.constructor.extractRelationshipProperties(record, 'r'),
      relatedPerson: database.constructor.extractNodeProperties(record, 'related'),
      direction: record.get('direction')
    }));
  }

  static async updateRelationship(fromPersonId, toPersonId, relationshipType, updateProperties) {
    const cypher = `
      MATCH (from:Person {id: $fromPersonId})-[r:${relationshipType}]->(to:Person {id: $toPersonId})
      SET r += $properties
      RETURN r
    `;

    const result = await database.runQuery(cypher, {
      fromPersonId,
      toPersonId,
      properties: updateProperties
    });

    if (result.records.length === 0) {
      throw new AppError('Relationship not found', 404, 'RELATIONSHIP_NOT_FOUND');
    }

    return database.constructor.extractRelationshipProperties(result.records[0], 'r');
  }

  static async deleteRelationship(fromPersonId, toPersonId, relationshipType) {
    const relationshipDef = Relationship.RELATIONSHIP_TYPES[relationshipType];
    const queries = [];

    // Delete primary relationship
    queries.push({
      cypher: `
        MATCH (from:Person {id: $fromPersonId})-[r:${relationshipType}]->(to:Person {id: $toPersonId})
        DELETE r
        RETURN count(r) as deletedCount
      `,
      parameters: { fromPersonId, toPersonId }
    });

    // Delete reciprocal relationship if it's symmetric
    if (relationshipDef?.validationRules.includes('symmetricRelation')) {
      queries.push({
        cypher: `
          MATCH (from:Person {id: $toPersonId})-[r:${relationshipDef.reciprocal}]->(to:Person {id: $fromPersonId})
          DELETE r
          RETURN count(r) as deletedCount
        `,
        parameters: { fromPersonId: toPersonId, toPersonId: fromPersonId }
      });
    }

    const results = await database.runTransaction(queries);
    const totalDeleted = results.reduce((sum, result) => 
      sum + (result.records[0]?.get('deletedCount').toNumber() || 0), 0);

    if (totalDeleted === 0) {
      throw new AppError('Relationship not found', 404, 'RELATIONSHIP_NOT_FOUND');
    }

    return { deletedCount: totalDeleted };
  }

  // Specialized relationship creation methods
  static async createMarriage(spouse1Id, spouse2Id, marriageData) {
    const properties = {
      marriageDate: marriageData.marriageDate,
      marriageLocation: marriageData.marriageLocation || null,
      status: 'married',
      marriageType: marriageData.marriageType || 'civil',
      certificate: marriageData.certificate || null,
      witnesses: marriageData.witnesses || [],
      ...marriageData.additionalProperties
    };

    const relationship = new Relationship(spouse1Id, spouse2Id, 'MARRIED_TO', properties);
    return await relationship.create();
  }

  static async createParentChild(parentId, childId, relationshipData = {}) {
    const properties = {
      relationshipType: relationshipData.relationshipType || 'biological',
      confidence: relationshipData.confidence || 1.0,
      ...relationshipData.additionalProperties
    };

    const relationship = new Relationship(parentId, childId, 'PARENT_OF', properties);
    return await relationship.create();
  }

  static async createSiblings(sibling1Id, sibling2Id, siblingData = {}) {
    const properties = {
      siblingType: siblingData.siblingType || 'full',
      sharedParents: siblingData.sharedParents || [],
      birthOrder: siblingData.birthOrder || null,
      ...siblingData.additionalProperties
    };

    const relationship = new Relationship(sibling1Id, sibling2Id, 'SIBLING_OF', properties);
    return await relationship.create();
  }

  // Relationship analysis methods
  static async findRelationshipPath(person1Id, person2Id, maxDepth = 6) {
    const cypher = `
      MATCH path = shortestPath((p1:Person {id: $person1Id})-[*1..${maxDepth}]-(p2:Person {id: $person2Id}))
      WHERE p1 <> p2
      RETURN path, length(path) as pathLength
      ORDER BY pathLength
      LIMIT 5
    `;

    const result = await database.runQuery(cypher, { person1Id, person2Id });

    return result.records.map(record => {
      const path = record.get('path');
      const pathLength = record.get('pathLength').toNumber();
      
      const nodes = path.segments.map(segment => ({
        start: database.constructor.extractNodeProperties({ get: () => segment.start }, ''),
        relationship: database.constructor.extractRelationshipProperties({ get: () => segment.relationship }, ''),
        end: database.constructor.extractNodeProperties({ get: () => segment.end }, '')
      }));

      return { nodes, pathLength };
    });
  }

  static async getRelationshipStats(personId) {
    const cypher = `
      MATCH (p:Person {id: $personId})
      OPTIONAL MATCH (p)-[r]-(related:Person)
      RETURN 
        count(DISTINCT related) as totalRelations,
        count(DISTINCT CASE WHEN type(r) = 'PARENT_OF' THEN related END) as children,
        count(DISTINCT CASE WHEN type(r) = 'CHILD_OF' THEN related END) as parents,
        count(DISTINCT CASE WHEN type(r) = 'SIBLING_OF' THEN related END) as siblings,
        count(DISTINCT CASE WHEN type(r) = 'MARRIED_TO' THEN related END) as spouses,
        collect(DISTINCT type(r)) as relationshipTypes
    `;

    const result = await database.runQuery(cypher, { personId });

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    return {
      totalRelations: record.get('totalRelations').toNumber(),
      breakdown: {
        children: record.get('children').toNumber(),
        parents: record.get('parents').toNumber(),
        siblings: record.get('siblings').toNumber(),
        spouses: record.get('spouses').toNumber()
      },
      relationshipTypes: record.get('relationshipTypes')
    };
  }

  // Utility methods
  static getRelationshipLabel(relationshipType, fromGender, toGender) {
    const labels = {
      PARENT_OF: fromGender === 'male' ? 'Father' : 'Mother',
      CHILD_OF: toGender === 'male' ? 'Son' : 'Daughter',
      SIBLING_OF: toGender === 'male' ? 'Brother' : 'Sister',
      MARRIED_TO: toGender === 'male' ? 'Husband' : 'Wife',
      GRANDPARENT_OF: fromGender === 'male' ? 'Grandfather' : 'Grandmother',
      GRANDCHILD_OF: toGender === 'male' ? 'Grandson' : 'Granddaughter'
    };

    return labels[relationshipType] || relationshipType.replace('_', ' ').toLowerCase();
  }

  static isValidRelationshipType(relationshipType) {
    return Object.keys(Relationship.RELATIONSHIP_TYPES).includes(relationshipType);
  }

  static getRelationshipDefinition(relationshipType) {
    return Relationship.RELATIONSHIP_TYPES[relationshipType] || null;
  }
}

module.exports = Relationship;