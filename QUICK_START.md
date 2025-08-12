# 🚀 Family Tree Application - Quick Start Guide

## 📋 Prerequisites

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
3. **Git** (optional) - For version control

## ⚡ Quick Setup (5 minutes)

### Step 1: Database Setup
1. Start PostgreSQL service on your machine
2. Create a PostgreSQL user `postgres` with password `Test@123` (or update `.env` file with your credentials)
3. Ensure PostgreSQL is running on `localhost:5432`

### Step 2: Application Setup
```bash
# Clone or extract the project
cd family-tree-app

# Install dependencies
npm install

# Setup database and sample data
npm run setup-db

# Start the development server
npm run dev
```

### Step 3: Test the Application
- **API Server**: http://localhost:3000
- **Web Interface**: http://localhost:3000 (Interactive API tester)
- **Health Check**: http://localhost:3000/api/health

## 🔑 Sample Login Credentials

Use these pre-created accounts to test the application:

| Email | Password | Role |
|-------|----------|------|
| prashanth@family.com | FamilyTree123! | Father (Main user) |
| anjali@family.com | FamilyTree123! | Mother |
| simran@family.com | FamilyTree123! | Daughter |
| ramesh@family.com | FamilyTree123! | Grandfather |

## 🌳 Family Tree Structure

The sample data includes this family structure:

```
Ramesh (grandfather) ↔ Mallika (grandmother)
       ↓
Prashanth (father) ↔ Anjali (mother)
       ↓                    ↓
   Simran (daughter)    Arjun (son)
       ↓                    ↓
   Elina (granddaughter) Rohan (grandson)
```

## 🔧 API Testing Options

### Option 1: Web Interface (Recommended)
- Visit http://localhost:3000
- Use the interactive web interface to test all API endpoints
- Login with sample credentials and explore the family tree

### Option 2: Postman Collection
- Import `postman-collection.json` into Postman
- Set the `baseUrl` variable to `http://localhost:3000`
- Run the requests in sequence (login first to get auth token)

### Option 3: Command Line
```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prashanth@family.com","password":"FamilyTree123!"}'

# Get family tree (replace TOKEN with the token from login response)
curl -X GET http://localhost:3000/api/family/tree \
  -H "Authorization: Bearer TOKEN"
```

### Option 4: Automated Test Script
```bash
# Run automated API tests
npm run test-api
```

## 📝 API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - User logout

### Family Tree
- `GET /api/family/tree` - Get complete family tree
- `GET /api/family/members` - Get all family members
- `POST /api/family/member` - Add new family member
- `DELETE /api/family/member/:id` - Remove family member

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=family_tree_db
DB_USER=postgres
DB_PASSWORD=Test@123

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

## 🏗️ Project Architecture

### Key Features
- ✅ **Optimized Database Design**: Separate direct/indirect relationships
- ✅ **Dynamic Relationship Labels**: Change based on user perspective
- ✅ **Parent Chain Tracking**: Clear generational hierarchy
- ✅ **JWT Authentication**: Secure user sessions
- ✅ **Comprehensive Validation**: Input sanitization and validation
- ✅ **Error Handling**: Detailed error messages and logging
- ✅ **Interactive Testing**: Web interface for API testing

### Database Schema
- **Users**: Complete user profiles with medical info
- **DirectRelationship**: Spouses/partners only
- **IndirectRelationship**: All family relationships with levels

### Relationship Logic
- **Positive levels**: Ancestors (1=parent, 2=grandparent)
- **Negative levels**: Descendants (-1=child, -2=grandchild)
- **Zero level**: Same generation (siblings, cousins)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure PostgreSQL is running
   - Check credentials in `.env` file
   - Verify port 5432 is accessible

2. **Port 3000 Already in Use**
   - Stop other Node.js applications
   - Change PORT in `.env` file
   - Use `lsof -i :3000` to find processes

3. **JWT Token Expired**
   - Login again to get a new token
   - Check JWT_EXPIRES_IN setting

4. **Module Not Found**
   - Run `npm install` to install dependencies
   - Check Node.js version (requires v14+)

### Reset Database
```bash
# Drop and recreate database with fresh sample data
npm run setup-db
```

## 📊 Testing Results

When you login as **Prashanth** (`prashanth@family.com`), you should see:

```json
{
  "currentUser": "Prashanth Patel",
  "ancestors": [
    "Ramesh Patel (father)",
    "Mallika Patel (mother)"
  ],
  "descendants": [
    "Simran Patel (daughter)",
    "Arjun Patel (son)",
    "Elina Patel (granddaughter) via Simran",
    "Rohan Patel (grandson) via Arjun"
  ],
  "adjacent": [
    "Anjali Patel (wife)"
  ],
  "totalMembers": 7
}
```

## 🎯 Next Steps

1. **Add More Family Members**: Use the API or web interface
2. **Extend Relationships**: Add cousins, uncles, aunts
3. **Photo Upload**: Implement profile picture functionality
4. **Timeline**: Add family events and milestones
5. **Export**: Generate family tree visualizations

## 📞 Support

- Check the `README.md` for detailed documentation
- Review API responses for error messages
- Enable debug logging by setting `NODE_ENV=development`

## 🎉 Success!

If you can see the family tree data when logging in as any sample user, your Family Tree Application is working perfectly!

**Happy Family Tree Building! 🌳👨‍👩‍👧‍👦**
