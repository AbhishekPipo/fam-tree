const database = require('../config/database');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up Neo4j database...');
    
    // Connect to database
    await database.connect();
    
    // Create constraints and indexes
    const constraints = [
      // User constraints
      'CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE',
      'CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE',
      
      // Indexes for better performance
      'CREATE INDEX user_name_index IF NOT EXISTS FOR (u:User) ON (u.firstName, u.lastName)',
      'CREATE INDEX user_gender_index IF NOT EXISTS FOR (u:User) ON (u.gender)',
      'CREATE INDEX user_created_index IF NOT EXISTS FOR (u:User) ON (u.createdAt)'
    ];

    console.log('📋 Creating constraints and indexes...');
    for (const constraint of constraints) {
      try {
        await database.runQuery(constraint);
        console.log(`✅ ${constraint.split(' ')[1]} created successfully`);
      } catch (error) {
        if (error.code === 'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists') {
          console.log(`ℹ️  ${constraint.split(' ')[1]} already exists`);
        } else {
          console.error(`❌ Error creating ${constraint.split(' ')[1]}:`, error.message);
        }
      }
    }

    console.log('✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await database.close();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Database setup finished!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase;