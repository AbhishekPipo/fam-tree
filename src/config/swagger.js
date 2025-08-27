const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Family Tree API',
      version: '1.0.0',
      description: 'A RESTful API for managing family tree data using JanusGraph database',
      contact: {
        name: 'API Support',
        url: 'https://github.com/AbhishekPipo/fam-tree',
        email: 'support@famtree.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier from JanusGraph',
              example: '4096'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            name: {
              type: 'string',
              description: 'Full name of the user',
              example: 'John Doe'
            },
            phone: {
              type: 'string',
              description: 'Phone number (optional)',
              example: '+1234567890'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password',
              example: 'password123'
            },
            name: {
              type: 'string',
              description: 'Full name of the user',
              example: 'John Doe'
            },
            phone: {
              type: 'string',
              description: 'Phone number (optional)',
              example: '+1234567890'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'password123'
            },
            otp: {
              type: 'string',
              description: 'Optional OTP for additional security',
              example: '123456'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Login successful'
            },
            token: {
              type: 'string',
              description: 'JWT authentication token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Invalid email or password'
            },
            message: {
              type: 'string',
              description: 'Additional error details',
              example: 'The provided credentials are incorrect'
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Server status',
              example: 'OK'
            },
            message: {
              type: 'string',
              description: 'Status message',
              example: 'Server is running'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Current timestamp',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        ApiInfo: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Family Tree API Server'
            },
            version: {
              type: 'string',
              example: '1.0.0'
            },
            endpoints: {
              type: 'object',
              additionalProperties: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'System',
        description: 'System health and information endpoints'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './server.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi
};
