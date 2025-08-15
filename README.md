# Family Tree Neo4j Application

A comprehensive family tree management system built with **Neo4j graph database**, **Node.js**, and **Express**. This application provides dynamic relationship mapping, extended family trees, in-law relationships, and interactive graph visualization.

## 🌟 Features

### Core Functionality
- **Dynamic Family Tree Visualization** - Interactive graph-based family tree using Vis.js
- **Extended Family Support** - Ancestors, descendants, and adjacent family members
- **In-Law Relationships** - Complete in-law family tree integration
- **Dynamic Relationship Labels** - Automatic relationship calculation and labeling
- **Multi-generational Support** - Unlimited generations (great-great-grandparents, etc.)

### Relationship Types
- **Direct Relationships**: Spouses, partners
- **Blood Relationships**: Parents, children, siblings, grandparents, grandchildren
- **Extended Family**: Uncles, aunts, cousins, nephews, nieces
- **In-Law Relationships**: All in-law variations
- **Step/Half Relationships**: Step-parents, step-children, half-siblings
- **Adoption Support**: Adoptive relationships

### Technical Features
- **Neo4j Graph Database** - Optimized for relationship queries
- **RESTful API** - Complete CRUD operations
- **JWT Authentication** - Secure user authentication
- **Interactive UI** - Multiple layout options (hierarchical, force-directed, circular)
- **Real-time Updates** - Dynamic family tree updates
- **Comprehensive API Documentation** - Swagger/OpenAPI integration

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Neo4j Database** (v4.0 or higher)

### Neo4j Setup Options

#### Option 1: Neo4j Desktop (Recommended for Development)
1. Download [Neo4j Desktop](https://neo4j.com/download/)
2. Create a new project and database
3. Set password to `password` (or update `.env` file)
4. Start the database

#### Option 2: Neo4j Docker
```bash
docker run \
    --name neo4j-family-tree \
    -p7474:7474 -p7687:7687 \
    -d \
    -v $HOME/neo4j/data:/data \
    -v $HOME/neo4j/logs:/logs \
    -v $HOME/neo4j/import:/var/lib/neo4j/import \
    -v $HOME/neo4j/plugins:/plugins \
    --env NEO4J_AUTH=neo4j/password \
    neo4j:latest
```

#### Option 3: Neo4j Cloud (AuraDB)
1. Create account at [Neo4j Aura](https://neo4j.com/cloud/aura/)
2. Create a free database instance
3. Update `.env` with your connection details

### Installation

1. **Clone and Install Dependencies**
```bash
cd /Users/abhishek/Desktop/t-bag
npm install
```

2. **Configure Environment**
```bash
# Update .env file with your Neo4j credentials
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```

3. **Setup Database**
```bash
npm run setup-db
```

4. **Seed Sample Data**
```bash
npm run seed
```

5. **Start Application**
```bash
npm start
# or for development
npm run dev
```

6. **Access Application**
- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/api/health

## 👥 Sample Family Data

The application comes with pre-seeded family data:

### **Patel Family Tree**
```
👴 Ramesh Patel (1945) ↔ 👵 Mallika Patel (1950)
                    │
            👨 Prashanth Patel (1975) ↔ 👩 Anjali Patel (1978)
                    │
        ┌───────────┴───────────┐
    👧 Simran (2005)      👦 Arjun (2008)
        │                     │
    👶 Elina (2025)       👶 Rohan (2027)

👨 Suresh Patel (1948) - Uncle to Prashanth
```

### **Login Credentials**
- **Email**: `prashanth@family.com`
- **Password**: `FamilyTree123!`

All users have the same password: `FamilyTree123!`

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Family Tree
- `GET /api/family/tree` - Get basic family tree
- `GET /api/family/tree/extended` - Get extended family tree with in-laws
- `GET /api/family/tree/in-laws/:spouseId` - Get spouse's family tree
- `GET /api/family/members` - Get all family members
- `GET /api/family/relationship-types` - Get available relationship types
- `GET /api/family/stats` - Get family statistics

### Family Management
- `POST /api/family/member` - Add new family member
- `POST /api/family/spouse` - Add spouse
- `DELETE /api/family/member/:memberId` - Remove family member

### System
- `GET /api/health` - Health check

## 🎯 Usage Examples

### 1. Login and View Family Tree
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'prashanth@family.com',
    password: 'FamilyTree123!'
  })
});

