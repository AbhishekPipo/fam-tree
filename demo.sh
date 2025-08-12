#!/bin/bash

echo "🌳 Complete Family Tree Application Demo"
echo "======================================="

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running on localhost:5432"
    echo "Please start PostgreSQL and ensure it's accessible with:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   User: postgres"
    echo "   Password: Test@123"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Create database if it doesn't exist
echo "🗄️  Setting up database..."
PGPASSWORD=Test@123 createdb -h localhost -U postgres family_tree_db 2>/dev/null || echo "Database already exists or created"

# Setup database with sample data
echo "📊 Setting up database schema and sample data..."
npm run setup-db

if [ $? -ne 0 ]; then
    echo "❌ Database setup failed"
    exit 1
fi

echo ""
echo "🚀 Starting the Family Tree API server..."
echo "   Server will start on: http://localhost:3000"
echo "   API Health Check: http://localhost:3000/api/health"
echo ""
echo "📝 Sample Login Credentials:"
echo "   Email: prashanth@family.com | Password: FamilyTree123!"
echo "   Email: anjali@family.com    | Password: FamilyTree123!"
echo "   Email: simran@family.com    | Password: FamilyTree123!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm run dev
