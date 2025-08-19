const database = require('../config/database');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up Neo4j database...');
    
    // Connect to database
    await database.connect();
    
    // Create constraints and indexes
    const constraints = [
      // Unique constraints
      'CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE',
      'CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE',
      'CREATE CONSTRAINT tree_id_unique IF NOT EXISTS FOR (t:FamilyTree) REQUIRE t.id IS UNIQUE',
      'CREATE CONSTRAINT event_id_unique IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE',
      'CREATE CONSTRAINT media_id_unique IF NOT EXISTS FOR (m:Media) REQUIRE m.id IS UNIQUE',

      // Existence constraints
      'CREATE CONSTRAINT person_name_exists IF NOT EXISTS FOR (p:Person) REQUIRE p.firstName IS NOT NULL',
      'CREATE CONSTRAINT person_gender_exists IF NOT EXISTS FOR (p:Person) REQUIRE p.gender IS NOT NULL'
    ];

    const indexes = [
      // Performance indexes
      'CREATE INDEX person_name_index IF NOT EXISTS FOR (p:Person) ON (p.firstName, p.lastName)',
      'CREATE INDEX person_birth_index IF NOT EXISTS FOR (p:Person) ON (p.dateOfBirth)',
      'CREATE INDEX person_gender_index IF NOT EXISTS FOR (p:Person) ON (p.gender)',
      'CREATE INDEX user_email_index IF NOT EXISTS FOR (u:User) ON (u.email)',
      'CREATE INDEX user_role_index IF NOT EXISTS FOR (u:User) ON (u.role)',
      'CREATE INDEX event_date_index IF NOT EXISTS FOR (e:Event) ON (e.date)',
      'CREATE INDEX event_type_index IF NOT EXISTS FOR (e:Event) ON (e.eventType)',
      'CREATE INDEX media_type_index IF NOT EXISTS FOR (m:Media) ON (m.mediaType)',
      'CREATE INDEX media_uploaded_index IF NOT EXISTS FOR (m:Media) ON (m.uploadedAt)',
      'CREATE INDEX tree_owner_index IF NOT EXISTS FOR (t:FamilyTree) ON (t.ownerId)',
      'CREATE INDEX tree_visibility_index IF NOT EXISTS FOR (t:FamilyTree) ON (t.visibility)'
    ];

    const fullTextIndexes = [
      // Full-text search indexes
      'CREATE FULLTEXT INDEX person_search_index IF NOT EXISTS FOR (p:Person) ON EACH [p.firstName, p.lastName, p.biography, p.notes]',
      'CREATE FULLTEXT INDEX event_search_index IF NOT EXISTS FOR (e:Event) ON EACH [e.title, e.description]'
    ];

    console.log('📋 Creating constraints...');
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

    console.log('📋 Creating indexes...');
    for (const index of indexes) {
      try {
        await database.runQuery(index);
        console.log(`✅ ${index.split(' ')[2]} created successfully`);
      } catch (error) {
        if (error.code === 'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists') {
          console.log(`ℹ️  ${index.split(' ')[2]} already exists`);
        } else {
          console.error(`❌ Error creating ${index.split(' ')[2]}:`, error.message);
        }
      }
    }

    console.log('📋 Creating full-text indexes...');
    for (const fullTextIndex of fullTextIndexes) {
      try {
        await database.runQuery(fullTextIndex);
        console.log(`✅ ${fullTextIndex.split(' ')[3]} created successfully`);
      } catch (error) {
        if (error.code === 'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists') {
          console.log(`ℹ️  ${fullTextIndex.split(' ')[3]} already exists`);
        } else {
          console.error(`❌ Error creating ${fullTextIndex.split(' ')[3]}:`, error.message);
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