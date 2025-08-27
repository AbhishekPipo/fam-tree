# Family Tree API Documentation

Welcome to the Family Tree API documentation. This directory contains comprehensive documentation for the API endpoints, schemas, and usage examples.

## Documentation Files

### 📚 API Documentation
- **[Swagger UI](../src/config/swagger.js)** - Interactive API documentation with live testing capabilities
- **[OpenAPI Specification](openapi.yaml)** - Complete API specification in OpenAPI 3.1.0 format
- **[API Examples](api-examples.md)** - Example requests and responses for all endpoints

### 🔗 Collections & Tools
- **[Postman Collection](Family-Tree-API.postman_collection.json)** - Import into Postman for easy API testing

## Quick Start

1. **Access Interactive Documentation**
   ```
   http://localhost:3000/api-docs
   ```

2. **API Base URL**
   ```
   http://localhost:3000
   ```

3. **Authentication**
   - Most endpoints require JWT authentication
   - Include token in Authorization header: `Bearer <token>`
   - Tokens are obtained via `/api/auth/login` endpoint

## Available Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login with optional OTP
- `GET /api/auth/profile` - Get user profile (requires auth)

### System Endpoints
- `GET /` - API information and endpoint list
- `GET /health` - Health check and server status
- `GET /api-docs` - Swagger UI documentation

## Features

- **JanusGraph Integration** - Uses JanusGraph for graph database operations
- **JWT Authentication** - Secure token-based authentication
- **OTP Support** - Optional OTP for additional security
- **Comprehensive Error Handling** - Detailed error responses
- **Interactive Documentation** - Swagger UI with live testing
- **Health Monitoring** - Built-in health check endpoints

## Testing the API

### Using Swagger UI
1. Start the server: `npm start`
2. Visit: http://localhost:3000/api-docs
3. Use the "Try it out" feature to test endpoints

### Using Postman
1. Import the [Postman collection](Family-Tree-API.postman_collection.json)
2. Set the `base_url` variable to `http://localhost:3000`
3. After login, set the `jwt_token` variable with the received token

### Using cURL
```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (replace <token> with actual JWT)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <token>"
```

## Error Handling

The API returns standardized error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (for registration)
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Environment Variables

Required environment variables:
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens
- `STATIC_OTP` - Static OTP value (default: 123456)

## Database Requirements

- **JanusGraph Server** running on `ws://localhost:8182/gremlin`
- Docker or standalone JanusGraph installation

For more information on setting up JanusGraph, see the main [README.md](../README.md).

## Contributing

When adding new endpoints:
1. Add Swagger JSDoc comments to route handlers
2. Update the OpenAPI specification
3. Add examples to the API examples document
4. Update the Postman collection
5. Test all documentation is working correctly

## Support

For issues or questions:
- Check the [GitHub repository](https://github.com/AbhishekPipo/fam-tree)
- Review the API examples and error responses
- Use the interactive Swagger documentation for testing
