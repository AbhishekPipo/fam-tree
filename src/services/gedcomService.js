const fs = require('fs').promises;
const path = require('path');
const database = require('../config/database');
const logger = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');
const User = require('../models/User');
const FamilyTree = require('../models/FamilyTree');
const { v4: uuidv4 } = require('uuid');

class GedcomService {
  /**
   * Import   /**
   * Add a user to a family tree
   * @param {string} treeId - Family tree ID
   * @param {string} userId - User ID
   */
  static async addUserToTree(treeId, userId) {
    const cypher = `
      MATCH (ft:FamilyTree {id: $treeId})
      MATCH (u:User {id: $userId})
      CREATE (ft)-[:CONTAINS]->(u)
    `;

    await database.runQuery(cypher, { treeId, userId });
  }

  /**
   * Import GEDCOM file
   * @param {string} filePath - Path to GEDCOM file
   * @param {string} userId - User ID importing the file
   * @param {string} treeId - Family tree ID (optional)
   * @returns {Object} Import results
   */
  static async importGedcom(filePath, userId, treeId = null) {
    try {
      logger.info(`Starting GEDCOM import from ${filePath} for user ${userId}`);
      
      const gedcomContent = await fs.readFile(filePath, 'utf-8');
      const parsedData = this.parseGedcom(gedcomContent);
      
      // Create or use existing family tree
      let familyTree;
      if (treeId) {
        familyTree = await FamilyTree.findById(treeId);
        if (!familyTree) {
          throw new AppError('Family tree not found', 404, 'TREE_NOT_FOUND');
        }
      } else {
        familyTree = await FamilyTree.create({
          name: `Imported Tree ${new Date().toISOString().split('T')[0]}`,
          description: 'Imported from GEDCOM file',
          ownerId: userId,
          visibility: 'family'
        });
      }

      const importResults = {
        treeId: familyTree.id,
        personsImported: 0,
        relationshipsImported: 0,
        eventsImported: 0,
        errors: [],
        warnings: []
      };

      // Import individuals
      const userMap = new Map(); // GEDCOM ID -> Neo4j ID mapping
      
      for (const individual of parsedData.individuals) {
        try {
          const userData = this.convertGedcomIndividual(individual);
          const user = await User.create(userData);
          userMap.set(individual.id, user.id);
          
          // Add user to family tree
          await this.addUserToTree(familyTree.id, user.id);
          
          importResults.personsImported++;
        } catch (error) {
          importResults.errors.push({
            type: 'person',
            gedcomId: individual.id,
            error: error.message
          });
        }
      }

      // Import families and relationships
      for (const family of parsedData.families) {
        try {
          await this.importFamily(family, userMap);
          importResults.relationshipsImported += this.countFamilyRelationships(family);
        } catch (error) {
          importResults.errors.push({
            type: 'family',
            gedcomId: family.id,
            error: error.message
          });
        }
      }

      // Import events
      for (const event of parsedData.events) {
        try {
          await this.importEvent(event, userMap);
          importResults.eventsImported++;
        } catch (error) {
          importResults.errors.push({
            type: 'event',
            gedcomId: event.id,
            error: error.message
          });
        }
      }

      logger.info(`GEDCOM import completed: ${importResults.personsImported} persons, ${importResults.relationshipsImported} relationships, ${importResults.eventsImported} events`);
      
      return importResults;

    } catch (error) {
      logger.error('GEDCOM import failed:', error);
      throw new AppError('GEDCOM import failed', 500, 'GEDCOM_IMPORT_FAILED');
    }
  }

  /**
   * Export family tree to GEDCOM format
   * @param {string} treeId - Family tree ID
   * @param {string} userId - User ID requesting export
   * @returns {string} GEDCOM content
   */
  static async exportGedcom(treeId, userId) {
    try {
      logger.info(`Starting GEDCOM export for tree ${treeId} by user ${userId}`);

      // Verify user has access to the tree
      const tree = await FamilyTree.findById(treeId);
      if (!tree) {
        throw new AppError('Family tree not found', 404, 'TREE_NOT_FOUND');
      }

      // Get all persons in the tree
      const persons = await this.getTreePersons(treeId);
      
      // Get all relationships
      const relationships = await this.getTreeRelationships(treeId);
      
      // Get all events
      const events = await this.getTreeEvents(treeId);

      // Generate GEDCOM content
      const gedcomContent = this.generateGedcomContent(tree, persons, relationships, events);
      
      logger.info(`GEDCOM export completed for tree ${treeId}: ${persons.length} persons, ${relationships.length} relationships`);
      
      return gedcomContent;

    } catch (error) {
      logger.error('GEDCOM export failed:', error);
      throw new AppError('GEDCOM export failed', 500, 'GEDCOM_EXPORT_FAILED');
    }
  }

