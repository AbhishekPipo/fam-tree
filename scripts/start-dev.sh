#!/bin/bash

echo "🚀 Starting Family Tree Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Neo4j is running
neo4j_running() {
    if command_exists neo4j; then
        neo4j status >/dev/null 2>&1
        return $?
    else
        return 1
    fi
}

echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if Neo4j is installed
if ! command_exists neo4j; then
    echo -e "${RED}❌ Neo4j is not installed${NC}"
    echo -e "${YELLOW}💡 Installing Neo4j via Homebrew...${NC}"
    
    if command_exists brew; then
        brew install neo4j
    else
        echo -e "${RED}❌ Homebrew is not installed. Please install Neo4j manually.${NC}"
        echo "Visit: https://neo4j.com/download/"
        exit 1
    fi
fi

# Check if Neo4j is running
if ! neo4j_running; then
    echo -e "${YELLOW}⚠️  Neo4j is not running. Starting Neo4j...${NC}"
    neo4j start
    
    # Wait for Neo4j to start
    echo -e "${BLUE}⏳ Waiting for Neo4j to start...${NC}"
    sleep 10
    
    if ! neo4j_running; then
        echo -e "${RED}❌ Failed to start Neo4j${NC}"
        echo -e "${YELLOW}💡 Try running manually: neo4j start${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Neo4j is running${NC}"

# Setup database schema
echo -e "${BLUE}🔧 Setting up database schema...${NC}"
node scripts/setup-neo4j.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database setup completed${NC}"
else
    echo -e "${RED}❌ Database setup failed${NC}"
    echo -e "${YELLOW}💡 You may need to change the default Neo4j password${NC}"
    echo -e "${YELLOW}   1. Open Neo4j Browser: http://localhost:7474${NC}"
    echo -e "${YELLOW}   2. Login with username: neo4j, password: neo4j${NC}"
    echo -e "${YELLOW}   3. Change password to 'password' or update .env file${NC}"
    exit 1
fi

# Start the application
echo -e "${BLUE}🚀 Starting the application...${NC}"
npm start