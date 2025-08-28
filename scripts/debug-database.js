#!/usr/bin/env node

const db = require('../config/database');

async function debugDatabase() {
    try {
        console.log('🐛 Debugging JanusGraph Database...\n');
        
        // Connect to database
        await db.connect();
        console.log('✅ Connected to JanusGraph\n');

        // Get first user using different methods
        console.log('🔍 Testing different query methods:\n');

        // Method 1: valueMap()
        console.log('1. Using valueMap():');
        const userValueMap = await db.g.V().hasLabel('User').limit(1).valueMap().toList();
        console.log('Result:', JSON.stringify(userValueMap, null, 2));
        console.log('');

        // Method 2: elementMap()
        console.log('2. Using elementMap():');
        const userElementMap = await db.g.V().hasLabel('User').limit(1).elementMap().toList();
        console.log('Result:', JSON.stringify(userElementMap, null, 2));
        console.log('');

        // Method 3: properties()
        console.log('3. Using properties():');
        const userProperties = await db.g.V().hasLabel('User').limit(1).properties().toList();
        console.log('Result:', JSON.stringify(userProperties, null, 2));
        console.log('');

        // Method 4: values()
        console.log('4. Using values() for specific properties:');
        try {
            const firstName = await db.g.V().hasLabel('User').limit(1).values('firstName').toList();
            console.log('firstName:', firstName);
            
            const primaryEmail = await db.g.V().hasLabel('User').limit(1).values('primaryEmail').toList();
            console.log('primaryEmail:', primaryEmail);
        } catch (error) {
            console.log('Error getting values:', error.message);
        }
        console.log('');

        // Method 5: Check if vertices exist at all
        console.log('5. Basic vertex count:');
        const totalVertices = await db.g.V().count().next();
        console.log('Total vertices:', totalVertices.value);
        
        const userVertices = await db.g.V().hasLabel('User').count().next();
        console.log('User vertices:', userVertices.value);
        console.log('');

        // Method 6: Get vertex IDs
        console.log('6. User vertex IDs:');
        const userIds = await db.g.V().hasLabel('User').id().toList();
        console.log('User IDs:', userIds);
        console.log('');

        console.log('✨ Database debugging completed!');

    } catch (error) {
        console.error('❌ Database debugging failed:', error);
        throw error;
    } finally {
        await db.disconnect();
    }
}

// Run debugging if called directly
if (require.main === module) {
    debugDatabase()
        .then(() => {
            console.log('\n🎉 Database debugging finished!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Database debugging failed:', error);
            process.exit(1);
        });
}

module.exports = debugDatabase;