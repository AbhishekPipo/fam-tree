const db = require('./config/database');

async function getUserIds() {
    try {
        await db.connect();
        console.log('📋 User IDs for API calls:');
        console.log('==========================\n');
        
        const userVertices = await db.g.V().hasLabel('User').toList();
        
        for (let i = 0; i < userVertices.length; i++) {
            const vertex = userVertices[i];
            const firstName = await db.g.V(vertex.id).values('firstName').toList();
            const lastName = await db.g.V(vertex.id).values('lastName').toList();
            
            console.log(`${i + 1}. ${firstName[0]} ${lastName[0]}`);
            console.log(`   ID: ${vertex.id}`);
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.disconnect();
    }
}

getUserIds();