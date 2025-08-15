const neo4j = require('neo4j-driver');
require('dotenv').config();

class Neo4jDatabase {
  constructor() {
    this.driver = null;
    this.session = null;
  }

  async connect() {
    try {
      this.driver = neo4j.driver(
        process.env.NEO4J_URI || 'bolt://localhost:7687',
        neo4j.auth.basic(
          process.env.NEO4J_USERNAME || 'neo4j',
          process.env.NEO4J_PASSWORD || 'password'
        ),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
          disableLosslessIntegers: true
        }
      );

      // Verify connectivity
      await this.driver.verifyConnectivity();
      console.log('✅ Neo4j connection established successfully');
      
      return this.driver;
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error);
      throw error;
    }
  }

  getSession(database = 'neo4j') {
    if (!this.driver) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.driver.session({ database });
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
      console.log('✅ Neo4j connection closed');
    }
  }

  // Helper method to run a single query
  async runQuery(cypher, parameters = {}, database = 'neo4j') {
    const session = this.getSession(database);
    try {
      const result = await session.run(cypher, parameters);
      return result;
    } finally {
      await session.close();
    }
  }

  // Helper method to run multiple queries in a transaction
  async runTransaction(queries, database = 'neo4j') {
    const session = this.getSession(database);
    const tx = session.beginTransaction();
    
    try {
      const results = [];
      for (const query of queries) {
        const result = await tx.run(query.cypher, query.parameters || {});
        results.push(result);
      }
      
      await tx.commit();
      return results;
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  // Convert Neo4j integers to JavaScript numbers
  static toNativeTypes(obj) {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (neo4j.isInt(obj)) {
      return obj.toNumber();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => Neo4jDatabase.toNativeTypes(item));
    }
    
    if (typeof obj === 'object') {
      const converted = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = Neo4jDatabase.toNativeTypes(value);
      }
      return converted;
    }
    
    return obj;
  }

  // Extract node properties with native types
  static extractNodeProperties(record, alias = 'n') {
    const node = record.get(alias);
    if (!node) return null;
    
    return {
      id: Neo4jDatabase.toNativeTypes(node.identity),
      labels: node.labels,
      ...Neo4jDatabase.toNativeTypes(node.properties)
    };
  }

  // Extract relationship properties with native types
  static extractRelationshipProperties(record, alias = 'r') {
    const relationship = record.get(alias);
    if (!relationship) return null;
    
    return {
      id: Neo4jDatabase.toNativeTypes(relationship.identity),
      type: relationship.type,
      startNodeId: Neo4jDatabase.toNativeTypes(relationship.start),
      endNodeId: Neo4jDatabase.toNativeTypes(relationship.end),
      ...Neo4jDatabase.toNativeTypes(relationship.properties)
    };
  }
}

// Create singleton instance
const database = new Neo4jDatabase();

module.exports = database;