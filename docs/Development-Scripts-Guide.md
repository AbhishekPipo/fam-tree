# Development Scripts Guide

## Overview

This document explains the available npm scripts for the Family Tree application and how to use them for development and production.

## Available Scripts

### Development Scripts (with auto-restart)

#### `npm start`
- **Command**: `nodemon server.js`
- **Purpose**: Main development command with auto-restart
- **Use**: Primary development server with hot reload
- **Auto-restarts**: When files change in `src/`, `config/`, `scripts/`, or `server.js`

```bash
npm start
```

#### `npm run dev`
- **Command**: `nodemon scripts/start-app.js`
- **Purpose**: Development with custom start script
- **Use**: Alternative development mode using the start-app script

```bash
npm run dev
```

#### `npm run dev:node`
- **Command**: `nodemon server.js`
- **Purpose**: Same as `npm start` (alias)
- **Use**: Direct server development

```bash
npm run dev:node
```

#### `npm run start:janusgraph`
- **Command**: `nodemon scripts/start-app.js janusgraph`
- **Purpose**: Development with JanusGraph initialization
- **Use**: When you need JanusGraph setup during development

```bash
npm run start:janusgraph
```

### Production Scripts (no auto-restart)

#### `npm run start:prod`
- **Command**: `node server.js`
- **Purpose**: Production server without auto-restart
- **Use**: Production deployment or when you don't want file watching

```bash
npm run start:prod
```

#### `npm run start:node`
- **Command**: `node server.js`
- **Purpose**: Basic Node.js server start
- **Use**: Simple server start without nodemon

```bash
npm run start:node
```

### Database Scripts

#### `npm run seed`
- **Command**: `node scripts/seed-database.js`
- **Purpose**: Seed the database with initial data
- **Use**: Initialize database with sample data

```bash
npm run seed
```

#### `npm run setup`
- **Command**: `npm run janusgraph:start && sleep 10 && npm run seed`
- **Purpose**: Complete setup (start JanusGraph + seed data)
- **Use**: First-time setup or reset

```bash
npm run setup
```

### JanusGraph Management Scripts

#### `npm run janusgraph:start`
- **Command**: `./scripts/start-janusgraph.sh start`
- **Purpose**: Start JanusGraph server
- **Use**: Start the graph database

```bash
npm run janusgraph:start
```

#### `npm run janusgraph:stop`
- **Command**: `./scripts/start-janusgraph.sh stop`
- **Purpose**: Stop JanusGraph server
- **Use**: Stop the graph database

```bash
npm run janusgraph:stop
```

#### `npm run janusgraph:restart`
- **Command**: `./scripts/start-janusgraph.sh restart`
- **Purpose**: Restart JanusGraph server
- **Use**: Restart the graph database

```bash
npm run janusgraph:restart
```

#### `npm run janusgraph:status`
- **Command**: `./scripts/start-janusgraph.sh status`
- **Purpose**: Check JanusGraph server status
- **Use**: Verify if JanusGraph is running

```bash
npm run janusgraph:status
```

#### `npm run janusgraph:logs`
- **Command**: `./scripts/start-janusgraph.sh logs`
- **Purpose**: View JanusGraph server logs
- **Use**: Debug JanusGraph issues

```bash
npm run janusgraph:logs
```

### Documentation Scripts

#### `npm run docs`
- **Command**: `echo 'API Documentation available at http://localhost:3000/api-docs'`
- **Purpose**: Display API documentation URL
- **Use**: Quick reminder of where to find API docs

```bash
npm run docs
```

## Nodemon Configuration

The project includes a `nodemon.json` configuration file with the following settings:

```json
{
  "watch": [
    "src/",
    "config/",
    "scripts/",
    "server.js"
  ],
  "ext": "js,json",
  "ignore": [
    "node_modules/",
    "docs/",
    "*.log",
    ".git/",
    ".env"
  ],
  "delay": 1000,
  "env": {
    "NODE_ENV": "development"
  },
  "verbose": true
}
```

### What Nodemon Watches:
- **`src/`**: All source code files
- **`config/`**: Configuration files
- **`scripts/`**: Custom scripts
- **`server.js`**: Main server file

### What Nodemon Ignores:
- **`node_modules/`**: Dependencies
- **`docs/`**: Documentation files
- **`*.log`**: Log files
- **`.git/`**: Git files
- **`.env`**: Environment files

## Recommended Development Workflow

### 1. **First Time Setup**
```bash
# Install dependencies
npm install

# Setup JanusGraph and seed data
npm run setup

# Start development server
npm start
```

### 2. **Daily Development**
```bash
# Start development server with auto-restart
npm start

# In another terminal, check JanusGraph status if needed
npm run janusgraph:status
```

### 3. **Production Testing**
```bash
# Test production mode locally
npm run start:prod
```

### 4. **Database Management**
```bash
# Start JanusGraph
npm run janusgraph:start

# Check status
npm run janusgraph:status

# View logs if issues
npm run janusgraph:logs

# Stop when done
npm run janusgraph:stop
```

## Development Features

### Auto-Restart
- **File Changes**: Server automatically restarts when you modify files
- **Fast Reload**: Quick restart for efficient development
- **Error Recovery**: Continues watching even after errors

### Console Output
```bash
$ npm start

> fam-tree@1.0.0 start
> nodemon server.js

[nodemon] 3.1.10
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): src/ config/ scripts/ server.js
[nodemon] watching extensions: js,json
[nodemon] starting `node server.js`
Server is running on port 3000
API Documentation: http://localhost:3000/api-docs
Health Check: http://localhost:3000/health
[nodemon] clean exit - waiting for changes before restart
```

### Manual Restart
- **Type `rs`** in the terminal to manually restart
- **Ctrl+C** to stop the server

## Troubleshooting

### Common Issues

#### 1. **Nodemon Not Found**
```bash
# Install nodemon globally (optional)
npm install -g nodemon

# Or use npx
npx nodemon server.js
```

#### 2. **Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

#### 3. **JanusGraph Connection Issues**
```bash
# Check JanusGraph status
npm run janusgraph:status

# Start JanusGraph if not running
npm run janusgraph:start

# Check logs for errors
npm run janusgraph:logs
```

#### 4. **File Watching Issues**
```bash
# Increase file watch limit (macOS/Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# Restart nodemon
npm start
```

## Environment Variables

Make sure your `.env` file is properly configured:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JanusGraph Configuration
JANUS_HOST=localhost
JANUS_PORT=8182
JANUS_PATH=/gremlin

# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# OTP Configuration
STATIC_OTP=123456
```

## Performance Tips

1. **Use `npm start`** for development (auto-restart)
2. **Use `npm run start:prod`** for production testing
3. **Keep nodemon.json** optimized for your project structure
4. **Exclude unnecessary files** from watching to improve performance
5. **Use specific scripts** for different scenarios (JanusGraph, seeding, etc.)

Your development environment is now optimized with nodemon for efficient development with automatic server restarts!