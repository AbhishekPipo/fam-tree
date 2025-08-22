# Phone Authentication with Profile Completion Flow

This document describes the updated authentication flow where users are created after OTP verification and can then complete their profile with additional details.

## Updated Authentication Flow

### 1. User Registration

**Endpoint:** `POST /api/auth/register`

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
  "message": "OTP sent to your phone number for registration",
  "data": {
    "phoneNumber": "+1234567890",
    "otpExpires": "2025-08-22T10:15:00.000Z",
    "registrationId": "uuid-here",
    "otp": "123456"
  }
}
```

**Note:** User is NOT created yet. Registration data is stored temporarily as `PendingRegistration`.

### 2. OTP Verification (Registration)

**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456",
  "isRegistration": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration completed successfully! Please complete your profile.",
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

**Note:** User is created in the database after successful OTP verification.

### 3. Complete Profile (New API)

**Endpoint:** `POST /api/auth/complete-profile`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "dateOfBirth": "1990-05-15",
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
      "isPhoneVerified": true,
      "hasCompletedProfile": true,
      "role": "member",
      "isActive": true
    }
  }
}
```

**Note:** This API sets `hasCompletedProfile` to `true` after adding additional details.

## Login Flow (Existing Users)

### 1. Initiate Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

### 2. Verify OTP (Login)

**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456",
  "isRegistration": false
}
```

## Key Changes

1. **Delayed User Creation**: Users are now created only after OTP verification, not during registration.

2. **Temporary Storage**: Registration data is stored in `PendingRegistration` nodes that expire after 24 hours.

3. **Profile Completion**: New dedicated API for completing user profile with additional details.

4. **Profile Status Tracking**: `hasCompletedProfile` field tracks whether the user has provided additional details.

5. **Cleanup Mechanism**: Expired pending registrations are automatically cleaned up.

## Database Schema Changes

### PendingRegistration Node
```
(:PendingRegistration {
  id: String,
  firstName: String,
  middleName: String?,
  lastName: String,
  phoneNumber: String,
  gender: String,
  dateOfBirth: Date?,
  phoneOtp: String,
  phoneOtpExpires: DateTime,
  phoneOtpAttempts: Number,
  createdAt: DateTime,
  expiresAt: DateTime
})
```

### Updated User Node
```
(:User:Person {
  // ... existing fields ...
  hasCompletedProfile: Boolean,
  location: String?,
  occupation: String?,
  employer: String?,
  biography: String?,
  address: Object?,
  preferences: Object?
})
```

## Testing

Run the test file to verify the complete flow:

```bash
node test-complete-profile.js
```

This will test:
1. User registration with OTP
2. OTP verification and user creation
3. Profile completion with additional details
4. Profile retrieval
5. Login flow for existing users

## Security Considerations

1. **OTP Expiry**: OTPs expire after 10 minutes
2. **Registration Expiry**: Pending registrations expire after 24 hours
3. **Attempt Limits**: Maximum 3 OTP attempts before requiring new OTP
4. **Token-based Authentication**: JWT tokens required for profile completion
5. **Rate Limiting**: Authentication endpoints are rate-limited

## API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Initiate registration with OTP | No |
| POST | `/api/auth/verify-otp` | Verify OTP (registration/login) | No |
| POST | `/api/auth/login` | Initiate login with OTP | No |
| POST | `/api/auth/resend-otp` | Resend OTP | No |
| POST | `/api/auth/complete-profile` | Complete user profile | Yes |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |
