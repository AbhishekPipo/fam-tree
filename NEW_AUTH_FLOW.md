# New Authentication Flow

This document explains the updated authentication flow as requested where users first verify their phone number, then register with basic details, and finally complete their profile.

## Flow Overview

```
1. Send OTP → 2. Verify OTP → 3. Register User → 4. Complete Profile
```

## Step-by-Step Process

### 1. Send OTP to Phone Number

**Endpoint:** `POST /api/auth/send-otp`

**Request:**
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
    "otpExpires": "2025-08-22T10:15:00.000Z",
    "verificationId": "uuid-here",
    "otp": "123456"
  }
}
```

**What happens:**
- System checks if user already exists with this phone number
- If not, generates 6-digit OTP
- Stores phone verification record in database
- Sends OTP to user's phone (currently logged for development)

### 2. Verify OTP

**Endpoint:** `POST /api/auth/verify-otp`

**Request:**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number verified successfully. You can now register.",
  "data": {
    "phoneNumber": "+1234567890",
    "isVerified": true,
    "verifiedAt": "2025-08-22T10:05:00.000Z"
  }
}
```

**What happens:**
- System validates the OTP against stored verification record
- Checks if OTP is not expired (10 minutes validity)
- Tracks failed attempts (max 3 attempts)
- Marks phone number as verified in database

### 3. Register User with Basic Details

**Endpoint:** `POST /api/auth/register`

**Request:**
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
  "message": "Registration successful! You can now complete your profile.",
  "data": {
    "user": {
      "id": "user-uuid",
      "firstName": "John",
      "middleName": "Michael",
      "lastName": "Doe",
      "phone": "+1234567890",
      "phoneNumber": "+1234567890",
      "gender": "male",
      "dateOfBirth": "1990-05-15",
      "isPhoneVerified": true,
      "hasCompletedProfile": false,
      "role": "member",
      "isActive": true
    },
    "token": "jwt-token-here",
    "requiresProfileCompletion": true
  }
}
```

**What happens:**
- System checks if phone number was previously verified
- Creates new user record in database with basic information
- Sets `hasCompletedProfile: false`
- Generates JWT token for authentication
- Cleans up phone verification record

### 4. Complete Profile (Optional Additional Details)

**Endpoint:** `POST /api/auth/complete-profile`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
```json
{
  "location": "New York, USA",
  "occupation": "Software Engineer",
  "employer": "Tech Corp Inc.",
  "biography": "A passionate software engineer with expertise in full-stack development.",
  "address": {
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10001"
  },
  "preferences": {
    "language": "en",
    "timezone": "America/New_York",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "privacy": {
      "showEmail": false,
      "showPhone": false,
      "showBirthDate": true
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile completed successfully",
  "data": {
    "user": {
      "id": "user-uuid",
      "firstName": "John",
      "middleName": "Michael",
      "lastName": "Doe",
      "phone": "+1234567890",
      "phoneNumber": "+1234567890",
      "gender": "male",
      "dateOfBirth": "1990-05-15",
      "location": "New York, USA",
      "occupation": "Software Engineer",
      "employer": "Tech Corp Inc.",
      "biography": "A passionate software engineer...",
      "address": {
        "street": "123 Main Street",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "postalCode": "10001"
      },
      "preferences": {
        "language": "en",
        "timezone": "America/New_York",
        "notifications": {
          "email": true,
          "push": true,
          "sms": false
        }
      },
      "hasCompletedProfile": true
    }
  }
}
```

**What happens:**
- System updates user record with additional profile information
- Sets `hasCompletedProfile: true`
- Returns updated user profile

## Database Schema

### PhoneVerification Node
```
PhoneVerification {
  phoneNumber: String,
  otp: String,
  otpExpires: DateTime,
  otpAttempts: Integer,
  verificationId: String,
  isVerified: Boolean,
  createdAt: DateTime,
  updatedAt: DateTime,
  verifiedAt: DateTime
}
```

### User Node (Updated)
```
User {
  id: String,
  firstName: String,
  middleName: String,
  lastName: String,
  phone: String,
  gender: String,
  dateOfBirth: Date,
  location: String,
  occupation: String,
  employer: String,
  biography: String,
  address: Object,
  preferences: Object,
  isPhoneVerified: Boolean,
  hasCompletedProfile: Boolean,
  role: String,
  isActive: Boolean,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

## Security Features

1. **OTP Expiration**: OTPs expire after 10 minutes
2. **Rate Limiting**: Maximum 3 OTP attempts before verification record is deleted
3. **Phone Verification Required**: Users cannot register without verified phone number
4. **JWT Authentication**: Secure token-based authentication for protected routes
5. **Data Cleanup**: Automatic cleanup of verification records after successful registration

## Error Handling

- **Phone Already Exists**: Returns 409 if user already registered with phone number
- **Phone Not Verified**: Returns 400 if attempting to register with unverified phone
- **Invalid OTP**: Returns 400 with attempt tracking
- **Expired OTP**: Returns 400 and cleans up verification record
- **Too Many Attempts**: Returns 400 and deletes verification record after 3 failed attempts

## Frontend Implementation Guide

```javascript
// 1. Send OTP
const sendOtp = async (phoneNumber) => {
  const response = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  });
  return response.json();
};

// 2. Verify OTP
const verifyOtp = async (phoneNumber, otp) => {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, otp })
  });
  return response.json();
};

// 3. Register User
const register = async (userDetails) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userDetails)
  });
  return response.json();
};

// 4. Complete Profile
const completeProfile = async (profileData, token) => {
  const response = await fetch('/api/auth/complete-profile', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  return response.json();
};
```

This new flow provides a clear separation of concerns and ensures that users can only register after proper phone verification, with the flexibility to complete their profile information at their own pace.
