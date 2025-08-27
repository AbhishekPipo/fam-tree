# Family Tree API - Example Requests and Responses

This document provides example requests and responses for the Family Tree API endpoints.

## Authentication Endpoints

### 1. Register New User

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0MDk2IiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDEwODE2MDB9.example",
  "user": {
    "id": "4096",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "phone": "+1234567890"
  }
}
```

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0MDk2IiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDEwODE2MDB9.example",
  "user": {
    "id": "4096",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "phone": "+1234567890"
  }
}
```

### 3. Get User Profile

**Endpoint:** `GET /api/auth/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "4096",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## System Endpoints

### 1. Health Check

**Endpoint:** `GET /health`

**Response (200 OK):**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. API Information

**Endpoint:** `GET /`

**Response (200 OK):**
```json
{
  "message": "Family Tree API Server",
  "version": "1.0.0",
  "endpoints": {
    "POST /api/auth/register": "Register new user",
    "POST /api/auth/login": "Login user (with optional OTP)",
    "GET /api/auth/profile": "Get user profile (requires token)",
    "GET /health": "Health check",
    "GET /api-docs": "API Documentation (Swagger)"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Email, password, and name are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid email or password"
}
```

### 404 Not Found
```json
{
  "error": "Endpoint not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!",
  "message": "Database connection failed"
}
```

## Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are valid for 24 hours after issuance.

## Environment Variables

The API requires the following environment variables:

- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret key for JWT token signing
- `STATIC_OTP`: Static OTP for additional security (default: 123456)
- Database connection variables for JanusGraph

## Rate Limiting

Currently, there are no rate limits implemented, but they may be added in future versions.
