// Global setup - runs once before all tests
const database = require('../src/config/database');

module.exports = async () => {
  console.log('🧪 Setting up test environment...');
  
  try {
    // Connect to test database
    await database.connect();
    console.log('✅ Test database connected');
    
    // Create test database constraints and indexes
    await setupTestDatabase();
    console.log('✅ Test database setup complete');
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    process.exit(1);
  }
};

async function setupTestDatabase() {
  // Create constraints
  const constraints = [
    'CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE',
    'CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
    'CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE',
    'CREATE CONSTRAINT family_tree_id_unique IF NOT EXISTS FOR (ft:FamilyTree) REQUIRE ft.id IS UNIQUE',
    'CREATE CONSTRAINT event_id_unique IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE',
    'CREATE CONSTRAINT media_id_unique IF NOT EXISTS FOR (m:Media) REQUIRE m.id IS UNIQUE'
  ];

  for (const constraint of constraints) {
    try {
      await database.runQuery(constraint);
    } catch (error) {
      // Constraint might already exist, ignore error
      if (!error.message.includes('already exists')) {
        console.warn('Warning creating constraint:', error.message);
      }
    }
  }

  // Create indexes
  const indexes = [
    'CREATE INDEX person_name_index IF NOT EXISTS FOR (p:Person) ON (p.firstName, p.lastName)',
    'CREATE INDEX person_email_index IF NOT EXISTS FOR (p:Person) ON (p.email)',
    'CREATE INDEX user_email_index IF NOT EXISTS FOR (u:User) ON (u.email)',
    'CREATE INDEX event_date_index IF NOT EXISTS FOR (e:Event) ON (e.date)',
    'CREATE INDEX event_type_index IF NOT EXISTS FOR (e:Event) ON (e.eventType)'
  ];

  for (const index of indexes) {
    try {
      await database.runQuery(index);
    } catch (error) {
      // Index might already exist, ignore error
      if (!error.message.includes('already exists')) {
        console.warn('Warning creating index:', error.message);
      }
    }
  }

  // Create full-text search indexes
  const fullTextIndexes = [
    `CREATE FULLTEXT INDEX person_search_index IF NOT EXISTS 
     FOR (p:Person) ON EACH [p.firstName, p.lastName, p.email, p.biography]`,
    `CREATE FULLTEXT INDEX event_search_index IF NOT EXISTS 
     FOR (e:Event) ON EACH [e.title, e.description]`
  ];

  for (const index of fullTextIndexes) {
    try {
      await database.runQuery(index);
    } catch (error) {
      // Index might already exist, ignore error
      if (!error.message.includes('already exists')) {
        console.warn('Warning creating full-text index:', error.message);
      }
    }
  }
}