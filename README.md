# Family Tree Neo4j Application

A comprehensive genealogy platform built with Node.js, Express.js, and Neo4j graph database. This application enables users to create, manage, and explore complex family relationships with advanced features like DNA tracking, event management, media organization, and collaborative tree building.

## 🚀 Features

### Core Features
- **Advanced Relationship Modeling** - Handle complex family scenarios with graph database
- **Real-time Collaboration** - Multi-user tree management
- **Privacy-First Design** - Granular field-level privacy controls
- **Scalable Architecture** - Supports 10,000+ person family trees
- **Production-Ready** - Comprehensive validation and error handling

### Advanced Features
- **DNA Integration** - Track DNA matches and relationships
- **GEDCOM Import/Export** - Standard genealogy file format support
- **Advanced Search** - Full-text search with relationship path finding
- **Media Management** - Photo and document organization
- **Event Tracking** - Life events with timeline views
- **Relationship Suggestions** - AI-powered relationship discovery

## 🏗️ Technology Stack

### Backend
- **Runtime**: Node.js 18.x
- **Framework**: Express.js 4.x
- **Database**: Neo4j AuraDB 5.x
- **Authentication**: JWT + Bcrypt
- **Validation**: Joi 17.x
- **Documentation**: Swagger/OpenAPI 3.x
- **File Upload**: Multer
- **Logging**: Winston
- **Security**: Helmet, Rate Limiting

### Development & Testing
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier
- **Process Manager**: PM2 (production)

## 📋 Prerequisites

- Node.js 18.x or higher
- Neo4j AuraDB account or local Neo4j instance
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fam-tree
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Neo4j Database
   NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your-password
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   npm run setup-db
   ```

5. **Seed Sample Data** (Optional)
   ```bash
   npm run seed
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run setup-db` - Setup database constraints and indexes
- `npm run seed` - Seed database with sample data
- `npm run reset-db` - Reset database (⚠️ Deletes all data)
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## 📚 API Documentation

Once the server is running, visit:
- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/api/health

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

#### Family Management
- `GET /api/family/trees` - Get user's family trees
- `POST /api/family/trees` - Create family tree
- `GET /api/family/trees/:id` - Get family tree details
- `PUT /api/family/trees/:id` - Update family tree
- `DELETE /api/family/trees/:id` - Delete family tree

#### Person Management
- `GET /api/family/persons` - Get persons
- `POST /api/family/persons` - Create person
- `GET /api/family/persons/:id` - Get person details
- `PUT /api/family/persons/:id` - Update person
- `DELETE /api/family/persons/:id` - Delete person

#### Relationships
- `POST /api/family/relationships` - Create relationship
- `GET /api/family/persons/:id/relationships` - Get person's relationships
- `DELETE /api/family/relationships/:id` - Delete relationship

#### Advanced Search
- `GET /api/search` - Advanced search
- `GET /api/search/suggestions` - Search suggestions
- `GET /api/search/relationship-path` - Find relationship paths
- `GET /api/search/relationship-suggestions/:personId` - Get relationship suggestions

#### DNA Features
- `POST /api/dna/:personId` - Add DNA data
- `GET /api/dna/:personId` - Get DNA data
- `GET /api/dna/:personId/matches` - Find DNA matches
- `POST /api/dna/matches` - Add DNA match
- `GET /api/dna/:personId/analysis` - DNA analysis
- `GET /api/dna/:personId/report` - Generate DNA report

#### GEDCOM Import/Export
- `POST /api/gedcom/import` - Import GEDCOM file
- `GET /api/gedcom/export/:treeId` - Export to GEDCOM
- `POST /api/gedcom/validate` - Validate GEDCOM file
- `POST /api/gedcom/preview` - Preview GEDCOM contents

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── setup.js              # Test setup and utilities
├── globalSetup.js         # Global test setup
├── globalTeardown.js      # Global test cleanup
├── models/               # Model tests
│   ├── Person.test.js
│   ├── User.test.js
│   └── FamilyTree.test.js
├── routes/               # Route tests
│   ├── auth.test.js
│   └── family.test.js
└── services/             # Service tests
    ├── searchService.test.js
    └── dnaService.test.js
```

## 🔒 Security Features

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Comprehensive data validation
- **Data Sanitization**: Protection against injection attacks
- **Security Headers**: Helmet.js security headers
- **Privacy Controls**: Granular field-level privacy settings

## 📊 Database Schema

### Core Entities
- **Person** - Individual family members with 60+ properties
- **User** - System users extending Person
- **FamilyTree** - Family tree containers
- **Event** - Life events and milestones
- **Media** - Photos, documents, and files
- **DNA** - DNA test results and matches

### Relationship Types
- Blood relationships: `PARENT_OF`, `CHILD_OF`, `SIBLING_OF`, `GRANDPARENT_OF`, etc.
- Marriage relationships: `MARRIED_TO`, `DIVORCED_FROM`, `ENGAGED_TO`
- System relationships: `OWNS`, `MEMBER_OF`, `BELONGS_TO`

## 🚀 Deployment

### Environment Variables
```env
# Production Environment
NODE_ENV=production
PORT=3000

# Database
NEO4J_URI=neo4j+s://production-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=secure-production-password

# Security
JWT_SECRET=super-secure-production-jwt-secret
```

### Using PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start server.js --name "family-tree-api"

# Monitor
pm2 monit

# View logs
pm2 logs family-tree-api
```

## 📈 Performance

### Current Capabilities
- **Database**: Supports 10,000+ person trees
- **Relationships**: Manages complex multi-generational families
- **Search**: Full-text search across all entities
- **Concurrency**: Multi-user collaboration support
- **Storage**: Unlimited media file support

### Optimization Features
- Database indexing for fast queries
- Relationship path caching
- File upload optimization
- Query result pagination
- Connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Follow semantic versioning

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Quick Start
1. Setup database: `npm run setup-db`
2. Seed with sample data: `npm run seed`
3. Visit API docs: http://localhost:3000/api-docs
4. Test login with: `prashanth@family.com` / `FamilyTree123!`

### Common Issues

**Database Connection Issues**
- Verify Neo4j credentials in `.env`
- Check network connectivity to Neo4j instance
- Ensure database is running

**Authentication Issues**
- Check JWT_SECRET in environment variables
- Verify token expiration settings
- Clear browser cache/cookies

**File Upload Issues**
- Check upload directory permissions
- Verify file size limits
- Ensure supported file types

### Getting Help
- Check the API documentation at `/api-docs`
- Review test files for usage examples
- Check logs in `logs/` directory

## 🔄 Changelog

### Version 1.0.0
- Initial release with core functionality
- Person and relationship management
- Family tree creation and management
- Authentication and authorization
- Advanced search capabilities
- DNA integration features
- GEDCOM import/export
- Comprehensive test suite
- Production-ready security features

---

**Built with ❤️ for preserving family history and connections**