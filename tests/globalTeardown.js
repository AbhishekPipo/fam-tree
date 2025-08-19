// Global teardown - runs once after all tests
const database = require('../src/config/database');

module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Clean up test data
    await cleanupTestData();
    console.log('✅ Test data cleaned up');
    
    // Close database connection
    await database.close();
    console.log('✅ Test database connection closed');
    
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
  }
};

async function cleanupTestData() {
  // Delete all test data (be careful with this in production!)
  const cleanupQueries = [
    // Delete all relationships first
    'MATCH ()-[r]-() DELETE r',
    
    // Delete all nodes
    'MATCH (n) DELETE n'
  ];

  // Only run cleanup if we're in test environment
  if (process.env.NODE_ENV === 'test') {
    for (const query of cleanupQueries) {
      try {
        await database.runQuery(query);
      } catch (error) {
        console.warn('Warning during cleanup:', error.message);
      }
    }
  }
}