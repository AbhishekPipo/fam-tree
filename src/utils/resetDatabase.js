const database = require('../config/database');

async function resetDatabase() {
  try {
    console.log('🗑️  Resetting Neo4j database...');
    
    // Connect to database
    await database.connect();
    
    // Delete all nodes and relationships
    console.log('🧹 Deleting all existing data...');
    await database.runQuery('MATCH (n) DETACH DELETE n');
    
    console.log('✅ Database reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  } finally {
    await database.close();
  }
}

// Run reset if called directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('🎉 Database reset finished!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database reset failed:', error);
      process.exit(1);
    });
}

module.exports = resetDatabase;