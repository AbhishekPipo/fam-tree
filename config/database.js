const gremlin = require('gremlin');
require('dotenv').config();

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;

class JanusGraphConnection {
    constructor() {
        this.connection = null;
        this.g = null;
    }

    async connect() {
        try {
            const host = process.env.JANUS_HOST || 'localhost';
            const port = process.env.JANUS_PORT || 8182;
            const path = process.env.JANUS_PATH || '/gremlin';
            
            const url = `ws://${host}:${port}${path}`;
            console.log(`Connecting to JanusGraph at: ${url}`);
            
            this.connection = new DriverRemoteConnection(url);
            const graph = new Graph();
            this.g = graph.traversal().withRemote(this.connection);
            
            // Test the connection
            await this.g.V().limit(1).toList();
            console.log('Successfully connected to JanusGraph');
            
            return this.g;
        } catch (error) {
            console.error('Failed to connect to JanusGraph:', error.message);
            throw error;
        }
    }

    async disconnect() {
        if (this.connection) {
            try {
                await this.connection.close();
                console.log('Disconnected from JanusGraph');
            } catch (error) {
                console.error('Error disconnecting from JanusGraph:', error.message);
            }
        }
    }

    getTraversal() {
        if (!this.g) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.g;
    }
}

// Create singleton instance
const janusGraph = new JanusGraphConnection();

module.exports = janusGraph;