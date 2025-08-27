# Family Tree API

A simple Node.js API for user registration and login with JanusGraph database integration.

## Prerequisites

1. **JanusGraph Server**: You need to have JanusGraph running locally
   - Download JanusGraph from: https://janusgraph.org/
   - Extract and start with: `bin/janusgraph-server.sh start`
   - Default connection: `ws://localhost:8182/gremlin`

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env` file and update if needed
   - Default JanusGraph connection: localhost:8182
   - Static OTP is set to: 123456

3. **Start JanusGraph:**
   ```bash
   # Download JanusGraph if you haven't
   # Extract to a directory and run:
   bin/janusgraph-server.sh start
   ```

4. **Start the API server:**
   ```bash
   npm start
   ```

## API Documentation

The API includes comprehensive Swagger documentation that provides:
- Interactive API explorer
- Detailed endpoint descriptions
- Request/response schemas
- Authentication requirements
- Example requests and responses

### Access API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api-docs
- **API Info**: http://localhost:3000/
- **Health Check**: http://localhost:3000/health

The Swagger documentation includes:
- Complete API reference
- Interactive request testing
- Schema definitions
- Authentication examples
- Error response documentation

## API Endpoints

### POST /api/auth/register
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

### POST /api/auth/login
Login user (OTP is optional)
```json
{
  "email": "john@example.com",
  "password": "password123",
  "otp": "123456"
}
```

### GET /api/auth/profile
Get user profile (requires Authorization header)
```
Authorization: Bearer <jwt_token>
```

## Testing

Use tools like Postman or curl to test the endpoints:

```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","otp":"123456"}'
```