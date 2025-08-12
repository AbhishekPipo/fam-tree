# 🌳 Family Tree Application

A comprehensive Node.js family tree application with PostgreSQL and Sequelize that manages complex family relationships with optimized database design.

## ⚡ Quick Start (60 seconds)

```bash
# 1. Ensure PostgreSQL is running with user 'postgres' and password 'Test@123'
# 2. Run the auto-setup script
./auto-setup.sh

# 3. Start the server  
npm run dev

# 4. Open your browser
# Web Interface: http://localhost:3000
# API Documentation: http://localhost:3000/api-docs
# Health Check: http://localhost:3000/api/health
```

## 🔑 Test Login Credentials

| Email | Password | Role |
|-------|----------|------|
| prashanth@family.com | FamilyTree123! | Father |
| anjali@family.com | FamilyTree123! | Mother |
| simran@family.com | FamilyTree123! | Daughter |
| ramesh@family.com | FamilyTree123! | Grandfather |

## 🌳 Sample Family Tree Structure

When you login as **Prashanth**, you'll see this family perspective:

```
Ramesh (grandfather) ↔ Mallika (grandmother)  [ANCESTORS]
       ↓
Prashanth (YOU) ↔ Anjali (wife)  [ADJACENT]
       ↓                    ↓
   Simran (daughter)    Arjun (son)  [DESCENDANTS]
       ↓                    ↓
   Elina (granddaughter) Rohan (grandson)  [DESCENDANTS]
```

## ✨ Key Features Implemented

