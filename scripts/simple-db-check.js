#!/usr/bin/env node

const db = require('../config/database');

async function simpleDbCheck() {
    try {
        console.log('📋 Simple Database Check...\n');
        
        // Connect to database
        await db.connect();
        console.log('✅ Connected to JanusGraph\n');

        // Get basic statistics
        const stats = {
            totalUsers: await db.g.V().hasLabel('User').count().next(),
            totalRelationships: await db.g.E().hasLabel('FAMILY_RELATIONSHIP').count().next(),
            totalEvents: await db.g.V().hasLabel('Event').count().next(),
            totalPosts: await db.g.V().hasLabel('Post').count().next(),
            totalMedia: await db.g.V().hasLabel('Media').count().next()
        };

        console.log('📊 DATABASE STATISTICS:');
        console.log('========================');
        console.log(`👥 Users: ${stats.totalUsers.value}`);
        console.log(`💑 Relationships: ${stats.totalRelationships.value}`);
        console.log(`📅 Events: ${stats.totalEvents.value}`);
        console.log(`📱 Posts: ${stats.totalPosts.value}`);
        console.log(`📸 Media: ${stats.totalMedia.value}\n`);

        // Get all users with basic info
        console.log('👥 ALL USERS:');
        console.log('=============');
        
        const userVertices = await db.g.V().hasLabel('User').toList();
        
        for (let i = 0; i < userVertices.length; i++) {
            const vertex = userVertices[i];
            
            const firstName = await db.g.V(vertex.id).values('firstName').toList();
            const lastName = await db.g.V(vertex.id).values('lastName').toList();
            const primaryEmail = await db.g.V(vertex.id).values('primaryEmail').toList();
            const occupation = await db.g.V(vertex.id).values('occupation').toList();
            const dateOfBirth = await db.g.V(vertex.id).values('dateOfBirth').toList();
            
            console.log(`${i + 1}. ${firstName[0] || 'N/A'} ${lastName[0] || 'N/A'}`);
            console.log(`   📧 Email: ${primaryEmail[0] || 'N/A'}`);
            console.log(`   💼 Occupation: ${occupation[0] || 'N/A'}`);
            console.log(`   🎂 DOB: ${dateOfBirth[0] || 'N/A'}`);
            console.log('');
        }

        // Get relationship count by type
        console.log('💑 RELATIONSHIP SUMMARY:');
        console.log('========================');
        
        const relationshipTypes = await db.g.E().hasLabel('FAMILY_RELATIONSHIP').values('relationshipType').toList();
        const typeCounts = {};
        
        relationshipTypes.forEach(type => {
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        Object.entries(typeCounts).forEach(([type, count]) => {
            console.log(`${type}: ${count} relationships`);
        });
        console.log('');

        // Get events summary
        console.log('📅 EVENTS SUMMARY:');
        console.log('==================');
        
        const eventVertices = await db.g.V().hasLabel('Event').toList();
        
        for (let i = 0; i < eventVertices.length; i++) {
            const vertex = eventVertices[i];
            
            const title = await db.g.V(vertex.id).values('title').toList();
            const eventType = await db.g.V(vertex.id).values('eventType').toList();
            const date = await db.g.V(vertex.id).values('date').toList();
            
            console.log(`${i + 1}. ${title[0] || 'Untitled'} (${eventType[0] || 'Unknown Type'})`);
            console.log(`   📅 Date: ${date[0] || 'N/A'}`);
            console.log('');
        }

        // Get posts summary
        console.log('📱 POSTS SUMMARY:');
        console.log('=================');
        
        const postVertices = await db.g.V().hasLabel('Post').toList();
        
        for (let i = 0; i < postVertices.length; i++) {
            const vertex = postVertices[i];
            
            const title = await db.g.V(vertex.id).values('title').toList();
            const type = await db.g.V(vertex.id).values('type').toList();
            const content = await db.g.V(vertex.id).values('content').toList();
            
            console.log(`${i + 1}. ${title[0] || 'Untitled'} (${type[0] || 'Unknown Type'})`);
            console.log(`   📝 Content: ${content[0] ? content[0].substring(0, 80) + '...' : 'N/A'}`);
            console.log('');
        }

        console.log('✨ Database check completed successfully!');

    } catch (error) {
        console.error('❌ Database check failed:', error);
        throw error;
    } finally {
        await db.disconnect();
    }
}

// Run check if called directly
if (require.main === module) {
    simpleDbCheck()
        .then(() => {
            console.log('\n🎉 Database check finished!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Database check failed:', error);
            process.exit(1);
        });
}

module.exports = simpleDbCheck;