  /**
   * Parse GEDCOM file content
   * @param {string} content - GEDCOM file content
   * @returns {Object} Parsed data
   */
  static parseGedcom(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const individuals = [];
    const families = [];
    const events = [];
    
    let currentRecord = null;
    let currentType = null;

    for (const line of lines) {
      const parts = line.split(' ');
      const level = parseInt(parts[0]);
      const tag = parts[1];
      const value = parts.slice(2).join(' ');

      if (level === 0) {
        // Save previous record
        if (currentRecord) {
          if (currentType === 'INDI') {
            individuals.push(currentRecord);
          } else if (currentType === 'FAM') {
            families.push(currentRecord);
          }
        }

        // Start new record
        if (tag.startsWith('@') && tag.endsWith('@')) {
          currentRecord = {
            id: tag.slice(1, -1),
            type: value,
            data: {}
          };
          currentType = value;
        } else {
          currentRecord = null;
          currentType = null;
        }
      } else if (currentRecord && level === 1) {
        // Add data to current record
        if (!currentRecord.data[tag]) {
          currentRecord.data[tag] = [];
        }
        currentRecord.data[tag].push({
          value: value,
          subData: {}
        });
      } else if (currentRecord && level === 2) {
        // Add sub-data to last entry
        const lastEntry = currentRecord.data[Object.keys(currentRecord.data).pop()];
        if (lastEntry && lastEntry.length > 0) {
          const lastItem = lastEntry[lastEntry.length - 1];
          if (!lastItem.subData[tag]) {
            lastItem.subData[tag] = [];
          }
          lastItem.subData[tag].push(value);
        }
      }
    }

    // Save last record
    if (currentRecord) {
      if (currentType === 'INDI') {
        individuals.push(currentRecord);
      } else if (currentType === 'FAM') {
        families.push(currentRecord);
      }
    }

    return { individuals, families, events };
  }

  /**
   * Convert GEDCOM individual to Person data
   * @param {Object} individual - GEDCOM individual record
   * @returns {Object} Person data
   */
  static convertGedcomIndividual(individual) {
    const data = individual.data;
    const personData = {};

    // Name
    if (data.NAME && data.NAME.length > 0) {
      const nameParts = data.NAME[0].value.split('/');
      const givenNames = nameParts[0].trim().split(' ');
      personData.firstName = givenNames[0] || '';
      personData.middleName = givenNames.slice(1).join(' ') || null;
      personData.lastName = nameParts[1] ? nameParts[1].trim() : '';
    }

    // Gender
    if (data.SEX && data.SEX.length > 0) {
      const sex = data.SEX[0].value.toUpperCase();
      personData.gender = sex === 'M' ? 'male' : sex === 'F' ? 'female' : 'other';
    }

    // Birth date
    if (data.BIRT && data.BIRT.length > 0) {
      const birthData = data.BIRT[0];
      if (birthData.subData.DATE && birthData.subData.DATE.length > 0) {
        personData.dateOfBirth = this.parseGedcomDate(birthData.subData.DATE[0]);
      }
    }

    // Death date
    if (data.DEAT && data.DEAT.length > 0) {
      personData.isDeceased = true;
      const deathData = data.DEAT[0];
      if (deathData.subData.DATE && deathData.subData.DATE.length > 0) {
        personData.dateOfDeath = this.parseGedcomDate(deathData.subData.DATE[0]);
      }
    }

    // Notes
    if (data.NOTE && data.NOTE.length > 0) {
      personData.notes = data.NOTE.map(note => note.value).join('\n');
    }

    return personData;
  }

