#!/usr/bin/env node

const db = require('../config/database');

async function viewDatabase() {
    try {
        console.log('👀 Viewing JanusGraph Database Data...\n');
        
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

        // Get all users with their properties
        console.log('👥 ALL USERS:');
        console.log('=============');
        
        const userVertices = await db.g.V().hasLabel('User').toList();
        
        for (let i = 0; i < userVertices.length; i++) {
            const vertex = userVertices[i];
            
            // Get properties for this vertex
            const firstName = await db.g.V(vertex.id).values('firstName').toList();
            const lastName = await db.g.V(vertex.id).values('lastName').toList();
            const primaryEmail = await db.g.V(vertex.id).values('primaryEmail').toList();
            const primaryPhone = await db.g.V(vertex.id).values('primaryPhone').toList();
            const isActive = await db.g.V(vertex.id).values('isActive').toList();
            const occupation = await db.g.V(vertex.id).values('occupation').toList();
            const dateOfBirth = await db.g.V(vertex.id).values('dateOfBirth').toList();
            const currentAddress = await db.g.V(vertex.id).values('currentAddress').toList();
            
            console.log(`${i + 1}. ${firstName[0] || 'N/A'} ${lastName[0] || 'N/A'}`);
            console.log(`   📧 Email: ${primaryEmail[0] || 'N/A'}`);
            console.log(`   📱 Phone: ${primaryPhone[0] || 'N/A'}`);
            console.log(`   💼 Occupation: ${occupation[0] || 'N/A'}`);
            console.log(`   🎂 DOB: ${dateOfBirth[0] || 'N/A'}`);
            console.log(`   🏠 Address: ${currentAddress[0] || 'N/A'}`);
            console.log(`   ✅ Active: ${isActive[0] || false}`);
            console.log('');
        }

        // Get all relationships
        console.log('💑 FAMILY RELATIONSHIPS:');
        console.log('========================');
        
        const relationships = await db.g.E().hasLabel('FAMILY_RELATIONSHIP').toList();
        
        for (let i = 0; i < relationships.length; i++) {
            const edge = relationships[i];
            
            // Get relationship properties
            const relType = await db.g.E(edge.id).values('relationshipType').toList();
            
            // Get source and target user names
            const sourceVertex = await db.g.E(edge.id).outV().next();
            const targetVertex = await db.g.E(edge.id).inV().next();
            
            const sourceFirstName = await db.g.V(sourceVertex.value.id).values('firstName').toList();
            const sourceLastName = await db.g.V(sourceVertex.value.id).values('lastName').toList();
            const targetFirstName = await db.g.V(targetVertex.value.id).values('firstName').toList();
            const targetLastName = await db.g.V(targetVertex.value.id).values('lastName').toList();
            
            const sourceFullName = `${sourceFirstName[0] || 'Unknown'} ${sourceLastName[0] || ''}`.trim();
            const targetFullName = `${targetFirstName[0] || 'Unknown'} ${targetLastName[0] || ''}`.trim();
            
            console.log(`${i + 1}. ${sourceFullName} → ${relType[0] || 'UNKNOWN'} → ${targetFullName}`);
        }
        console.log('');

        // Get all events
        console.log('📅 EVENTS:');
        console.log('==========');
        
        const eventVertices = await db.g.V().hasLabel('Event').toList();
        
        for (let i = 0; i < eventVertices.length; i++) {
            const vertex = eventVertices[i];
            
            const title = await db.g.V(vertex.id).values('title').toList();
            const eventType = await db.g.V(vertex.id).values('eventType').toList();
            const date = await db.g.V(vertex.id).values('date').toList();
            const description = await db.g.V(vertex.id).values('description').toList();
            
            console.log(`${i + 1}. ${title[0] || 'Untitled'} (${eventType[0] || 'Unknown Type'})`);
            console.log(`   📅 Date: ${date[0] || 'N/A'}`);
            console.log(`   📝 Description: ${description[0] ? description[0].substring(0, 100) + '...' : 'N/A'}`);
            console.log('');
        }

        // Get all posts
        console.log('📱 POSTS:');
        console.log('=========');
        
        const postVertices = await db.g.V().hasLabel('Post').toList();
        
        for (let i = 0; i < postVertices.length; i++) {
            const vertex = postVertices[i];
            
            const title = await db.g.V(vertex.id).values('title').toList();
            const content = await db.g.V(vertex.id).values('content').toList();
            const type = await db.g.V(vertex.id).values('type').toList();
            
            // Get author name
            const authorVertices = await db.g.V(vertex.id).in('AUTHORED').toList();
            let authorName = 'Unknown';
            if (authorVertices.length > 0) {
                const authorFirstName = await db.g.V(authorVertices[0].id).values('firstName').toList();
                const authorLastName = await db.g.V(authorVertices[0].id).values('lastName').toList();
                authorName = `${authorFirstName[0] || ''} ${authorLastName[0] || ''}`.trim();
            }
            
            console.log(`${i + 1}. ${title[0] || 'Untitled'} (${type[0] || 'Unknown Type'})`);
            console.log(`   👤 Author: ${authorName}`);
            console.log(`   📝 Content: ${content[0] ? content[0].substring(0, 100) + '...' : 'N/A'}`);
            console.log('');
        }

        console.log('✨ Database viewing completed successfully!');

    } catch (error) {
        console.error('❌ Database viewing failed:', error);
        throw error;
    } finally {
        await db.disconnect();
    }
}

// Run viewing if called directly
if (require.main === module) {
    viewDatabase()
        .then(() => {
            console.log('\n🎉 Database viewing finished!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Database viewing failed:', error);
            process.exit(1);
        });
}

module.exports = viewDatabase;