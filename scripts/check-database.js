#!/usr/bin/env node

const db = require('../config/database');

async function checkDatabase() {
    try {
        console.log('🔍 Checking JanusGraph Database...\n');
        
        // Connect to database
        await db.connect();
        console.log('✅ Connected to JanusGraph\n');

        // Get basic statistics
        const stats = {
            totalUsers: await db.g.V().hasLabel('User').count().next(),
            totalRelationships: await db.g.E().hasLabel('Relationship').count().next(),
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

        // Get all users
        const users = await db.g.V().hasLabel('User').valueMap().toList();
        console.log('👥 USERS IN DATABASE:');
        console.log('=====================');
        
        users.forEach((user, index) => {
            const firstName = user.firstName ? user.firstName[0] : 'N/A';
            const lastName = user.lastName ? user.lastName[0] : 'N/A';
            const email = user.primaryEmail ? user.primaryEmail[0] : 'N/A';
            const phoneNumber = user.primaryPhone ? user.primaryPhone[0] : 'N/A';
            const isActive = user.isActive ? user.isActive[0] : false;
            
            console.log(`${index + 1}. ${firstName} ${lastName}`);
            console.log(`   📧 Email: ${email}`);
            console.log(`   📱 Phone: ${phoneNumber}`);
            console.log(`   ✅ Active: ${isActive}`);
            console.log('');
        });

        // Get relationship summary
        const relationships = await db.g.E().hasLabel('Relationship').valueMap().toList();
        console.log('💑 RELATIONSHIPS:');
        console.log('=================');
        
        const relationshipTypes = {};
        relationships.forEach(rel => {
            const type = rel.relationshipType ? rel.relationshipType[0] : 'Unknown';
            relationshipTypes[type] = (relationshipTypes[type] || 0) + 1;
        });

        Object.entries(relationshipTypes).forEach(([type, count]) => {
            console.log(`${type}: ${count} relationships`);
        });
        console.log('');

        // Get events summary
        const events = await db.g.V().hasLabel('Event').valueMap().toList();
        console.log('📅 EVENTS:');
        console.log('==========');
        
        events.forEach((event, index) => {
            const title = event.title ? event.title[0] : 'N/A';
            const eventType = event.eventType ? event.eventType[0] : 'N/A';
            const date = event.date ? event.date[0] : 'N/A';
            
            console.log(`${index + 1}. ${title} (${eventType})`);
            console.log(`   📅 Date: ${date}`);
            console.log('');
        });

        // Get posts summary
        const posts = await db.g.V().hasLabel('Post').valueMap().toList();
        console.log('📱 POSTS:');
        console.log('=========');
        
        posts.forEach((post, index) => {
            const title = post.title ? post.title[0] : 'Untitled';
            const type = post.type ? post.type[0] : 'N/A';
            const content = post.content ? post.content[0].substring(0, 50) + '...' : 'N/A';
            
            console.log(`${index + 1}. ${title} (${type})`);
            console.log(`   📝 Content: ${content}`);
            console.log('');
        });

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
    checkDatabase()
        .then(() => {
            console.log('\n🎉 Database check finished!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Database check failed:', error);
            process.exit(1);
        });
}

module.exports = checkDatabase;