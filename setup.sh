#!/bin/bash

echo "🌳 Setting up Family Tree Application..."

# Create project structure
mkdir -p config controllers middleware models routes utils
mkdir -p public/uploads

echo "📁 Creating project directories..."

# Initialize package.json
cat > package.json << 'EOF'
{
  "name": "family-tree-app",
  "version": "1.0.0",
  "description": "Complete Family Tree Application with PostgreSQL and Sequelize",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "setup-db": "node utils/setupDatabase.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.35.0",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": ["family-tree", "nodejs", "postgresql", "sequelize"],
  "author": "Your Name",
  "license": "MIT"
}
EOF

# Create .env file
cat > .env << 'EOF'
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
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.DS_Store
public/uploads/*
!public/uploads/.gitkeep
logs/
*.log
coverage/
.nyc_output/
dist/
build/
EOF

# Create gitkeep for uploads
touch public/uploads/.gitkeep

echo "✅ Project structure created successfully!"
echo "📦 Run 'npm install' to install dependencies"
echo "🗄️  Run 'npm run setup-db' to setup database and sample data"
echo "🚀 Run 'npm run dev' to start the development server"
