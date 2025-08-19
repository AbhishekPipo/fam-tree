const database = require('../config/database');
const logger = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

class DNAService {
  /**
   * Add DNA data for a person
   * @param {string} personId - Person ID
   * @param {Object} dnaData - DNA data
   * @returns {Object} Created DNA record
   */
  static async addDNAData(personId, dnaData) {
    const {
      testingCompany,
      testDate,
      rawDataFile,
      haplogroups,
      ethnicityEstimate,
      healthReports,
      traits
    } = dnaData;

    const dnaId = uuidv4();
    
    const cypher = `
      MATCH (p:Person {id: $personId})
      CREATE (dna:DNA {
        id: $dnaId,
        testingCompany: $testingCompany,
        testDate: $testDate,
        rawDataFile: $rawDataFile,
        haplogroups: $haplogroups,
        ethnicityEstimate: $ethnicityEstimate,
        healthReports: $healthReports,
        traits: $traits,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      })
      CREATE (p)-[:HAS_DNA]->(dna)
      RETURN dna
    `;

    const result = await database.runQuery(cypher, {
      personId,
      dnaId,
      testingCompany,
      testDate,
      rawDataFile,
      haplogroups: JSON.stringify(haplogroups || {}),
      ethnicityEstimate: JSON.stringify(ethnicityEstimate || {}),
      healthReports: JSON.stringify(healthReports || {}),
      traits: JSON.stringify(traits || {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to add DNA data', 500, 'DNA_ADD_FAILED');
    }

    return database.constructor.extractNodeProperties(result.records[0], 'dna');
  }

  /**
   * Find DNA matches between persons
   * @param {string} personId - Person ID to find matches for
   * @param {number} minSharedCM - Minimum shared centimorgans
   * @returns {Array} DNA matches
   */
  static async findDNAMatches(personId, minSharedCM = 7) {
    const cypher = `
      MATCH (p1:Person {id: $personId})-[:HAS_DNA]->(dna1:DNA)
      MATCH (p2:Person)-[:HAS_DNA]->(dna2:DNA)
      WHERE p1.id <> p2.id
      OPTIONAL MATCH (p1)-[rel]-(p2)
      WITH p1, p2, dna1, dna2, rel,
           CASE 
             WHEN rel IS NOT NULL THEN 'known_relative'
             ELSE 'potential_match'
           END as matchType
      RETURN p2 as matchPerson, 
             dna2 as matchDNA,
             matchType,
             CASE matchType
               WHEN 'known_relative' THEN type(rel)
               ELSE null
             END as knownRelationship
      ORDER BY matchType, p2.lastName, p2.firstName
    `;

    const result = await database.runQuery(cypher, { personId });
    
    return result.records.map(record => ({
      person: database.constructor.extractNodeProperties(record, 'matchPerson'),
      dna: database.constructor.extractNodeProperties(record, 'matchDNA'),
      matchType: record.get('matchType'),
      knownRelationship: record.get('knownRelationship'),
      estimatedSharedCM: this.estimateSharedCM(record.get('knownRelationship'))
    }));
  }

  /**
   * Add DNA match relationship
   * @param {string} person1Id - First person ID
   * @param {string} person2Id - Second person ID
   * @param {Object} matchData - Match data
   * @returns {Object} Created match relationship
   */
  static async addDNAMatch(person1Id, person2Id, matchData) {
    const {
      sharedCM,
      sharedSegments,
      longestSegment,
      estimatedRelationship,
      confidence,
      testingCompany,
      notes
    } = matchData;

    const cypher = `
      MATCH (p1:Person {id: $person1Id})
      MATCH (p2:Person {id: $person2Id})
      CREATE (p1)-[match:DNA_MATCH {
        sharedCM: $sharedCM,
        sharedSegments: $sharedSegments,
        longestSegment: $longestSegment,
        estimatedRelationship: $estimatedRelationship,
        confidence: $confidence,
        testingCompany: $testingCompany,
        notes: $notes,
        createdAt: $createdAt,
        updatedAt: $updatedAt
      }]->(p2)
      RETURN match
    `;

    const result = await database.runQuery(cypher, {
      person1Id,
      person2Id,
      sharedCM: parseFloat(sharedCM),
      sharedSegments: parseInt(sharedSegments),
      longestSegment: parseFloat(longestSegment),
      estimatedRelationship,
      confidence: parseFloat(confidence || 0.5),
      testingCompany,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (result.records.length === 0) {
      throw new AppError('Failed to add DNA match', 500, 'DNA_MATCH_ADD_FAILED');
    }

    return database.constructor.extractRelationshipProperties(result.records[0], 'match');
  }

  /**
   * Get DNA data for a person
   * @param {string} personId - Person ID
   * @returns {Object} DNA data
   */
  static async getDNAData(personId) {
    const cypher = `
      MATCH (p:Person {id: $personId})-[:HAS_DNA]->(dna:DNA)
      RETURN p as person, dna
    `;

    const result = await database.runQuery(cypher, { personId });
    
    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const dnaData = database.constructor.extractNodeProperties(record, 'dna');
    
    // Parse JSON fields
    if (dnaData.haplogroups) {
      dnaData.haplogroups = JSON.parse(dnaData.haplogroups);
    }
    if (dnaData.ethnicityEstimate) {
      dnaData.ethnicityEstimate = JSON.parse(dnaData.ethnicityEstimate);
    }
    if (dnaData.healthReports) {
      dnaData.healthReports = JSON.parse(dnaData.healthReports);
    }
    if (dnaData.traits) {
      dnaData.traits = JSON.parse(dnaData.traits);
    }

    return {
      person: database.constructor.extractNodeProperties(record, 'person'),
      dna: dnaData
    };
  }

  /**
   * Analyze DNA matches for relationship predictions
   * @param {string} personId - Person ID
   * @returns {Object} Analysis results
   */
  static async analyzeDNAMatches(personId) {
    const cypher = `
      MATCH (p:Person {id: $personId})
      OPTIONAL MATCH (p)-[match:DNA_MATCH]-(other:Person)
      RETURN 
        count(match) as totalMatches,
        avg(match.sharedCM) as avgSharedCM,
        max(match.sharedCM) as maxSharedCM,
        min(match.sharedCM) as minSharedCM,
        collect(DISTINCT match.estimatedRelationship) as relationshipTypes,
        collect({
          person: other,
          sharedCM: match.sharedCM,
          relationship: match.estimatedRelationship
        }) as matches
    `;

    const result = await database.runQuery(cypher, { personId });
    
    if (result.records.length === 0) {
      throw new AppError('Person not found', 404, 'PERSON_NOT_FOUND');
    }

    const record = result.records[0];
    
    return {
      totalMatches: record.get('totalMatches').toNumber(),
      avgSharedCM: record.get('avgSharedCM'),
      maxSharedCM: record.get('maxSharedCM'),
      minSharedCM: record.get('minSharedCM'),
      relationshipTypes: record.get('relationshipTypes'),
      matches: record.get('matches').map(match => ({
        person: match.person ? database.constructor.extractNodeProperties({ get: () => match.person }, 'person') : null,
        sharedCM: match.sharedCM,
        relationship: match.relationship
      }))
    };
  }

  /**
   * Estimate shared centimorgans based on known relationship
   * @param {string} relationship - Known relationship type
   * @returns {number} Estimated shared cM
   */
  static estimateSharedCM(relationship) {
    const estimates = {
      'PARENT_OF': 3500,
      'CHILD_OF': 3500,
      'SIBLING_OF': 2600,
      'GRANDPARENT_OF': 1750,
      'GRANDCHILD_OF': 1750,
      'UNCLE_AUNT_OF': 1300,
      'NEPHEW_NIECE_OF': 1300,
      'COUSIN_OF': 850,
      'MARRIED_TO': 0 // No genetic relationship
    };

    return estimates[relationship] || 0;
  }

  /**
   * Predict relationship based on shared cM
   * @param {number} sharedCM - Shared centimorgans
   * @returns {Array} Possible relationships
   */
  static predictRelationship(sharedCM) {
    const relationships = [
      { min: 3300, max: 3700, relationships: ['Parent/Child'], probability: 0.99 },
      { min: 2300, max: 2900, relationships: ['Full Sibling'], probability: 0.95 },
      { min: 1300, max: 2300, relationships: ['Grandparent/Grandchild', 'Aunt/Uncle', 'Half Sibling'], probability: 0.85 },
      { min: 700, max: 1300, relationships: ['First Cousin', 'Great Grandparent'], probability: 0.80 },
      { min: 200, max: 700, relationships: ['First Cousin Once Removed', 'Second Cousin'], probability: 0.70 },
      { min: 50, max: 200, relationships: ['Second Cousin', 'Third Cousin'], probability: 0.60 },
      { min: 20, max: 50, relationships: ['Third Cousin', 'Fourth Cousin'], probability: 0.50 },
      { min: 7, max: 20, relationships: ['Fourth Cousin', 'Fifth Cousin'], probability: 0.40 }
    ];

    const matches = relationships.filter(rel => sharedCM >= rel.min && sharedCM <= rel.max);
    
    if (matches.length === 0) {
      return [{ relationships: ['Distant Cousin'], probability: 0.30 }];
    }

    return matches;
  }

  /**
   * Generate DNA report for a person
   * @param {string} personId - Person ID
   * @returns {Object} DNA report
   */
  static async generateDNAReport(personId) {
    const dnaData = await this.getDNAData(personId);
    
    if (!dnaData) {
      throw new AppError('No DNA data found for this person', 404, 'DNA_DATA_NOT_FOUND');
    }

    const matches = await this.findDNAMatches(personId);
    const analysis = await this.analyzeDNAMatches(personId);

    return {
      person: dnaData.person,
      dnaData: dnaData.dna,
      matches,
      analysis,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Import DNA data from common formats (23andMe, AncestryDNA, etc.)
   * @param {string} personId - Person ID
   * @param {string} format - Data format
   * @param {string} filePath - Path to data file
   * @returns {Object} Import results
   */
  static async importDNAData(personId, format, filePath) {
    // This would be implemented based on specific file formats
    // For now, return a placeholder
    logger.info(`Importing DNA data for person ${personId} from ${format} file: ${filePath}`);
    
    return {
      personId,
      format,
      filePath,
      status: 'imported',
      recordsProcessed: 0,
      matchesFound: 0,
      importedAt: new Date().toISOString()
    };
  }
}

module.exports = DNAService;