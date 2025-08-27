# Phone + OTP Authentication Implementation Plan

## 🎯 Overview
Transform the current email/password authentication system to a modern phone number + OTP (One-Time Password) authentication system.

## 📱 Current vs Target Authentication Flow

### Current Flow (Email + Password)
```
1. POST /api/auth/register { email, password, name, phone }
2. POST /api/auth/login { email, password, otp? }
3. GET /api/auth/profile [Bearer token]
```

### Target Flow (Phone + OTP)
```
1. POST /api/auth/send-otp { phoneNumber }
2. POST /api/auth/verify-otp { phoneNumber, otp }
3. POST /api/auth/register { phoneNumber, otp, firstName, lastName }
4. POST /api/auth/login { phoneNumber }
5. POST /api/auth/verify-login { phoneNumber, otp }
6. GET /api/auth/profile [Bearer token]
```

## 🏗️ Database Schema Changes

### Current User Model (JanusGraph)
```javascript
// Current User vertex properties
{
  id: UUID,
  email: String (unique),
  password: String (hashed),
  name: String,
  phone: String (optional),
  createdAt: DateTime
}
```

### Updated User Model (Phone-First)
```javascript
// Updated User vertex properties
{
  id: UUID,
  phoneNumber: String (unique, required),
  firstName: String (required),
  lastName: String (required),
  email: String (optional),
  isVerified: Boolean (default: false),
  lastOtpSent: DateTime,
  otpAttempts: Number (default: 0),
  isActive: Boolean (default: true),
  createdAt: DateTime,
  updatedAt: DateTime,
  
  // Remove password field entirely
  // OTP is temporary and not stored
}
```

## 📋 Implementation Steps

### Step 1: OTP Service Integration
Choose and integrate an OTP service provider:

**Option A: Twilio SMS**
```javascript
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const sendOTP = async (phoneNumber, otp) => {
  return await client.messages.create({
    body: `Your family tree verification code is: ${otp}`,
    from: process.env.TWILIO_PHONE,
    to: phoneNumber
  });
};
```

**Option B: AWS SNS**
```javascript
const AWS = require('aws-sdk');
const sns = new AWS.SNS({ region: process.env.AWS_REGION });

const sendOTP = async (phoneNumber, otp) => {
  return await sns.publish({
    PhoneNumber: phoneNumber,
    Message: `Your family tree verification code is: ${otp}`
  }).promise();
};
```

### Step 2: OTP Generation & Validation
```javascript
// utils/otp.js
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

const isOTPExpired = (sentTime) => {
  const expirationTime = 5 * 60 * 1000; // 5 minutes
  return Date.now() - sentTime > expirationTime;
};

const validatePhoneNumber = (phone) => {
  // International phone number validation
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};
```

### Step 3: Updated Authentication Routes

#### Send OTP Endpoint
```javascript
// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format' 
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes
    
    // Store OTP temporarily (Redis recommended)
    await redis.setex(`otp:${phoneNumber}`, 300, JSON.stringify({
      otp,
      attempts: 0,
      createdAt: Date.now()
    }));
    
    // Send OTP via SMS
    await sendOTP(phoneNumber, otp);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300 // 5 minutes
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});
```

#### Verify OTP Endpoint
```javascript
// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    
    // Get stored OTP
    const storedData = await redis.get(`otp:${phoneNumber}`);
    if (!storedData) {
      return res.status(400).json({ 
        error: 'OTP expired or invalid' 
      });
    }
    
    const { otp: storedOtp, attempts } = JSON.parse(storedData);
    
    // Check attempts limit
    if (attempts >= 3) {
      await redis.del(`otp:${phoneNumber}`);
      return res.status(400).json({ 
        error: 'Too many attempts. Please request a new OTP.' 
      });
    }
    
    // Verify OTP
    if (otp !== storedOtp) {
      await redis.setex(`otp:${phoneNumber}`, 300, JSON.stringify({
        otp: storedOtp,
        attempts: attempts + 1,
        createdAt: Date.now()
      }));
      
      return res.status(400).json({ 
        error: 'Invalid OTP',
        attemptsRemaining: 2 - attempts
      });
    }
    
    // OTP verified successfully
    await redis.del(`otp:${phoneNumber}`);
    
    // Check if user exists
    const g = janusGraph.getTraversal();
    const existingUser = await g.V()
      .has('User', 'phoneNumber', phoneNumber)
      .toList();
    
    if (existingUser.length > 0) {
      // Existing user - login
      const user = existingUser[0];
      const userId = user.id;
      const token = generateToken(userId);
      
      res.json({
        success: true,
        action: 'login',
        token,
        user: {
          id: userId,
          phoneNumber: phoneNumber
        }
      });
    } else {
      // New user - needs registration
      const tempToken = jwt.sign(
        { phoneNumber, verified: true },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
      
      res.json({
        success: true,
        action: 'register',
        tempToken,
        message: 'Phone verified. Please complete registration.'
      });
    }
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});
```

