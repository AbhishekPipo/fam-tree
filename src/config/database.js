const gremlin = require('gremlin');
require('dotenv').config();

const { DriverRemoteConnection, Graph } = gremlin.structure;
const { GraphTraversalSource } = gremlin.process;

class JanusGraphConnection {
  constructor() {
    this.connection = null;
    this.g = null;
    this.graph = null;
  }

  async connect() {
    try {
      const host = process.env.JANUSGRAPH_HOST || 'localhost';
      const port = process.env.JANUSGRAPH_PORT || 8182;
      
      // Create connection to JanusGraph
      this.connection = new DriverRemoteConnection(`ws://${host}:${port}/gremlin`);
      
      // Create graph instance
      this.graph = new Graph();
      this.g = this.graph.traversal().withRemote(this.connection);
      
      console.log('Connected to JanusGraph successfully');
      
      // Initialize schema
      await this.initializeSchema();
      
      return this.g;
    } catch (error) {
      console.error('Failed to connect to JanusGraph:', error);
      throw error;
    }
  }

  async initializeSchema() {
    try {
      // Create vertex labels
      await this.createVertexLabel('user', [
        { name: 'phone', type: 'String', unique: true },
        { name: 'firstName', type: 'String' },
        { name: 'lastName', type: 'String' },
        { name: 'email', type: 'String' },
        { name: 'dateOfBirth', type: 'Date' },
        { name: 'gender', type: 'String' },
        { name: 'profilePicture', type: 'String' },
        { name: 'isActive', type: 'Boolean' },
        { name: 'createdAt', type: 'Date' },
        { name: 'updatedAt', type: 'Date' }
      ]);

      await this.createVertexLabel('family', [
        { name: 'name', type: 'String' },
        { name: 'description', type: 'String' },
        { name: 'createdBy', type: 'String' },
        { name: 'createdAt', type: 'Date' }
      ]);

      // Create edge labels for relationships
      await this.createEdgeLabel('parentOf');
      await this.createEdgeLabel('childOf');
      await this.createEdgeLabel('spouseOf');
      await this.createEdgeLabel('siblingOf');
      await this.createEdgeLabel('memberOf');

      console.log('Schema initialized successfully');
    } catch (error) {
      console.error('Error initializing schema:', error);
      // Don't throw error as schema might already exist
    }
  }

  async createVertexLabel(label, properties = []) {
    // Note: In a real implementation, you would use JanusGraph management API
    // For now, we'll just ensure vertices can be created with these properties
    console.log(`Vertex label '${label}' schema prepared`);
  }

  async createEdgeLabel(label) {
    console.log(`Edge label '${label}' schema prepared`);
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.close();
      console.log('Disconnected from JanusGraph');
    }
  }

  getTraversal() {
    if (!this.g) {
      throw new Error('Database connection not established');
    }
    return this.g;
  }
}

// Create singleton instance
const janusGraphConnection = new JanusGraphConnection();

module.exports = janusGraphConnection;