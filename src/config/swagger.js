const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Family Tree API',
      version: '1.0.0',
      description: 'A comprehensive family tree management API with optimized relationship tracking',
      contact: {
        name: 'Family Tree API Support',
        email: 'support@familytree.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
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
          required: ['firstName', 'lastName', 'email'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique user identifier',
              example: 1
            },
            firstName: {
              type: 'string',
              maxLength: 50,
              description: 'User\'s first name',
              example: 'Prashanth'
            },
            middleName: {
              type: 'string',
              maxLength: 50,
              description: 'User\'s middle name',
              example: 'Kumar'
            },
            lastName: {
              type: 'string',
              maxLength: 50,
              description: 'User\'s last name',
              example: 'Patel'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User\'s email address',
              example: 'prashanth@family.com'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'User\'s date of birth',
              example: '1975-03-10'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              description: 'User\'s gender',
              example: 'male'
            },
            location: {
              type: 'string',
              maxLength: 100,
              description: 'User\'s location',
              example: 'Bangalore, India'
            },
            profilePicture: {
              type: 'string',
              description: 'URL to user\'s profile picture'
            },
            hasMedication: {
              type: 'boolean',
              description: 'Whether user takes medication',
              example: true
            },
            medicationName: {
              type: 'string',
              description: 'Name of medication',
              example: 'Blood Pressure Medicine'
            },
            medicationFrequency: {
              type: 'string',
              description: 'How often medication is taken',
              example: 'Daily'
            },
            medicationTime: {
              type: 'string',
              description: 'When medication is taken',
              example: 'Morning'
            },
            isOnline: {
              type: 'boolean',
              description: 'Whether user is currently online',
              example: false
            },
            isDeceased: {
              type: 'boolean',
              description: 'Whether user is deceased',
              example: false
            },
            staysWithUser: {
              type: 'boolean',
              description: 'Whether user stays with current user',
              example: false
            },
            fatherId: {
              type: 'integer',
              description: 'ID of user\'s father',
              example: 1
            },
            motherId: {
              type: 'integer',
              description: 'ID of user\'s mother',
              example: 2
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'When user account was created'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When user account was last updated'
            }
          }
        },
        FamilyMember: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User'
            },
            relationship: {
              type: 'string',
              description: 'Relationship to the current user',
              example: 'father'
            },
            level: {
              type: 'integer',
              description: 'Relationship level (+ve ancestors, -ve descendants, 0 same generation)',
              example: 1
            },
            parentInfo: {
              type: 'object',
              properties: {
                directParent: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer',
                      example: 5
                    },
                    name: {
                      type: 'string',
                      example: 'Simran Patel'
                    },
                    relationship: {
                      type: 'string',
                      example: 'daughter'
                    }
                  }
                }
              }
            }
          }
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
              },
              description: 'Family members who are ancestors (parents, grandparents, etc.)'
            },
            descendants: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/FamilyMember'
              },
              description: 'Family members who are descendants (children, grandchildren, etc.)'
            },
            adjacent: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/FamilyMember'
              },
              description: 'Family members at same level (spouses, siblings, cousins)'
            },
            totalMembers: {
              type: 'integer',
              description: 'Total number of family members',
              example: 7
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
              example: 'prashanth@family.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password',
              example: 'FamilyTree123!'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: {
              type: 'string',
              maxLength: 50,
              example: 'John'
            },
            middleName: {
              type: 'string',
              maxLength: 50,
              example: 'Kumar'
            },
            lastName: {
              type: 'string',
              maxLength: 50,
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Must contain at least one lowercase, uppercase, and number',
              example: 'SecurePass123!'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              example: '1990-01-15'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              example: 'male'
            },
            location: {
              type: 'string',
              maxLength: 100,
              example: 'New York, USA'
            },
            fatherId: {
              type: 'integer',
              description: 'ID of father (if known)',
              example: 1
            },
            motherId: {
              type: 'integer',
              description: 'ID of mother (if known)',
              example: 2
            }
          }
        },
        AddFamilyMemberRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'relationshipType'],
          properties: {
            firstName: {
              type: 'string',
              maxLength: 50,
              example: 'New'
            },
            middleName: {
              type: 'string',
              maxLength: 50,
              example: 'Kumar'
            },
            lastName: {
              type: 'string',
              maxLength: 50,
              example: 'Member'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'newmember@family.com'
            },
            relationshipType: {
              type: 'string',
              enum: ['father', 'mother', 'son', 'daughter', 'husband', 'wife', 'partner', 'brother', 'sister'],
              description: 'Relationship to the current user',
              example: 'son'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              example: '2010-05-20'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              example: 'male'
            },
            location: {
              type: 'string',
              maxLength: 100,
              example: 'Family Home'
            },
            hasMedication: {
              type: 'boolean',
              example: false
            },
            medicationName: {
              type: 'string',
              example: 'Daily Vitamins'
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
            },
            data: {
              type: 'object',
              description: 'Response data'
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
              example: 'Error message describing what went wrong'
            },
            error: {
              type: 'string',
              example: 'ERROR_CODE'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'Please provide a valid email address'
                  },
                  value: {
                    type: 'string',
                    example: 'invalid-email'
                  }
                }
              }
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
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
    path.join(__dirname, '../../server.js')
  ]
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;