const { token } = await response.json();

// Get family tree
const treeResponse = await fetch('/api/family/tree', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const familyTree = await treeResponse.json();
```

### 2. Add New Family Member
```javascript
const newMember = {
  firstName: 'New',
  lastName: 'Child',
  email: 'newchild@family.com',
  relationshipType: 'son',
  gender: 'male',
  dateOfBirth: '2010-05-15',
  location: 'Family Home'
};

const response = await fetch('/api/family/member', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(newMember)
});
```

### 3. Get Extended Family with In-Laws
```javascript
const extendedTree = await fetch('/api/family/tree/extended?includeInLaws=true', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🏗️ Architecture

### Database Schema (Neo4j)
```cypher
// Nodes
(:User {
  id: String,
  firstName: String,
  lastName: String,
  email: String,
  gender: String,
  dateOfBirth: Date,
  location: String,
  hasMedication: Boolean,
  medicationName: String,
  isDeceased: Boolean,
  createdAt: DateTime
})

// Relationships
(:User)-[:MARRIED_TO {type: String, createdAt: DateTime}]->(:User)
(:User)-[:PARENT_OF {type: String, createdAt: DateTime}]->(:User)
(:User)-[:CHILD_OF {type: String, createdAt: DateTime}]->(:User)
(:User)-[:SIBLING_OF {type: String, createdAt: DateTime}]->(:User)
(:User)-[:EXTENDED_FAMILY {type: String, createdAt: DateTime}]->(:User)
```

### Key Components
- **Neo4j Database**: Graph database for relationship storage
- **Express Server**: RESTful API server
- **JWT Authentication**: Secure token-based authentication
- **Vis.js**: Interactive graph visualization
- **Swagger**: API documentation

## 🔍 Graph Database Advantages

### Why Neo4j for Family Trees?
1. **Natural Relationship Modeling** - Graph structure matches family relationships
2. **Efficient Traversals** - Fast queries for finding relatives at any distance
3. **Dynamic Relationships** - Easy to add new relationship types
4. **Complex Queries** - Find all cousins, in-laws, or relatives within N degrees
5. **Scalability** - Handles large family trees efficiently
6. **Flexibility** - No rigid schema constraints

### Sample Cypher Queries
```cypher
// Find all descendants of a person
MATCH (person:User {id: $userId})-[:PARENT_OF*]->(descendant:User)
RETURN descendant

// Find all relatives within 3 degrees
MATCH (person:User {id: $userId})-[*1..3]-(relative:User)
RETURN DISTINCT relative

// Find all in-laws
MATCH (person:User {id: $userId})-[:MARRIED_TO]-(spouse:User)-[*1..2]-(inlaw:User)
WHERE inlaw.id <> person.id
RETURN inlaw
```

## 🛠️ Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run setup-db` - Setup database constraints and indexes
- `npm run seed` - Seed database with sample data
- `npm run reset-db` - Reset database (delete all data)

### Environment Variables
```env
PORT=3000
NODE_ENV=development

# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
```

### Project Structure
```
t-bag/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Authentication, validation, error handling
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Database utilities
├── public/              # Static files and frontend
├── server.js            # Main server file
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## 🚀 Deployment

### Production Checklist
1. **Environment Variables**
   - Set strong JWT secret
   - Configure production Neo4j instance
   - Set NODE_ENV=production

2. **Neo4j Production Setup**
   - Use Neo4j Aura or dedicated server
   - Enable authentication
   - Configure backup strategy

3. **Security**
   - Enable HTTPS
   - Configure CORS for production domains
   - Set up rate limiting
   - Enable request logging

4. **Monitoring**
   - Set up health checks
   - Monitor Neo4j performance
   - Log application errors

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**Neo4j Connection Failed**
- Ensure Neo4j is running on correct port (7687)
- Check username/password in .env file
- Verify firewall settings

**Authentication Errors**
- Check JWT_SECRET in .env
- Ensure token is included in Authorization header
- Verify user exists in database

**Family Tree Not Loading**
- Check browser console for errors
- Verify API endpoints are accessible
- Ensure user is authenticated

### Getting Help
- Check the [API Documentation](http://localhost:3000/api-docs)
- Review Neo4j logs for database issues
- Open an issue on GitHub

---

**Built with ❤️ using Neo4j Graph Database**