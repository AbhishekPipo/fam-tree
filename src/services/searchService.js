const database = require('../config/database');
const logger = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');

class SearchService {
  /**
   * Advanced search across persons, events, and family trees
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.query - Search query
   * @param {string} searchParams.type - Search type (person, event, tree, all)
   * @param {Object} searchParams.filters - Additional filters
   * @param {number} searchParams.limit - Result limit
   * @param {number} searchParams.offset - Result offset
   * @returns {Object} Search results
   */
  static async search(searchParams) {
    const { query, type = 'all', filters = {}, limit = 20, offset = 0 } = searchParams;

    try {
      let results = {};

      switch (type) {
        case 'person':
          results.persons = await this.searchPersons(query, filters, limit, offset);
          break;
        case 'event':
          results.events = await this.searchEvents(query, filters, limit, offset);
          break;
        case 'tree':
          results.trees = await this.searchFamilyTrees(query, filters, limit, offset);
          break;
        case 'all':
        default:
          // Search across all types with smaller limits
          const perTypeLimit = Math.ceil(limit / 3);
          results.persons = await this.searchPersons(query, filters, perTypeLimit, 0);
          results.events = await this.searchEvents(query, filters, perTypeLimit, 0);
          results.trees = await this.searchFamilyTrees(query, filters, perTypeLimit, 0);
          break;
      }

      // Calculate total results
      const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

      return {
        query,
        type,
        totalResults,
        results,
        pagination: {
          limit,
          offset,
          hasMore: totalResults === limit
        }
      };

    } catch (error) {
      logger.error('Search error:', error);
      throw new AppError('Search failed', 500, 'SEARCH_ERROR');
    }
  }

