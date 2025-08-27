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
            phoneNumber: {
              type: 'string',
              description: 'User phone number (primary identifier)',
              example: '+1234567890'
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              description: 'User last name',
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address (optional)',
              example: 'john.doe@example.com'
            },
            isVerified: {
              type: 'boolean',
              description: 'Whether phone number is verified',
              example: true
            },
            isActive: {
              type: 'boolean',
              description: 'Whether user account is active',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
              example: '2024-01-01T00:00:00.000Z'
            }
          }
        },
        PhoneOTPRequest: {
          type: 'object',
          required: ['phoneNumber'],
          properties: {
            phoneNumber: {
              type: 'string',
              pattern: '^\\+?[1-9]\\d{1,14}$',
              description: 'Phone number in international format',
              example: '+1234567890'
            }
          }
        },
        OTPVerifyRequest: {
          type: 'object',
          required: ['phoneNumber', 'otp'],
          properties: {
            phoneNumber: {
              type: 'string',
              pattern: '^\\+?[1-9]\\d{1,14}$',
              description: 'Phone number used for OTP',
              example: '+1234567890'
            },
            otp: {
              type: 'string',
              pattern: '^\\d{6}$',
              description: '6-digit OTP code',
              example: '123456'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['tempToken', 'firstName', 'lastName'],
          properties: {
            tempToken: {
              type: 'string',
              description: 'Temporary token from OTP verification'
            },
            firstName: {
              type: 'string',
              minLength: 1,
              maxLength: 50,
              description: 'User first name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              minLength: 1,
              maxLength: 50,
              description: 'User last name',
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Optional email address',
              example: 'john.doe@example.com'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['phoneNumber'],
          properties: {
            phoneNumber: {
              type: 'string',
              pattern: '^\\+?[1-9]\\d{1,14}$',
              description: 'Registered phone number',
              example: '+1234567890'
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
    './src/routes/*.js',
    './server.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi
};
