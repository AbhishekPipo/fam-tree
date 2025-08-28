# JanusGraph Gremlin Terminal Guide

## Overview
This guide explains how to access and use the Gremlin terminal to query your JanusGraph database directly for the fam-tree project.

## Prerequisites
- JanusGraph must be running
- Docker must be installed and running
- The fam-tree project should be set up

## Step 1: Check JanusGraph Status

Before accessing the Gremlin terminal, ensure JanusGraph is running:

```bash
npm run janusgraph:status
```

Expected output:
```
NAMES                STATUS          PORTS
janusgraph-default   Up XX minutes   0.0.0.0:8182->8182/tcp [::]:8182->8182/tcp

[JanusGraph] JanusGraph is running and accessible at ws://localhost:8182/gremlin
```

## Step 2: Start JanusGraph (if not running)

If JanusGraph is not running, start it:

```bash
npm run janusgraph:start
```

Wait for it to fully start (usually takes 30-60 seconds).

## Step 3: Access Gremlin Terminal

### Method 1: Docker Exec (Recommended)
```bash
docker exec -it janusgraph-default ./bin/gremlin.sh
```

### Method 2: Alternative Docker Command
```bash
docker exec -it janusgraph-default /opt/janusgraph/bin/gremlin.sh
```

### Method 3: If container name is different
First find the container name:
```bash
docker ps | grep janusgraph
```

Then use the actual container name:
```bash
docker exec -it <container-name> ./bin/gremlin.sh
```

## Step 4: Connect to Graph Database

Once in the Gremlin console, you'll see:
```
         \,,,/
         (o o)
-----oOOo-(3)-oOOo-----
plugin activated: janusgraph.imports
gremlin>
```

Connect to your graph:
```gremlin
:remote connect tinkerpop.server conf/remote.yaml
:remote console
```

You should see:
```
==>Configured localhost/127.0.0.1:8182
==>All scripts will now be sent to Gremlin Server - [localhost/127.0.0.1:8182] - type ':remote console' to return to local mode
```

## Step 5: Basic Queries

### Count all vertices and edges
```gremlin
g.V().count()
g.E().count()
```

### View all users
```gremlin
g.V().hasLabel('User').valueMap()
```

### Get user names, phones, and IDs
```gremlin
g.V().hasLabel('User').project('name', 'phone', 'id').by(values('fullName')).by(values('primaryPhone')).by(id())
```

### View all relationships
```gremlin
g.E().hasLabel('FAMILY_RELATIONSHIP').valueMap()
```

### See relationship structure
```gremlin
g.E().hasLabel('FAMILY_RELATIONSHIP').project('from', 'relationship', 'to').by(outV().values('firstName')).by(values('relationshipType')).by(inV().values('firstName'))
```

## Common Gremlin Commands

### Data Exploration
```gremlin
# Get all vertex labels
g.V().label().dedup()

# Get all edge labels  
g.E().label().dedup()

# Count by label
g.V().groupCount().by(label())

# Find specific user
g.V().hasLabel('User').has('firstName', 'Prashanth').valueMap()

# Get user's relationships
g.V().hasLabel('User').has('firstName', 'Prashanth').bothE('FAMILY_RELATIONSHIP').valueMap()
```

### Useful Queries for Family Tree
```gremlin
# Get all married couples
g.E().hasLabel('FAMILY_RELATIONSHIP').has('relationshipType', 'MARRIED_TO').project('husband', 'wife').by(outV().values('fullName')).by(inV().values('fullName'))

# Get all parent-child relationships
g.E().hasLabel('FAMILY_RELATIONSHIP').has('relationshipType', within('FATHER_OF', 'MOTHER_OF')).project('parent', 'child').by(outV().values('fullName')).by(inV().values('fullName'))

# Get family members by city
g.V().hasLabel('User').has('currentAddress', containing('Mumbai')).values('fullName')

# Get users by occupation
g.V().hasLabel('User').groupCount().by(values('occupation'))
```

## Exiting the Terminal

To exit the Gremlin console:
```gremlin
:exit
```

Or use `Ctrl+C` to force exit.

## Troubleshooting

### Issue: "No such container"
**Solution:** Check if JanusGraph is running:
```bash
docker ps | grep janusgraph
npm run janusgraph:status
```

### Issue: "Connection refused"
**Solution:** Restart JanusGraph:
```bash
npm run janusgraph:restart
```

### Issue: "Remote connection failed"
**Solution:** Try connecting again:
```gremlin
:remote connect tinkerpop.server conf/remote.yaml
:remote console
```

### Issue: Gremlin console not found
**Solution:** Try the full path:
```bash
docker exec -it janusgraph-default /opt/janusgraph/bin/gremlin.sh
```

## Alternative Methods

### Using Project Scripts
The project includes several scripts for database inspection:

```bash
# View all data with formatting
node scripts/view-database.js

# Simple database check
node scripts/simple-db-check.js

# Inspect database structure
node scripts/inspect-database.js

# Debug database connection
node scripts/debug-database.js
```

### Web Interface
Start the application to use the web interface:
```bash
npm start
```
Then visit `http://localhost:3000`

## JanusGraph Management Commands

```bash
# Start JanusGraph
npm run janusgraph:start

# Stop JanusGraph
npm run janusgraph:stop

# Restart JanusGraph
npm run janusgraph:restart

# Check status
npm run janusgraph:status

# View logs
npm run janusgraph:logs
```

## Notes

- The Gremlin terminal provides direct access to your graph database
- All changes made through Gremlin are permanent
- Use `limit()` for large datasets to avoid overwhelming output
- The graph traversal object `g` is automatically available after connecting
- JanusGraph uses Gremlin 3.x syntax

## Security Note

The Gremlin terminal has full access to your database. Be careful with:
- `drop()` commands (they delete data permanently)
- Bulk operations without `limit()`
- Schema modifications

Always test queries on a small dataset first using `limit(5)` or similar.