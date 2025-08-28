#!/usr/bin/env node

const db = require('../config/database');

async function inspectDatabase() {
    try {
        console.log('🔍 Inspecting JanusGraph Database...\n');
        
        // Connect to database
        await db.connect();
        console.log('✅ Connected to JanusGraph\n');

        // Get all vertex labels
        const vertexLabels = await db.g.V().label().dedup().toList();
        console.log('📋 VERTEX LABELS:');
        console.log('=================');
        vertexLabels.forEach(label => console.log(`- ${label}`));
        console.log('');

        // Get all edge labels
        const edgeLabels = await db.g.E().label().dedup().toList();
        console.log('📋 EDGE LABELS:');
        console.log('===============');
        edgeLabels.forEach(label => console.log(`- ${label}`));
        console.log('');

        // Get sample user with all properties
        const sampleUser = await db.g.V().hasLabel('User').limit(1).elementMap().toList();
        if (sampleUser.length > 0) {
            console.log('👤 SAMPLE USER PROPERTIES:');
            console.log('===========================');
            const user = sampleUser[0];
            Object.keys(user).forEach(key => {
                if (key !== 'id' && key !== 'label') {
                    console.log(`${key}: ${user[key]}`);
                }
            });
            console.log('');
        }

        // Get sample relationship with all properties
        const sampleRelationship = await db.g.E().hasLabel('Relationship').limit(1).elementMap().toList();
        if (sampleRelationship.length > 0) {
            console.log('💑 SAMPLE RELATIONSHIP PROPERTIES:');
            console.log('===================================');
            const rel = sampleRelationship[0];
            Object.keys(rel).forEach(key => {
                if (key !== 'id' && key !== 'label') {
                    console.log(`${key}: ${rel[key]}`);
                }
            });
            console.log('');
        }

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

        // Get all users with basic info
        const users = await db.g.V().hasLabel('User').elementMap().toList();
        console.log('👥 ALL USERS:');
        console.log('=============');
        
        users.forEach((user, index) => {
            const firstName = user.firstName || 'N/A';
            const lastName = user.lastName || 'N/A';
            const email = user.primaryEmail || 'N/A';
            const phone = user.primaryPhone || 'N/A';
            const isActive = user.isActive || false;
            
            console.log(`${index + 1}. ${firstName} ${lastName}`);
            console.log(`   📧 Email: ${email}`);
            console.log(`   📱 Phone: ${phone}`);
            console.log(`   ✅ Active: ${isActive}`);
            console.log('');
        });

        console.log('✨ Database inspection completed successfully!');

    } catch (error) {
        console.error('❌ Database inspection failed:', error);
        throw error;
    } finally {
        await db.disconnect();
    }
}

// Run inspection if called directly
if (require.main === module) {
    inspectDatabase()
        .then(() => {
            console.log('\n🎉 Database inspection finished!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Database inspection failed:', error);
            process.exit(1);
        });
}

module.exports = inspectDatabase;