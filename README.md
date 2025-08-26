# Family Tree Application - JanusGraph Edition

A modern family tree application built with JanusGraph and MSG91 OTP authentication.

## Features

- 📱 SMS OTP Authentication via MSG91
- 🌐 JanusGraph-powered family tree storage
- 👨‍👩‍👧‍👦 Family relationship management
- 🔐 JWT-based authentication
- 🚀 RESTful API design
- ⚡ Real-time relationship queries

## Technology Stack

- **Database**: JanusGraph (Graph Database)
- **Backend**: Node.js, Express.js
- **Authentication**: MSG91 OTP + JWT
- **Graph Queries**: Gremlin
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v16 or higher)
- JanusGraph instance running (localhost:8182 by default)
- MSG91 account for OTP services

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fam-tree
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

```
# JanusGraph Configuration
JANUSGRAPH_HOST=localhost
JANUSGRAPH_PORT=8182
JANUSGRAPH_USERNAME=
JANUSGRAPH_PASSWORD=

# MSG91 Configuration
MSG91_API_KEY=your_msg91_api_key_here
MSG91_TEMPLATE_ID=your_template_id_here
MSG91_AUTH_KEY=your_auth_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# OTP Configuration
OTP_EXPIRY_MINUTES=10
MAX_OTP_ATTEMPTS=3
```

## API Endpoints

### Authentication

- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `POST /api/auth/resend-otp` - Resend OTP
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `POST /api/auth/logout` - Logout (protected)

### Health Check

- `GET /health` - Server health status

## Usage Examples

### 1. Send OTP
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

### 2. Verify OTP and Register/Login
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "otp": "123456",
    "userData": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }'
```

### 3. Get Profile (Protected Route)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Structure

```
src/
├── config/
│   └── database.js          # JanusGraph connection
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   └── auth.js             # JWT authentication middleware
├── models/
│   └── User.js             # User model for JanusGraph
├── routes/
│   └── authRoutes.js       # Authentication routes
├── services/
│   └── otpService.js       # MSG91 OTP service
└── utils/                  # Utility functions
```

## Development Mode

In development mode (NODE_ENV=development), the OTP service will:
- Log OTPs to console instead of sending SMS
- Accept any OTP for testing purposes
- Provide detailed error messages

## Graph Schema

The application uses the following JanusGraph schema:

### Vertex Labels
- `user` - Represents family members
- `family` - Represents family groups

### Edge Labels
- `parentOf` - Parent-child relationships
- `childOf` - Child-parent relationships  
- `spouseOf` - Spouse relationships
- `siblingOf` - Sibling relationships
- `memberOf` - Family group membership

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License