# JWT Secret Generation Guide

## What is JWT_SECRET?

The `JWT_SECRET` is a cryptographic key used to sign and verify JSON Web Tokens (JWTs). It's crucial for the security of your authentication system because:

1. **Token Signing**: Used to create a digital signature for each JWT
2. **Token Verification**: Used to verify that tokens haven't been tampered with
3. **Security**: Prevents unauthorized users from creating fake tokens

## Why You Need Strong Secrets

- **Weak secrets** can be cracked by attackers, allowing them to forge tokens
- **Strong secrets** ensure your authentication system remains secure
- **Different secrets** for access and refresh tokens provide additional security layers

## How to Generate Secure JWT Secrets

### Method 1: Using Node.js (Recommended)

```javascript
// Run this in Node.js console or create a script
const crypto = require('crypto');

// Generate a 256-bit (32-byte) random secret
const jwtSecret = crypto.randomBytes(32).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');

console.log('JWT_SECRET=' + jwtSecret);
console.log('JWT_REFRESH_SECRET=' + jwtRefreshSecret);
```

**Example output:**
```
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
JWT_REFRESH_SECRET=9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba
```

### Method 2: Using OpenSSL (Command Line)

```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate JWT_REFRESH_SECRET  
openssl rand -hex 32
```

### Method 3: Using Online Tools (Less Secure)

**⚠️ Warning**: Only use for development, never for production!

- Visit: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
- Select: 256-bit
- Generate two different keys

### Method 4: Using Python

```python
import secrets

# Generate secure random secrets
jwt_secret = secrets.token_hex(32)
jwt_refresh_secret = secrets.token_hex(32)

print(f"JWT_SECRET={jwt_secret}")
print(f"JWT_REFRESH_SECRET={jwt_refresh_secret}")
```

## Setting Up Your Environment

### 1. Create/Update Your `.env` File

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JanusGraph Configuration
JANUS_HOST=localhost
JANUS_PORT=8182
JANUS_PATH=/gremlin

# JWT Configuration - REPLACE WITH YOUR OWN SECRETS!
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
JWT_REFRESH_SECRET=9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba
JWT_ACCESS_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# OTP Configuration
STATIC_OTP=123456

# Optional: Docker Configuration
JANUSGRAPH_CONTAINER_NAME=janusgraph-default
JANUSGRAPH_MEMORY_OPTS=-Xms512m -Xmx1024m
```

### 2. Generate Your Secrets

**Quick Script** - Create `generate-secrets.js`:

```javascript
const crypto = require('crypto');

console.log('=== JWT SECRETS FOR YOUR .env FILE ===\n');
console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('\n=== COPY THESE TO YOUR .env FILE ===');
```

Run it:
```bash
node generate-secrets.js
```

## Security Best Practices

### 1. **Secret Requirements**
- **Minimum 32 characters** (256 bits)
- **Random and unpredictable**
- **Different for access and refresh tokens**
- **Never commit to version control**

### 2. **Environment-Specific Secrets**
```env
# Development
JWT_SECRET=dev_secret_here_32_chars_minimum

# Staging  
JWT_SECRET=staging_secret_different_from_dev

# Production
JWT_SECRET=production_secret_ultra_secure_256bit
```

### 3. **Secret Rotation**
- **Rotate secrets periodically** (every 3-6 months)
- **Use different secrets per environment**
- **Keep backup of old secrets during transition**

### 4. **Storage Security**
- **Never hardcode** secrets in source code
- **Use environment variables** or secure vaults
- **Restrict access** to production secrets
- **Use secret management tools** (AWS Secrets Manager, Azure Key Vault, etc.)

## Token Expiry Configuration

### Current Settings (Updated)
```env
JWT_ACCESS_EXPIRY=24h    # Access tokens last 24 hours
JWT_REFRESH_EXPIRY=7d    # Refresh tokens last 7 days
```

### Available Time Formats
```env
# Seconds
JWT_ACCESS_EXPIRY=3600    # 1 hour in seconds

# Minutes  
JWT_ACCESS_EXPIRY=60m     # 60 minutes

# Hours
JWT_ACCESS_EXPIRY=24h     # 24 hours

# Days
JWT_ACCESS_EXPIRY=7d      # 7 days

# Weeks
JWT_ACCESS_EXPIRY=2w      # 2 weeks
```

## Testing Your Setup

### 1. **Verify Environment Variables**

Create `test-env.js`:
```javascript
require('dotenv').config();

console.log('Environment Check:');
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
console.log('JWT_REFRESH_SECRET length:', process.env.JWT_REFRESH_SECRET?.length || 0);
console.log('JWT_ACCESS_EXPIRY:', process.env.JWT_ACCESS_EXPIRY);
console.log('JWT_REFRESH_EXPIRY:', process.env.JWT_REFRESH_EXPIRY);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET is too short or missing!');
} else {
    console.log('✅ JWT_SECRET looks good');
}

if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    console.error('❌ JWT_REFRESH_SECRET is too short or missing!');
} else {
    console.log('✅ JWT_REFRESH_SECRET looks good');
}
```

Run it:
```bash
node test-env.js
```

### 2. **Test Token Generation**

```javascript
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test token creation
const testPayload = { userId: 'test123', role: 'user', type: 'access' };
const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

console.log('Generated token:', token);

// Test token verification
try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verification successful:', decoded);
} catch (error) {
    console.error('❌ Token verification failed:', error.message);
}
```

## Common Issues & Solutions

### 1. **"Invalid Token" Errors**
```
Cause: Wrong JWT_SECRET or missing secret
Solution: Verify your .env file has the correct JWT_SECRET
```

### 2. **"Token Expired" Errors**
```
Cause: Token has exceeded its expiry time
Solution: Use refresh token to get new access token
```

### 3. **"Secret Too Short" Warnings**
```
Cause: JWT_SECRET is less than 32 characters
Solution: Generate a proper 256-bit secret (64 hex characters)
```

### 4. **Environment Variables Not Loading**
```
Cause: .env file not in root directory or not loaded
Solution: Ensure .env is in project root and require('dotenv').config() is called
```

## Production Deployment

### 1. **Environment Variables Setup**

**Heroku:**
```bash
heroku config:set JWT_SECRET=your_production_secret_here
heroku config:set JWT_REFRESH_SECRET=your_refresh_secret_here
```

**AWS/Docker:**
```dockerfile
ENV JWT_SECRET=your_production_secret_here
ENV JWT_REFRESH_SECRET=your_refresh_secret_here
```

**Vercel/Netlify:**
Add environment variables in dashboard settings.

### 2. **Security Checklist**
- [ ] Generated strong 256-bit secrets
- [ ] Different secrets for each environment
- [ ] Secrets not in source code
- [ ] .env file in .gitignore
- [ ] Production secrets stored securely
- [ ] Access to secrets restricted
- [ ] Secret rotation plan in place

## Example Complete Setup

### 1. **Generate Secrets**
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'));"
```

### 2. **Update .env File**
```env
JWT_SECRET=f8d7c6b5a4938271605948372819463728194637281946372819463728194637
JWT_REFRESH_SECRET=1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890
JWT_ACCESS_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d
```

### 3. **Test Your Setup**
```bash
npm start
# Check logs for any JWT-related errors
```

### 4. **Test Authentication**
```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890"}'

# Verify OTP and get tokens
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890","otp":"123456"}'
```

Your JWT secrets are now properly configured and your access tokens will last 24 hours as requested!