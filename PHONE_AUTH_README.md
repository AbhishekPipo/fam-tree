# Phone Number Authentication

This document describes the phone number authentication system implemented in the Family Tree application.

## Overview

The phone authentication system allows users to register and login using their phone numbers with OTP (One-Time Password) verification. This provides an alternative to email-based authentication and is particularly useful for users who prefer phone-based verification.

## Features

- **Phone Registration**: Register new users with phone number and basic information
- **OTP Verification**: Secure 6-digit OTP verification system
- **Phone Login**: Login existing users using phone number
- **OTP Resend**: Resend OTP functionality with rate limiting
- **Static OTP**: Currently uses static OTP (123456) for development
- **Security**: Built-in attempt limiting and OTP expiration

## API Endpoints

### 1. Phone Registration
```http
POST /api/auth/phone/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "middleName": "Michael",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "gender": "male",
  "dateOfBirth": "1990-05-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your phone number",
  "data": {
    "phoneNumber": "+1234567890",
    "otpExpires": "2024-01-15T10:15:00.000Z",
    "otp": "123456"
  }
}
```

### 2. Phone Login
```http
POST /api/auth/phone/login
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your phone number",
  "data": {
    "phoneNumber": "+1234567890",
    "otpExpires": "2024-01-15T10:15:00.000Z",
    "otp": "123456"
  }
}
```

### 3. Verify OTP
```http
POST /api/auth/phone/verify-otp
```

**Request Body (Registration):**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456",
  "password": "SecurePass123!",
  "isRegistration": true
}
```

**Request Body (Login):**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456",
  "isRegistration": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+1234567890",
      "isPhoneVerified": true,
      "role": "member"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Resend OTP
```http
POST /api/auth/phone/resend-otp
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP resent to your phone number",
  "data": {
    "phoneNumber": "+1234567890",
    "otpExpires": "2024-01-15T10:15:00.000Z",
    "otp": "123456"
  }
}
```

## Authentication Flow

### Registration Flow
1. **Submit Registration**: User provides basic information and phone number
2. **OTP Generation**: System generates and "sends" OTP (currently static: 123456)
3. **OTP Verification**: User enters OTP and sets password
4. **Account Creation**: User account is created and verified
5. **Login Token**: JWT token is issued for immediate access

### Login Flow
1. **Submit Phone Number**: User provides phone number
2. **OTP Generation**: System generates and "sends" OTP to registered phone
3. **OTP Verification**: User enters OTP
4. **Authentication**: User is authenticated and receives JWT token

## Security Features

### OTP Security
- **Expiration**: OTP expires after 10 minutes
- **Attempt Limiting**: Maximum 3 attempts per OTP
- **Auto-Clear**: OTP is cleared after successful verification or max attempts
- **Static OTP**: Currently uses "123456" for development (to be replaced with dynamic generation)

### Rate Limiting
- All authentication endpoints are protected by rate limiting
- Prevents brute force attacks and spam

### Data Validation
- Phone number format validation
- Required field validation
- Password strength requirements (for registration)

## Database Schema

### User Model Extensions
The User model has been extended with the following phone authentication fields:

```javascript
{
  phoneNumber: String,           // User's phone number
  isPhoneVerified: Boolean,      // Phone verification status
  phoneOtp: String,              // Current OTP (hashed in production)
  phoneOtpExpires: Date,         // OTP expiration timestamp
  phoneOtpAttempts: Number       // Number of OTP attempts
}
```

## Testing

### Manual Testing
Use the provided test script:
```bash
node test-phone-auth.js
```

### Test Cases Covered
- ✅ Phone registration with OTP
- ✅ OTP verification and password setting
- ✅ Phone login with OTP
- ✅ OTP resend functionality
- ✅ Duplicate phone number rejection
- ✅ Invalid OTP handling
- ✅ Non-existent phone number handling

## Future Enhancements

### SMS Integration
Replace static OTP with real SMS service integration:
- **AWS SNS**: Amazon Simple Notification Service
- **Twilio**: SMS API service
- **Firebase**: Google's messaging service

### Dynamic OTP Generation
```javascript
// Example for future implementation
generatePhoneOtp() {
  this.phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
  this.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  this.phoneOtpAttempts = 0;
  return this.phoneOtp;
}
```

### Enhanced Security
- OTP hashing before storage
- Phone number verification via carrier lookup
- Fraud detection and prevention
- Multi-factor authentication options

## Configuration

### Environment Variables
Add these to your `.env` file:
```env
# Phone Authentication
PHONE_OTP_EXPIRY_MINUTES=10
PHONE_OTP_MAX_ATTEMPTS=3
PHONE_OTP_STATIC=123456

# SMS Service (for future use)
SMS_SERVICE_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## Error Codes

| Code | Description |
|------|-------------|
| `USER_EXISTS` | Phone number already registered |
| `USER_NOT_FOUND` | Phone number not found |
| `INVALID_OTP` | OTP is invalid or expired |
| `TOO_MANY_ATTEMPTS` | Maximum OTP attempts exceeded |
| `VALIDATION_ERROR` | Request validation failed |

## Usage Examples

### Frontend Integration
```javascript
// Registration
const registerResponse = await fetch('/api/auth/phone/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
    gender: 'male'
  })
});

// OTP Verification
const verifyResponse = await fetch('/api/auth/phone/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+1234567890',
    otp: '123456',
    password: 'SecurePass123!',
    isRegistration: true
  })
});
```

### cURL Examples
```bash
# Register with phone
curl -X POST http://localhost:3000/api/auth/phone/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "gender": "male"
  }'

# Verify OTP
curl -X POST http://localhost:3000/api/auth/phone/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "otp": "123456",
    "password": "SecurePass123!",
    "isRegistration": true
  }'
```

## Notes

- **Development Mode**: The `otp` field is included in responses when `NODE_ENV=development`
- **Production Ready**: Remove OTP from responses and implement real SMS service
- **Phone Format**: Supports international phone number formats with country codes
- **Backward Compatibility**: Email authentication continues to work alongside phone authentication