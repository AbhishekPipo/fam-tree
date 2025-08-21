const Joi = require('joi');

// Common validation patterns
const patterns = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]{10,15}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  otp: /^\d{6}$/
};

// User validation schemas
const userSchemas = {
  phoneRegister: Joi.object({
    firstName: Joi.string().trim().min(1).max(50).required(),
    middleName: Joi.string().trim().max(50).allow(null, ''),
    lastName: Joi.string().trim().min(1).max(50).required(),
    phoneNumber: Joi.string().pattern(patterns.phone).required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    dateOfBirth: Joi.date().iso().max('now').allow(null),
    preferences: Joi.object({
      language: Joi.string().default('en'),
      timezone: Joi.string().default('UTC'),
      dateFormat: Joi.string().default('YYYY-MM-DD'),
      notifications: Joi.object({
        email: Joi.boolean().default(true),
        push: Joi.boolean().default(true),
        sms: Joi.boolean().default(true)
      }).default(),
      privacy: Joi.object({
        showEmail: Joi.boolean().default(false),
        showPhone: Joi.boolean().default(false),
        showBirthDate: Joi.boolean().default(true)
      }).default()
    }).default()
  }),

  phoneLogin: Joi.object({
    phoneNumber: Joi.string().pattern(patterns.phone).required()
  }),

  verifyOtp: Joi.object({
    phoneNumber: Joi.string().pattern(patterns.phone).required(),
    otp: Joi.string().pattern(patterns.otp).required()
  }),

  resendOtp: Joi.object({
    phoneNumber: Joi.string().pattern(patterns.phone).required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().trim().min(1).max(50),
    middleName: Joi.string().trim().max(50).allow(null, ''),
    lastName: Joi.string().trim().min(1).max(50),
    phoneNumber: Joi.string().pattern(patterns.phone).allow(null, ''),
    dateOfBirth: Joi.date().iso().max('now').allow(null),
    gender: Joi.string().valid('male', 'female', 'other'),
    occupation: Joi.string().max(100).allow(null, ''),
    employer: Joi.string().max(100).allow(null, ''),
    biography: Joi.string().max(1000).allow(null, ''),
    preferences: Joi.object({
      language: Joi.string(),
      timezone: Joi.string(),
      dateFormat: Joi.string(),
      notifications: Joi.object({
        email: Joi.boolean(),
        push: Joi.boolean(),
        sms: Joi.boolean()
      }),
      privacy: Joi.object({
        showEmail: Joi.boolean(),
        showPhone: Joi.boolean(),
        showBirthDate: Joi.boolean()
      })
    })
  }).min(1)
};

// Person validation schemas
const personSchemas = {
  create: Joi.object({
    firstName: Joi.string().trim().min(1).max(50).required(),
    middleName: Joi.string().trim().max(50).allow(null, ''),
    lastName: Joi.string().trim().min(1).max(50).required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    dateOfBirth: Joi.date().iso().max('now').allow(null),
    dateOfDeath: Joi.date().iso().allow(null),
    isDeceased: Joi.boolean().default(false),
    email: Joi.string().email().allow(null, ''),
    phone: Joi.string().pattern(patterns.phone).allow(null, ''),
    occupation: Joi.string().max(100).allow(null, ''),
    employer: Joi.string().max(100).allow(null, ''),
    biography: Joi.string().max(1000).allow(null, ''),
    visibility: Joi.string().valid('public', 'family', 'private').default('family'),
    livingArrangement: Joi.string().valid('independent', 'assisted', 'family', 'other').default('independent'),
    address: Joi.object({
      street: Joi.string().max(200),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      country: Joi.string().max(100),
      postalCode: Joi.string().max(20)
    }).allow(null),
    medicalConditions: Joi.array().items(Joi.string().max(100)),
    allergies: Joi.array().items(Joi.string().max(100)),
    bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow(null),
    tags: Joi.array().items(Joi.string().max(50))
  }),

  update: Joi.object({
    firstName: Joi.string().trim().min(1).max(50),
    middleName: Joi.string().trim().max(50).allow(null, ''),
    lastName: Joi.string().trim().min(1).max(50),
    gender: Joi.string().valid('male', 'female', 'other'),
    dateOfBirth: Joi.date().iso().max('now').allow(null),
    dateOfDeath: Joi.date().iso().allow(null),
    isDeceased: Joi.boolean(),
    email: Joi.string().email().allow(null, ''),
    phone: Joi.string().pattern(patterns.phone).allow(null, ''),
    occupation: Joi.string().max(100).allow(null, ''),
    employer: Joi.string().max(100).allow(null, ''),
    biography: Joi.string().max(1000).allow(null, ''),
    visibility: Joi.string().valid('public', 'family', 'private'),
    livingArrangement: Joi.string().valid('independent', 'assisted', 'family', 'other'),
    address: Joi.object({
      street: Joi.string().max(200),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      country: Joi.string().max(100),
      postalCode: Joi.string().max(20)
    }).allow(null),
    medicalConditions: Joi.array().items(Joi.string().max(100)),
    allergies: Joi.array().items(Joi.string().max(100)),
    bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow(null),
    tags: Joi.array().items(Joi.string().max(50))
  }).min(1)
};

