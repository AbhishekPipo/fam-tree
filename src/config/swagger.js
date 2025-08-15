const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Family Tree Neo4j API',
      version: '1.0.0',
      description: 'A comprehensive family tree management API using Neo4j graph database',
      contact: {
        name: 'Family Tree API Support',
        email: 'support@familytree.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-domain.com/api'
          : `http://localhost:${process.env.PORT || 3000}/api`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier'
            },
            firstName: {
              type: 'string',
              example: 'John'
            },
            middleName: {
              type: 'string',
              example: 'Michael'
            },
            lastName: {
              type: 'string',
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@family.com'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              example: '1990-05-15'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              example: 'male'
            },
            location: {
              type: 'string',
              example: 'New York, USA'
            },
            profilePicture: {
              type: 'string',
              example: '/uploads/profile-123.jpg'
            },
            hasMedication: {
              type: 'boolean',
              example: false
            },
            medicationName: {
              type: 'string',
              example: 'Blood Pressure Medicine'
            },
            medicationFrequency: {
              type: 'string',
              example: 'Daily'
            },
            medicationTime: {
              type: 'string',
              example: 'Morning'
            },
            isOnline: {
              type: 'boolean',
              example: false
            },
            isDeceased: {
              type: 'boolean',
              example: false
            },
            staysWithUser: {
              type: 'boolean',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        FamilyMember: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                relationship: {
                  type: 'string',
                  example: 'father'
                },
                level: {
                  type: 'integer',
                  example: 1
                },
                spouse: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          ]
        },
        FamilyTree: {
          type: 'object',
          properties: {
            currentUser: {
              $ref: '#/components/schemas/User'
            },
            ancestors: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/FamilyMember'
              }
            },
            descendants: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/FamilyMember'
              }
            },
            adjacent: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/FamilyMember'
              }
            },
            totalMembers: {
              type: 'integer',
              example: 15
            }
          }
        },
        AddFamilyMemberRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'relationshipType', 'gender'],
          properties: {
            firstName: {
              type: 'string',
              example: 'Jane'
            },
            middleName: {
              type: 'string',
              example: 'Marie'
            },
            lastName: {
              type: 'string',
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'jane.doe@family.com'
            },
            relationshipType: {
              type: 'string',
              example: 'daughter'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              example: 'female'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              example: '2010-03-20'
            },
            location: {
              type: 'string',
              example: 'Family Home'
            },
            hasMedication: {
              type: 'boolean',
              example: false
            },
            medicationName: {
              type: 'string',
              example: 'Vitamins'
            },
            medicationFrequency: {
              type: 'string',
              example: 'Daily'
            },
            medicationTime: {
              type: 'string',
              example: 'Morning'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'An error occurred'
            },
            error: {
              type: 'string',
              example: 'VALIDATION_ERROR'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./server.js', './src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(options);
module.exports = specs;