#### Registration Endpoint (Updated)
```javascript
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { tempToken, firstName, lastName, email } = req.body;
    
    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!decoded.verified) {
      return res.status(401).json({ error: 'Phone not verified' });
    }
    
    const phoneNumber = decoded.phoneNumber;
    
    // Check if user already exists
    const g = janusGraph.getTraversal();
    const existingUser = await g.V()
      .has('User', 'phoneNumber', phoneNumber)
      .toList();
    
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        error: 'User already exists with this phone number' 
      });
    }
    
    // Create new user
    const user = await g.addV('User')
      .property('phoneNumber', phoneNumber)
      .property('firstName', firstName)
      .property('lastName', lastName)
      .property('email', email || '')
      .property('isVerified', true)
      .property('isActive', true)
      .property('createdAt', new Date().toISOString())
      .property('updatedAt', new Date().toISOString())
      .next();
    
    const userId = user.value.id;
    const token = generateToken(userId);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        phoneNumber,
        firstName,
        lastName,
        email: email || ''
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

### Step 4: Updated Environment Variables
```bash
# .env additions
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
TWILIO_PHONE=your_twilio_phone_number

# Or for AWS SNS
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region

# Redis for OTP storage
REDIS_URL=redis://localhost:6379

# JWT secret
JWT_SECRET=your_jwt_secret_key
```

### Step 5: Middleware Updates
```javascript
// middleware/auth.js - Updated to work with phone numbers
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required' 
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }
    
    // Get user details from JanusGraph
    const g = janusGraph.getTraversal();
    const userVertex = await g.V(user.userId).next();
    
    if (!userVertex.value) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    req.userDetails = userVertex.value;
    next();
  });
};
```

## 📱 API Documentation Updates

### Updated Swagger Schemas
```javascript
// swagger.js additions
PhoneNumberRequest: {
  type: 'object',
  required: ['phoneNumber'],
  properties: {
    phoneNumber: {
      type: 'string',
      pattern: '^\\+[1-9]\\d{1,14}$',
      description: 'International phone number format',
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
      pattern: '^\\+[1-9]\\d{1,14}$',
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

RegistrationRequest: {
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
      example: 'John'
    },
    lastName: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      example: 'Doe'
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'Optional email address',
      example: 'john.doe@example.com'
    }
  }
}
```

## 🧪 Testing Strategy

### Unit Tests for OTP Functions
```javascript
// tests/auth.test.js
describe('OTP Authentication', () => {
  test('should generate 6-digit OTP', () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
    expect(/^\d+$/.test(otp)).toBe(true);
  });
  
  test('should validate phone numbers correctly', () => {
    expect(validatePhoneNumber('+1234567890')).toBe(true);
    expect(validatePhoneNumber('1234567890')).toBe(false);
    expect(validatePhoneNumber('+123')).toBe(false);
  });
  
  test('should detect expired OTPs', () => {
    const oldTime = Date.now() - (6 * 60 * 1000); // 6 minutes ago
    expect(isOTPExpired(oldTime)).toBe(true);
    
    const recentTime = Date.now() - (2 * 60 * 1000); // 2 minutes ago
    expect(isOTPExpired(recentTime)).toBe(false);
  });
});
```

## 🚀 Deployment Considerations

### Redis Setup
```bash
# For OTP storage (local development)
docker run -d -p 6379:6379 redis:alpine

# For production
# Use Redis Cloud or AWS ElastiCache
```

### Environment Configuration
```javascript
// config/database.js - Add Redis connection
const redis = require('redis');
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

module.exports = {
  janusGraph,
  redis: redisClient
};
```

## 📋 Migration Checklist

- [ ] **Setup OTP Service** (Twilio/AWS SNS)
- [ ] **Install Redis** for temporary OTP storage
- [ ] **Update User Model** in JanusGraph
- [ ] **Implement new auth endpoints**
- [ ] **Update existing middleware**
- [ ] **Update Swagger documentation**
- [ ] **Write unit tests**
- [ ] **Test phone number validation**
- [ ] **Test OTP generation/verification**
- [ ] **Update frontend integration**
- [ ] **Deploy and test in staging**

## 📱 Mobile App Integration

The new authentication flow will be perfect for mobile apps:

1. **Phone Number Input** - User enters phone number
2. **OTP Delivery** - SMS sent to phone
3. **OTP Input** - User enters 6-digit code
4. **Automatic Login** - For returning users
5. **Registration Flow** - For new users only

This approach provides:
- ✅ **Better UX** - No password management
- ✅ **Higher Security** - SMS-based verification
- ✅ **Mobile-First** - Perfect for phone apps
- ✅ **Global Support** - International phone numbers
- ✅ **Quick Access** - Fast login process

---

**This phone + OTP authentication system will provide a modern, secure, and user-friendly authentication experience perfect for your family tree mobile application.** 📱🔐
