const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const logger = require('./src/config/logger');
const { apiLimiter } = require('./src/middleware/rateLimiter');
require('dotenv').config();

const database = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const familyRoutes = require('./src/routes/familyRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const dnaRoutes = require('./src/routes/dnaRoutes');
const gedcomRoutes = require('./src/routes/gedcomRoutes');
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, you can specify allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 hours
};

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Rate limiting
app.use('/api/', apiLimiter);

// CORS
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// Additional CORS headers for better compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dna', dnaRoutes);
app.use('/api/gedcom', gedcomRoutes);

// Swagger JSON endpoint
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Family Tree Neo4j API Documentation',
  swaggerOptions: {
    docExpansion: 'none',
    defaultModelsExpandDepth: -1,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha'
  }
}));

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current status of the Family Tree Neo4j API
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: Family Tree Neo4j API is running
 *                 database:
 *                   type: string
 *                   example: Neo4j Connected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-01-15T07:30:00.000Z
 *             example:
 *               status: "OK"
 *               message: "Family Tree Neo4j API is running"
 *               database: "Neo4j Connected"
 *               timestamp: "2025-01-15T07:30:00.000Z"
 */
// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await database.runQuery('RETURN 1 as test');
    
    res.json({ 
      status: 'OK', 
      message: 'Family Tree Neo4j API is running',
      database: 'Neo4j Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Family Tree Neo4j API is running but database connection failed',
      database: 'Neo4j Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to Neo4j database
    await database.connect();
    logger.info('Neo4j database connection established successfully');
    
    app.listen(PORT, () => {
      logger.info(`Family Tree Neo4j Server running on port ${PORT}`);
      logger.info(`API URL: http://localhost:${PORT}/api`);
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`Web Interface: http://localhost:${PORT}`);
      logger.info(`Health Check: http://localhost:${PORT}/api/health`);
      
      console.log(`🌳 Family Tree Neo4j Server running on port ${PORT}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🌐 Web Interface: http://localhost:${PORT}`);
      console.log(`💊 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`
🎯 Quick Start:
1. Setup database: npm run setup-db
2. Seed with sample data: npm run seed
3. Visit API docs: http://localhost:${PORT}/api-docs
4. Test login with: prashanth@family.com / FamilyTree123!
      `);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await database.close();
  process.exit(0);
});

module.exports = app;