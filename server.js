const express = require('express');
const cors = require('cors');
const janusGraph = require('./config/database');
const authRoutes = require('./src/routes/auth');
const { specs, swaggerUi } = require('./src/config/swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Family Tree API Documentation"
}));

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     description: Returns the current status of the API server
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
/**
 * @swagger
 * /:
 *   get:
 *     tags: [System]
 *     summary: Get API information
 *     description: Returns basic information about the Family Tree API including available endpoints
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiInfo'
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Family Tree API Server',
        version: '1.0.0',
        endpoints: {
            'POST /api/auth/register': 'Register new user',
            'POST /api/auth/login': 'Login user (with optional OTP)',
            'GET /api/auth/profile': 'Get user profile (requires token)',
            'GET /health': 'Health check',
            'GET /api-docs': 'API Documentation (Swagger)'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found' 
    });
});

// Start server
async function startServer() {
    try {
        // Try to connect to JanusGraph
        try {
            await janusGraph.connect();
        } catch (dbError) {
            console.warn('Warning: Could not connect to JanusGraph database');
            console.warn('Please ensure JanusGraph server is running on ws://localhost:8182/gremlin');
            console.warn('The API will start but database operations will fail until JanusGraph is available');
        }
        
        // Start Express server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
            console.log(`Health Check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await janusGraph.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await janusGraph.disconnect();
    process.exit(0);
});

startServer();