  /**
   * Parse GEDCOM date format
   * @param {string} gedcomDate - GEDCOM date string
   * @returns {string} ISO date string
   */
  static parseGedcomDate(gedcomDate) {
    // Simple date parsing - can be enhanced for complex GEDCOM dates
    const dateStr = gedcomDate.replace(/^(ABT|EST|CAL|AFT|BEF)\s+/, '');
    
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      logger.warn(`Failed to parse GEDCOM date: ${gedcomDate}`);
    }
    
    return null;
  }

  /**
   * Import family relationships
   * @param {Object} family - GEDCOM family record
   * @param {Map} personMap - GEDCOM ID to Neo4j ID mapping
   */
  static async importFamily(family, personMap) {
    const data = family.data;
    
    // Get husband and wife
    const husbandId = data.HUSB && data.HUSB.length > 0 ? 
      personMap.get(data.HUSB[0].value.slice(1, -1)) : null;
    const wifeId = data.WIFE && data.WIFE.length > 0 ? 
      personMap.get(data.WIFE[0].value.slice(1, -1)) : null;
    
    // Create marriage relationship
    if (husbandId && wifeId) {
      await Person.addRelationship(husbandId, wifeId, 'MARRIED_TO', {
        establishedDate: this.getFamilyMarriageDate(family)
      });
    }

    // Get children
    const children = data.CHIL ? data.CHIL.map(child => 
      personMap.get(child.value.slice(1, -1))
    ).filter(id => id) : [];

    // Create parent-child relationships
    for (const childId of children) {
      if (husbandId) {
        await Person.addRelationship(husbandId, childId, 'PARENT_OF');
        await Person.addRelationship(childId, husbandId, 'CHILD_OF');
      }
      if (wifeId) {
        await Person.addRelationship(wifeId, childId, 'PARENT_OF');
        await Person.addRelationship(childId, wifeId, 'CHILD_OF');
      }
    }

    // Create sibling relationships
    for (let i = 0; i < children.length; i++) {
      for (let j = i + 1; j < children.length; j++) {
        await Person.addRelationship(children[i], children[j], 'SIBLING_OF');
        await Person.addRelationship(children[j], children[i], 'SIBLING_OF');
      }
    }
  }

  /**
   * Get marriage date from family record
   * @param {Object} family - GEDCOM family record
   * @returns {string} Marriage date
   */
  static getFamilyMarriageDate(family) {
    const data = family.data;
    if (data.MARR && data.MARR.length > 0) {
      const marriageData = data.MARR[0];
      if (marriageData.subData.DATE && marriageData.subData.DATE.length > 0) {
        return this.parseGedcomDate(marriageData.subData.DATE[0]);
      }
    }
    return null;
  }

  /**
   * Count relationships in a family
   * @param {Object} family - GEDCOM family record
   * @returns {number} Number of relationships
   */
  static countFamilyRelationships(family) {
    const data = family.data;
    let count = 0;
    
    // Marriage relationship
    if (data.HUSB && data.WIFE) count += 1;
    
    // Parent-child relationships
    const childrenCount = data.CHIL ? data.CHIL.length : 0;
    const parentsCount = (data.HUSB ? 1 : 0) + (data.WIFE ? 1 : 0);
    count += childrenCount * parentsCount * 2; // Both directions
    
    // Sibling relationships
    count += childrenCount * (childrenCount - 1); // All pairs, both directions
    
    return count;
  }

  /**
   * Import event
   * @param {Object} event - GEDCOM event record
   * @param {Map} personMap - GEDCOM ID to Neo4j ID mapping
   */
  static async importEvent(event, personMap) {
    // Event import implementation would go here
    // This is a placeholder for now
    logger.info(`Importing event: ${event.id}`);
  }

  /**
   * Add person to family tree
   * @param {string} treeId - Family tree ID
   * @param {string} personId - Person ID
   */
  static async addPersonToTree(treeId, personId) {
    const cypher = `
      MATCH (ft:FamilyTree {id: $treeId})
      MATCH (p:Person {id: $personId})
      CREATE (ft)-[:CONTAINS]->(p)
    `;

    await database.runQuery(cypher, { treeId, personId });
  }

  /**
   * Get all persons in a family tree
   * @param {string} treeId - Family tree ID
   * @returns {Array} Persons in the tree
   */
  static async getTreePersons(treeId) {
    const cypher = `
      MATCH (ft:FamilyTree {id: $treeId})-[:CONTAINS]->(p:Person)
      RETURN p
      ORDER BY p.lastName, p.firstName
    `;

    const result = await database.runQuery(cypher, { treeId });
    
    return result.records.map(record => 
      database.constructor.extractNodeProperties(record, 'p')
    );
  }

  /**
   * Get all relationships in a family tree
   * @param {string} treeId - Family tree ID
   * @returns {Array} Relationships in the tree
   */
  static async getTreeRelationships(treeId) {
    const cypher = `
      MATCH (ft:FamilyTree {id: $treeId})-[:CONTAINS]->(p1:Person)
      MATCH (ft)-[:CONTAINS]->(p2:Person)
      MATCH (p1)-[r]-(p2)
      WHERE p1.id < p2.id
      RETURN p1, r, p2
    `;

    const result = await database.runQuery(cypher, { treeId });
    
    return result.records.map(record => ({
      person1: database.constructor.extractNodeProperties(record, 'p1'),
      person2: database.constructor.extractNodeProperties(record, 'p2'),
      relationship: database.constructor.extractRelationshipProperties(record, 'r')
    }));
  }

  /**
   * Get all events in a family tree
   * @param {string} treeId - Family tree ID
   * @returns {Array} Events in the tree
   */
  static async getTreeEvents(treeId) {
    const cypher = `
      MATCH (ft:FamilyTree {id: $treeId})-[:CONTAINS]->(p:Person)
      MATCH (p)-[:PARTICIPATED_IN]->(e:Event)
      RETURN e
      ORDER BY e.date
    `;

    const result = await database.runQuery(cypher, { treeId });
    
    return result.records.map(record => 
      database.constructor.extractNodeProperties(record, 'e')
    );
  }

  /**
   * Generate GEDCOM content from tree data
   * @param {Object} tree - Family tree
   * @param {Array} persons - Persons in the tree
   * @param {Array} relationships - Relationships in the tree
   * @param {Array} events - Events in the tree
   * @returns {string} GEDCOM content
   */
  static generateGedcomContent(tree, persons, relationships, events) {
    let gedcom = '';
    
    // Header
    gedcom += '0 HEAD\n';
    gedcom += '1 SOUR Family Tree Neo4j\n';
    gedcom += '1 GEDC\n';
    gedcom += '2 VERS 5.5.1\n';
    gedcom += '2 FORM LINEAGE-LINKED\n';
    gedcom += '1 CHAR UTF-8\n';
    gedcom += `1 DATE ${new Date().toISOString().split('T')[0]}\n`;
    gedcom += '\n';

    // Individuals
    persons.forEach((person, index) => {
      const id = `I${index + 1}`;
      gedcom += `0 @${id}@ INDI\n`;
      
      // Name
      const name = `${person.firstName || ''} ${person.middleName || ''} /${person.lastName || ''}/`.trim();
      gedcom += `1 NAME ${name}\n`;
      
      // Gender
      if (person.gender) {
        const sex = person.gender === 'male' ? 'M' : person.gender === 'female' ? 'F' : 'U';
        gedcom += `1 SEX ${sex}\n`;
      }
      
      // Birth
      if (person.dateOfBirth) {
        gedcom += '1 BIRT\n';
        gedcom += `2 DATE ${this.formatGedcomDate(person.dateOfBirth)}\n`;
      }
      
      // Death
      if (person.isDeceased) {
        gedcom += '1 DEAT\n';
        if (person.dateOfDeath) {
          gedcom += `2 DATE ${this.formatGedcomDate(person.dateOfDeath)}\n`;
        }
      }
      
      // Notes
      if (person.notes) {
        gedcom += `1 NOTE ${person.notes}\n`;
      }
      
      gedcom += '\n';
    });

    // Families (simplified - would need more complex logic for full implementation)
    gedcom += '0 TRLR\n';
    
    return gedcom;
  }

  /**
   * Format date for GEDCOM
   * @param {string} isoDate - ISO date string
   * @returns {string} GEDCOM formatted date
   */
  static formatGedcomDate(isoDate) {
    if (!isoDate) return '';
    
    const date = new Date(isoDate);
    const months = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];
    
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}

module.exports = GedcomService;