  /**
   * Search persons using full-text search
   */
  static async searchPersons(query, filters = {}, limit = 20, offset = 0) {
    let cypher = `
      CALL db.index.fulltext.queryNodes('person_search_index', $searchQuery)
      YIELD node, score
      WHERE node:Person
    `;

    const params = {
      searchQuery: this.buildFullTextQuery(query)
    };

    // Apply filters
    const conditions = [];
    
    if (filters.gender) {
      conditions.push('node.gender = $gender');
      params.gender = filters.gender;
    }

    if (filters.isDeceased !== undefined) {
      conditions.push('node.isDeceased = $isDeceased');
      params.isDeceased = filters.isDeceased;
    }

    if (filters.visibility) {
      conditions.push('node.visibility = $visibility');
      params.visibility = filters.visibility;
    }

    if (filters.dateRange) {
      if (filters.dateRange.start) {
        conditions.push('node.dateOfBirth >= $startDate');
        params.startDate = filters.dateRange.start;
      }
      if (filters.dateRange.end) {
        conditions.push('node.dateOfBirth <= $endDate');
        params.endDate = filters.dateRange.end;
      }
    }

    if (conditions.length > 0) {
      cypher += ' AND ' + conditions.join(' AND ');
    }

    cypher += `
      RETURN node as person, score
      ORDER BY score DESC
      SKIP $offset
      LIMIT $limit
    `;

    params.offset = offset;
    params.limit = limit;

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => ({
      person: database.constructor.extractNodeProperties(record, 'person'),
      score: record.get('score'),
      type: 'person'
    }));
  }

  /**
   * Search events using full-text search
   */
  static async searchEvents(query, filters = {}, limit = 20, offset = 0) {
    let cypher = `
      CALL db.index.fulltext.queryNodes('event_search_index', $searchQuery)
      YIELD node, score
      WHERE node:Event
    `;

    const params = {
      searchQuery: this.buildFullTextQuery(query)
    };

    // Apply filters
    const conditions = [];
    
    if (filters.eventType) {
      conditions.push('node.eventType = $eventType');
      params.eventType = filters.eventType;
    }

    if (filters.dateRange) {
      if (filters.dateRange.start) {
        conditions.push('node.date >= $startDate');
        params.startDate = filters.dateRange.start;
      }
      if (filters.dateRange.end) {
        conditions.push('node.date <= $endDate');
        params.endDate = filters.dateRange.end;
      }
    }

    if (conditions.length > 0) {
      cypher += ' AND ' + conditions.join(' AND ');
    }

    cypher += `
      RETURN node as event, score
      ORDER BY score DESC
      SKIP $offset
      LIMIT $limit
    `;

    params.offset = offset;
    params.limit = limit;

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => ({
      event: database.constructor.extractNodeProperties(record, 'event'),
      score: record.get('score'),
      type: 'event'
    }));
  }

  /**
   * Search family trees
   */
  static async searchFamilyTrees(query, filters = {}, limit = 20, offset = 0) {
    let cypher = `
      MATCH (ft:FamilyTree)
      WHERE ft.name CONTAINS $query OR ft.description CONTAINS $query
    `;

    const params = { query };

    // Apply filters
    const conditions = [];
    
    if (filters.visibility) {
      conditions.push('ft.visibility = $visibility');
      params.visibility = filters.visibility;
    }

    if (conditions.length > 0) {
      cypher += ' AND ' + conditions.join(' AND ');
    }

    cypher += `
      RETURN ft as tree
      ORDER BY ft.name
      SKIP $offset
      LIMIT $limit
    `;

    params.offset = offset;
    params.limit = limit;

    const result = await database.runQuery(cypher, params);
    
    return result.records.map(record => ({
      tree: database.constructor.extractNodeProperties(record, 'tree'),
      score: 1.0, // Default score for non-full-text search
      type: 'tree'
    }));
  }

  /**
   * Find relationship paths between two persons
   */
  static async findRelationshipPath(fromPersonId, toPersonId, maxDepth = 6) {
    const cypher = `
      MATCH path = shortestPath((from:Person {id: $fromPersonId})-[*1..${maxDepth}]-(to:Person {id: $toPersonId}))
      WHERE from <> to
      RETURN path,
             length(path) as pathLength,
             [rel in relationships(path) | type(rel)] as relationshipTypes,
             [node in nodes(path) | node.firstName + ' ' + node.lastName] as personNames
      ORDER BY pathLength
      LIMIT 5
    `;

    const result = await database.runQuery(cypher, {
      fromPersonId,
      toPersonId
    });

    return result.records.map(record => ({
      pathLength: record.get('pathLength').toNumber(),
      relationshipTypes: record.get('relationshipTypes'),
      personNames: record.get('personNames'),
      path: record.get('path')
    }));
  }

  /**
   * Get relationship suggestions for a person
   */
  static async getRelationshipSuggestions(personId, limit = 10) {
    const cypher = `
      MATCH (p:Person {id: $personId})
      MATCH (other:Person)
      WHERE other.id <> p.id
        AND NOT (p)-[]-(other)
        AND (
          other.lastName = p.lastName OR
          other.email CONTAINS split(p.email, '@')[0] OR
          abs(duration.between(date(p.dateOfBirth), date(other.dateOfBirth)).years) < 5
        )
      RETURN other,
             CASE 
               WHEN other.lastName = p.lastName THEN 'same_surname'
               WHEN other.email CONTAINS split(p.email, '@')[0] THEN 'similar_email'
               ELSE 'similar_age'
             END as suggestionReason
      LIMIT $limit
    `;

    const result = await database.runQuery(cypher, {
      personId,
      limit
    });

    return result.records.map(record => ({
      person: database.constructor.extractNodeProperties(record, 'other'),
      reason: record.get('suggestionReason')
    }));
  }

  /**
   * Build full-text search query with proper escaping
   */
  static buildFullTextQuery(query) {
    // Escape special characters and add wildcards
    const escapedQuery = query
      .replace(/[+\-&|!(){}[\]^"~*?:\\]/g, '\\$&')
      .trim();

    // Split into words and add wildcards
    const words = escapedQuery.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) {
      return '*';
    }

    // Create fuzzy search with wildcards
    return words.map(word => `${word}*`).join(' AND ');
  }

  /**
   * Get search suggestions/autocomplete
   */
  static async getSearchSuggestions(query, limit = 10) {
    const cypher = `
      MATCH (p:Person)
      WHERE p.firstName STARTS WITH $query 
         OR p.lastName STARTS WITH $query
         OR p.email STARTS WITH $query
      RETURN DISTINCT 
        CASE 
          WHEN p.firstName STARTS WITH $query THEN p.firstName
          WHEN p.lastName STARTS WITH $query THEN p.lastName
          ELSE p.email
        END as suggestion
      ORDER BY suggestion
      LIMIT $limit
    `;

    const result = await database.runQuery(cypher, { query, limit });
    
    return result.records.map(record => record.get('suggestion'));
  }

  /**
   * Advanced family tree analysis
   */
  static async analyzeFamilyTree(treeId) {
    const cypher = `
      MATCH (ft:FamilyTree {id: $treeId})
      MATCH (ft)-[:CONTAINS]->(p:Person)
      OPTIONAL MATCH (p)-[r]-(related:Person)
      WHERE (ft)-[:CONTAINS]->(related)
      RETURN 
        count(DISTINCT p) as totalPersons,
        count(DISTINCT r) as totalRelationships,
        count(DISTINCT CASE WHEN p.isDeceased = false THEN p END) as livingPersons,
        count(DISTINCT CASE WHEN p.isDeceased = true THEN p END) as deceasedPersons,
        count(DISTINCT CASE WHEN p.gender = 'male' THEN p END) as maleCount,
        count(DISTINCT CASE WHEN p.gender = 'female' THEN p END) as femaleCount,
        min(p.dateOfBirth) as oldestBirthDate,
        max(p.dateOfBirth) as newestBirthDate
    `;

    const result = await database.runQuery(cypher, { treeId });
    
    if (result.records.length === 0) {
      throw new AppError('Family tree not found', 404, 'TREE_NOT_FOUND');
    }

    const record = result.records[0];
    
    return {
      totalPersons: record.get('totalPersons').toNumber(),
      totalRelationships: record.get('totalRelationships').toNumber(),
      livingPersons: record.get('livingPersons').toNumber(),
      deceasedPersons: record.get('deceasedPersons').toNumber(),
      maleCount: record.get('maleCount').toNumber(),
      femaleCount: record.get('femaleCount').toNumber(),
      oldestBirthDate: record.get('oldestBirthDate'),
      newestBirthDate: record.get('newestBirthDate'),
      generationSpan: this.calculateGenerationSpan(
        record.get('oldestBirthDate'),
        record.get('newestBirthDate')
      )
    };
  }

  /**
   * Calculate generation span in years
   */
  static calculateGenerationSpan(oldestDate, newestDate) {
    if (!oldestDate || !newestDate) return 0;
    
    const oldest = new Date(oldestDate);
    const newest = new Date(newestDate);
    
    return Math.floor((newest - oldest) / (365.25 * 24 * 60 * 60 * 1000));
  }
}

module.exports = SearchService;