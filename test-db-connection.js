require('dotenv').config();
const database = require('./src/config/database');

async function testDatabase() {
  console.log('Testing Neo4j connection...');
  try {
    await database.connect();
    console.log('✅ Database connection successful');
    
    const result = await database.runQuery('RETURN 1 as test');
    console.log('✅ Database query successful:', result);
    
    await database.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testDatabase();
