// Initialize OpenTelemetry FIRST (before any other imports)
require('dotenv').config();
const { initializeTelemetry } = require('./src/config/telemetry');
initializeTelemetry();

const express = require('express');
const cors = require('cors');
const janusGraph = require('./config/database');
const authRoutes = require('./src/routes/auth');
const familyRoutes = require('./src/routes/family');
const eventRoutes = require('./src/routes/events');
const postRoutes = require('./src/routes/posts');
const mediaRoutes = require('./src/routes/media');
const { specs, swaggerUi } = require('./src/config/swagger');

// Import telemetry middleware
const { 
  telemetryMiddleware, 
  authTelemetryMiddleware, 
  errorTelemetryMiddleware,
  healthCheckTelemetry 
} = require('./src/middleware/telemetry');

const app = express();
const PORT = process.env.PORT || 3000;

// OpenTelemetry middleware (should be first)
app.use(telemetryMiddleware);
app.use(healthCheckTelemetry);
app.use(authTelemetryMiddleware);

// Standard middleware
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
app.use('/api/family', familyRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/media', mediaRoutes);

// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     description: Returns the current status of the API server with telemetry information
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (req, res) => {
    const { addSpanAttributes } = require('./src/config/telemetry');
    
    // Add health check specific attributes
    addSpanAttributes({
        'health.database.connected': janusGraph.isConnected || false,
        'health.telemetry.enabled': true,
    });
    
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        telemetry: {
            tracing: process.env.ENABLE_TRACING !== 'false',
            metrics: process.env.ENABLE_METRICS !== 'false',
            jaeger_endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
            prometheus_port: process.env.PROMETHEUS_PORT || 9090,
        },
        database: {
            connected: janusGraph.isConnected || false,
            type: 'JanusGraph'
        }
    });
});

// Metrics endpoint (Prometheus will scrape this)
app.get('/metrics', (req, res) => {
    // This will be handled by the Prometheus exporter
    res.redirect(`http://localhost:${process.env.PROMETHEUS_PORT || 9090}/metrics`);
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
    const { addSpanAttributes } = require('./src/config/telemetry');
    
    addSpanAttributes({
        'endpoint.type': 'info',
        'endpoint.public': true,
    });
    
    res.json({
        message: 'Family Tree API Server',
        version: '1.0.0',
        telemetry: {
            enabled: true,
            tracing: process.env.ENABLE_TRACING !== 'false',
            metrics: process.env.ENABLE_METRICS !== 'false',
        },
        endpoints: {
            'POST /api/auth/send-otp': 'Send OTP to phone number',
            'POST /api/auth/verify-otp': 'Verify OTP and authenticate',
            'POST /api/auth/register': 'Complete user registration',
            'POST /api/auth/login': 'Initiate login with phone',
            'POST /api/auth/refresh-token': 'Refresh access token',
            'GET /api/auth/profile': 'Get user profile (requires token)',
            'GET /api/family/tree': 'Get family tree',
            'POST /api/family/member': 'Add family member',
            'GET /api/events': 'Get events',
            'POST /api/events': 'Create event',
            'GET /api/posts/feed': 'Get social feed',
            'POST /api/posts': 'Create post',
            'GET /api/media': 'Get media',
            'POST /api/media': 'Upload media',
            'GET /health': 'Health check with telemetry info',
            'GET /metrics': 'Prometheus metrics endpoint',
            'GET /api-docs': 'API Documentation (Swagger)'
        }
    });
});

// OpenTelemetry error handling middleware (should be before other error handlers)
app.use(errorTelemetryMiddleware);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    const { recordException } = require('./src/config/telemetry');
    recordException(err);
    
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message,
        trace_id: req.headers['x-trace-id'] || 'unknown'
    });
});

// 404 handler
app.use((req, res) => {
    const { addSpanAttributes } = require('./src/config/telemetry');
    
    addSpanAttributes({
        'http.route': 'not_found',
        'error.type': '404',
    });
    
    res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Start server
async function startServer() {
    try {
        // Try to connect to JanusGraph
        try {
            await janusGraph.connect();
            console.log('✅ JanusGraph connected successfully');
        } catch (dbError) {
            console.warn('⚠️  Warning: Could not connect to JanusGraph database');
            console.warn('Please ensure JanusGraph server is running on ws://localhost:8182/gremlin');
            console.warn('The API will start but database operations will fail until JanusGraph is available');
        }
        
        // Start Express server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
            console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
            console.log(`📊 Metrics: http://localhost:${process.env.PROMETHEUS_PORT || 9090}/metrics`);
            
            if (process.env.ENABLE_TRACING !== 'false') {
                console.log(`🔍 Jaeger UI: http://localhost:16686`);
            }
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        
        const { recordException } = require('./src/config/telemetry');
        recordException(error);
        
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down gracefully...');
    try {
        await janusGraph.disconnect();
        console.log('✅ JanusGraph disconnected');
    } catch (error) {
        console.error('❌ Error disconnecting JanusGraph:', error);
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down gracefully...');
    try {
        await janusGraph.disconnect();
        console.log('✅ JanusGraph disconnected');
    } catch (error) {
        console.error('❌ Error disconnecting JanusGraph:', error);
    }
    process.exit(0);
});

startServer();