// Family Tree validation schemas
const familyTreeSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    description: Joi.string().max(500).allow(null, ''),
    visibility: Joi.string().valid('public', 'private', 'family').default('family'),
    allowContributions: Joi.boolean().default(true),
    requireApproval: Joi.boolean().default(false),
    settings: Joi.object({
      defaultPrivacy: Joi.string().valid('public', 'family', 'private').default('family'),
      allowPhotoUploads: Joi.boolean().default(true),
      maxFileSize: Joi.number().integer().min(1024).max(52428800).default(10485760), // 1KB to 50MB
      allowedFileTypes: Joi.array().items(Joi.string().valid('jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'))
    }).default()
  }),

  update: Joi.object({
    name: Joi.string().trim().min(1).max(100),
    description: Joi.string().max(500).allow(null, ''),
    visibility: Joi.string().valid('public', 'private', 'family'),
    allowContributions: Joi.boolean(),
    requireApproval: Joi.boolean(),
    settings: Joi.object({
      defaultPrivacy: Joi.string().valid('public', 'family', 'private'),
      allowPhotoUploads: Joi.boolean(),
      maxFileSize: Joi.number().integer().min(1024).max(52428800),
      allowedFileTypes: Joi.array().items(Joi.string().valid('jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'))
    })
  }).min(1)
};

// Event validation schemas
const eventSchemas = {
  create: Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().max(1000).allow(null, ''),
    eventType: Joi.string().valid(
      'birth', 'death', 'marriage', 'divorce', 'graduation', 'employment',
      'retirement', 'military', 'immigration', 'other'
    ).default('other'),
    date: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('date')).allow(null),
    isApproximate: Joi.boolean().default(false),
    location: Joi.object({
      name: Joi.string().max(200),
      address: Joi.string().max(300),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      country: Joi.string().max(100),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180)
      })
    }).allow(null),
    sources: Joi.array().items(Joi.string().max(500))
  }),

  update: Joi.object({
    title: Joi.string().trim().min(1).max(200),
    description: Joi.string().max(1000).allow(null, ''),
    eventType: Joi.string().valid(
      'birth', 'death', 'marriage', 'divorce', 'graduation', 'employment',
      'retirement', 'military', 'immigration', 'other'
    ),
    date: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('date')).allow(null),
    isApproximate: Joi.boolean(),
    location: Joi.object({
      name: Joi.string().max(200),
      address: Joi.string().max(300),
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      country: Joi.string().max(100),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180)
      })
    }).allow(null),
    sources: Joi.array().items(Joi.string().max(500))
  }).min(1)
};

// Relationship validation schemas
const relationshipSchemas = {
  create: Joi.object({
    fromPersonId: Joi.string().pattern(patterns.uuid).required(),
    toPersonId: Joi.string().pattern(patterns.uuid).required(),
    relationshipType: Joi.string().valid(
      'PARENT_OF', 'CHILD_OF', 'SIBLING_OF', 'MARRIED_TO', 'ENGAGED_TO',
      'DIVORCED_FROM', 'GRANDPARENT_OF', 'GRANDCHILD_OF', 'UNCLE_AUNT_OF',
      'NEPHEW_NIECE_OF', 'COUSIN_OF', 'IN_LAW_OF'
    ).required(),
    properties: Joi.object({
      establishedDate: Joi.date().iso(),
      endDate: Joi.date().iso(),
      confidence: Joi.number().min(0).max(1).default(1.0),
      status: Joi.string().valid('active', 'inactive', 'divorced', 'separated').default('active'),
      notes: Joi.string().max(500),
      sources: Joi.array().items(Joi.string().max(500))
    }).default({})
  })
};

// Search validation schemas
const searchSchemas = {
  query: Joi.object({
    q: Joi.string().trim().min(1).max(200).required(),
    type: Joi.string().valid('person', 'event', 'all').default('all'),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0),
    filters: Joi.object({
      gender: Joi.string().valid('male', 'female', 'other'),
      isDeceased: Joi.boolean(),
      visibility: Joi.string().valid('public', 'family', 'private'),
      dateRange: Joi.object({
        start: Joi.date().iso(),
        end: Joi.date().iso().min(Joi.ref('start'))
      })
    })
  })
};

// Media validation schemas
const mediaSchemas = {
  upload: Joi.object({
    title: Joi.string().trim().max(200).allow(null, ''),
    description: Joi.string().max(1000).allow(null, ''),
    tags: Joi.array().items(Joi.string().max(50)),
    album: Joi.string().max(100).allow(null, ''),
    visibility: Joi.string().valid('public', 'family', 'private').default('family')
  })
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  userSchemas,
  personSchemas,
  familyTreeSchemas,
  eventSchemas,
  relationshipSchemas,
  searchSchemas,
  mediaSchemas,
  validate,
  patterns
};