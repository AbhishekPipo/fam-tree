#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌳 Family Tree Application - Complete Auto Setup${NC}"
echo "================================================="
echo ""

# Function to print status
print_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# Check if Node.js is installed
echo -e "${YELLOW}🔍 Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js is installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v14+ from https://nodejs.org/${NC}"
    exit 1
fi

# Check if PostgreSQL is installed and running
echo -e "${YELLOW}🔍 Checking PostgreSQL...${NC}"
if command -v pg_isready &> /dev/null; then
    if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is running on localhost:5432${NC}"
    else
        echo -e "${RED}❌ PostgreSQL is not running. Please start PostgreSQL service.${NC}"
        echo -e "${YELLOW}On macOS: brew services start postgresql${NC}"
        echo -e "${YELLOW}On Linux: sudo systemctl start postgresql${NC}"
        echo -e "${YELLOW}On Windows: Start PostgreSQL from Services or pgAdmin${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ PostgreSQL is not installed. Please install PostgreSQL from https://www.postgresql.org/${NC}"
    exit 1
fi

# Create database
echo -e "${YELLOW}🗄️  Creating database...${NC}"
PGPASSWORD=Test@123 createdb -h localhost -U postgres family_tree_db 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database 'family_tree_db' created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Database may already exist (this is okay)${NC}"
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
npm install > /dev/null 2>&1
print_status "Dependencies installed"

# Setup database with sample data
echo -e "${YELLOW}📊 Setting up database schema and sample data...${NC}"
npm run setup-db
print_status "Database setup completed"

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 What's been created:${NC}"
echo "   • Complete family tree database with sample data"
echo "   • 8 family members across 4 generations"  
echo "   • All relationship mappings (direct and indirect)"
echo "   • JWT authentication system"
echo "   • RESTful API with validation"
echo "   • Interactive web interface"
echo ""
echo -e "${BLUE}🔑 Sample login credentials:${NC}"
echo "   Email: prashanth@family.com | Password: FamilyTree123!"
echo "   Email: anjali@family.com    | Password: FamilyTree123!"
echo "   Email: simran@family.com    | Password: FamilyTree123!"
echo "   Email: ramesh@family.com    | Password: FamilyTree123!"
echo ""
echo -e "${BLUE}🌐 How to access:${NC}"
echo "   1. Start server: ${YELLOW}npm run dev${NC}"
echo "   2. Open browser: ${YELLOW}http://localhost:3000${NC}"
echo "   3. Use the web interface to test all features"
echo "   4. Or test API directly: ${YELLOW}http://localhost:3000/api/health${NC}"
echo ""
echo -e "${BLUE}🧪 Testing options:${NC}"
echo "   • Web Interface: http://localhost:3000 (recommended)"
echo "   • Postman: Import postman-collection.json"
echo "   • Command line: npm run test-api"
echo "   • Manual: curl commands in README.md"
echo ""
echo -e "${GREEN}Ready to start! Run: ${YELLOW}npm run dev${NC}"