- ✅ **Optimized Database Design**: Separate direct/indirect relationships  
- ✅ **Dynamic Relationship Labels**: Change based on user perspective
- ✅ **Parent Chain Tracking**: Clear generational hierarchy
- ✅ **JWT Authentication**: Secure user sessions
- ✅ **Interactive Web Interface**: Test all features in browser
- ✅ **Swagger API Documentation**: Complete OpenAPI 3.0 specification
- ✅ **RESTful API**: Complete CRUD operations
- ✅ **Comprehensive Validation**: Input sanitization
- ✅ **Sample Data**: 4-generation family tree

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Family Tree Logic](#-family-tree-logic)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [Sample Data](#-sample-data)
- [Project Structure](#-project-structure)

## ✨ Features

- **Complete Family Tree Management**: Handle complex family relationships with proper hierarchy
- **JWT Authentication**: Secure user registration, login, and session management
- **Optimized Database Design**: Separate direct and indirect relationships for better performance
- **Dynamic Relationship Labels**: Labels change based on logged-in user's perspective
- **Parent Chain Tracking**: Clear parent-child connections for multi-generational families
- **Medical Information**: Track family members' medication and health details
- **Profile Management**: Comprehensive user profile with location, status tracking
- **RESTful API**: Well-structured API endpoints with proper validation

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Password Hashing**: bcryptjs
- **Development**: nodemon for hot reloading

## 🗄️ Database Schema

### Users Table
```sql
- id (Primary Key)
- firstName, middleName, lastName
- email (Unique)
- password (Hashed)
- dateOfBirth, gender, location
- profilePicture
- hasMedication, medicationName, medicationFrequency, medicationTime
- isOnline, isDeceased, staysWithUser
- fatherId, motherId (Foreign Keys to Users)
```

### DirectRelationship Table
```sql
- id (Primary Key)
- userId, relatedUserId (Foreign Keys to Users)
- relationshipType (husband/wife/partner)
```

### IndirectRelationship Table
```sql
- id (Primary Key)
- userId, relatedUserId (Foreign Keys to Users)
- relationshipLevel (Integer: +ve for ancestors, -ve for descendants, 0 for same generation)
- relationshipType (father, mother, son, daughter, etc.)
```

## 🌳 Family Tree Logic

### Relationship Levels
- **Positive Numbers**: Ancestors (1=parent, 2=grandparent, 3=great-grandparent)
- **Negative Numbers**: Descendants (-1=child, -2=grandchild, -3=great-grandchild)
- **Zero**: Same generation (siblings, cousins)

### API Response Structure
When a user logs in, the family tree is organized as:
```json
{
  "currentUser": { /* User details */ },
  "ancestors": [
    { "user": {...}, "relationship": "father", "level": 1 }
  ],
  "descendants": [
    { 
      "user": {...}, 
      "relationship": "granddaughter", 
      "level": 2,
      "parentInfo": {
        "directParent": { "id": 6, "name": "Simran", "relationship": "daughter" }
      }
    }
  ],
  "adjacent": [
    { "user": {...}, "relationship": "wife", "level": 0 }
  ],
  "totalMembers": 7
}
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Setup Steps

1. **Clone and Setup Project**
   ```bash
   git clone <repository-url>
   cd family-tree-app
   
   # Make setup script executable
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Ensure PostgreSQL is running
   - Create database with user `postgres` and password `Test@123`
   - Run database setup:
   ```bash
   npm run setup-db
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 🔌 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "gender": "male",
  "dateOfBirth": "1990-01-15"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "prashanth@family.com",
  "password": "FamilyTree123!"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "firstName": "Updated Name",
  "location": "New Location",
  "hasMedication": true,
  "medicationName": "Daily Vitamin"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <jwt-token>
```

### Family Endpoints

#### Get Family Tree
```http
GET /api/family/tree
Authorization: Bearer <jwt-token>
```

#### Get All Family Members
```http
GET /api/family/members
Authorization: Bearer <jwt-token>
```

#### Add Family Member
```http
POST /api/family/member
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "firstName": "New",
  "lastName": "Member",
  "email": "newmember@family.com",
  "gender": "female",
  "relationshipType": "daughter",
  "dateOfBirth": "2010-05-20"
}
```

#### Remove Family Member
```http
DELETE /api/family/member/:memberId
Authorization: Bearer <jwt-token>
```

## 👨‍👩‍👧‍👦 Sample Data

The setup includes a complete family tree:

```
Ramesh (grandfather) ↔ Mallika (grandmother)
       ↓
Prashanth (father) ↔ Anjali (mother)
       ↓                    ↓
   Simran (daughter)    Arjun (son)
       ↓                    ↓
   Elina (granddaughter) Rohan (grandson)
```

### Sample Login Credentials
- **Email**: prashanth@family.com | **Password**: FamilyTree123!
- **Email**: anjali@family.com | **Password**: FamilyTree123!
- **Email**: simran@family.com | **Password**: FamilyTree123!
- **Email**: ramesh@family.com | **Password**: FamilyTree123!

## 📁 Project Structure

```
family-tree-app/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── familyController.js  # Family tree logic
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── errorHandler.js      # Error handling
│   └── validation.js        # Input validation
├── models/
│   ├── User.js              # User model
│   ├── DirectRelationship.js   # Spouse relationships
│   ├── IndirectRelationship.js # Family relationships
│   └── index.js             # Model associations
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   └── familyRoutes.js      # Family routes
├── utils/
│   └── setupDatabase.js     # Database setup with sample data
├── public/
│   └── uploads/             # File uploads directory
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
├── package.json            # Project dependencies
├── server.js               # Main application file
├── setup.sh                # Setup script
└── README.md               # Project documentation
```

## 🔧 Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=family_tree_db
DB_USER=postgres
DB_PASSWORD=Test@123

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Login and Get Family Tree
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prashanth@family.com","password":"FamilyTree123!"}'

# Use the returned token to get family tree
curl -X GET http://localhost:3000/api/family/tree \
  -H "Authorization: Bearer <your-jwt-token>"
```

## 🚨 Error Handling

The application includes comprehensive error handling for:
- Validation errors
- Authentication failures
- Database constraint violations
- Relationship logic errors
- Server errors

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- SQL injection prevention through Sequelize ORM
- Environment variable configuration

## 🎯 Key Implementation Highlights

1. **Bidirectional Relationships**: All relationships are stored bidirectionally for efficient querying
2. **Level-Based Hierarchy**: Clear generational levels make family tree traversal efficient
3. **Parent Chain Tracking**: Direct parent-child connections maintained through fatherId/motherId
4. **Dynamic Relationship Labels**: Labels adapt based on user's perspective
5. **Optimized Database Design**: Separate tables for direct vs indirect relationships

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please create an issue in the repository.

---

Built with ❤️ using Node.js, PostgreSQL, and Sequelize
# fam-tree
