#!/usr/bin/env node

const neo4j = require('neo4j-driver');
require('dotenv').config();

async function setupNeo4j() {
  console.log('🚀 Setting up Neo4j database...');
  
  const driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      process.env.NEO4J_USERNAME || 'neo4j',
      process.env.NEO4J_PASSWORD || 'password'
    )
  );

  try {
    // Test connection
    console.log('📡 Testing Neo4j connection...');
    await driver.verifyConnectivity();
    console.log('✅ Neo4j connection successful!');

    const session = driver.session();

    try {
      // Create constraints
      console.log('🔧 Creating database constraints...');
      
      const constraints = [
        'CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE',
        'CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE',
        'CREATE CONSTRAINT tree_id_unique IF NOT EXISTS FOR (t:FamilyTree) REQUIRE t.id IS UNIQUE',
        'CREATE CONSTRAINT event_id_unique IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE',
        'CREATE CONSTRAINT media_id_unique IF NOT EXISTS FOR (m:Media) REQUIRE m.id IS UNIQUE'
      ];

      for (const constraint of constraints) {
        try {
          await session.run(constraint);
          console.log(`✅ Created constraint: ${constraint.split(' ')[2]}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`ℹ️  Constraint already exists: ${constraint.split(' ')[2]}`);
          } else {
            console.error(`❌ Error creating constraint: ${error.message}`);
          }
        }
      }

      // Create indexes
      console.log('📊 Creating database indexes...');
      
      const indexes = [
        'CREATE INDEX person_name_index IF NOT EXISTS FOR (p:Person) ON (p.firstName, p.lastName)',
        'CREATE INDEX person_birth_index IF NOT EXISTS FOR (p:Person) ON (p.dateOfBirth)',
        'CREATE INDEX user_email_index IF NOT EXISTS FOR (u:User) ON (u.email)',
        'CREATE INDEX event_date_index IF NOT EXISTS FOR (e:Event) ON (e.date)',
        'CREATE INDEX media_type_index IF NOT EXISTS FOR (m:Media) ON (m.mediaType)'
      ];

      for (const index of indexes) {
        try {
          await session.run(index);
          console.log(`✅ Created index: ${index.split(' ')[2]}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`ℹ️  Index already exists: ${index.split(' ')[2]}`);
          } else {
            console.error(`❌ Error creating index: ${error.message}`);
          }
        }
      }

      // Create full-text search indexes
      console.log('🔍 Creating full-text search indexes...');
      
      const fullTextIndexes = [
        "CREATE FULLTEXT INDEX person_search_index IF NOT EXISTS FOR (p:Person) ON EACH [p.firstName, p.lastName, p.biography, p.notes]",
        "CREATE FULLTEXT INDEX event_search_index IF NOT EXISTS FOR (e:Event) ON EACH [e.title, e.description]"
      ];

      for (const index of fullTextIndexes) {
        try {
          await session.run(index);
          console.log(`✅ Created full-text index: ${index.split(' ')[3]}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`ℹ️  Full-text index already exists: ${index.split(' ')[3]}`);
          } else {
            console.error(`❌ Error creating full-text index: ${error.message}`);
          }
        }
      }

      // Check database status
      console.log('📈 Checking database status...');
      const result = await session.run(`
        CALL db.labels() YIELD label
        RETURN count(label) as labelCount
      `);
      
      const labelCount = result.records[0].get('labelCount').toNumber();
      console.log(`📊 Database has ${labelCount} node labels`);

      console.log('🎉 Neo4j setup completed successfully!');

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('❌ Neo4j setup failed:', error.message);
    
    if (error.code === 'ServiceUnavailable') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure Neo4j server is running: neo4j start');
      console.log('2. Check if Neo4j is installed: brew install neo4j');
      console.log('3. Verify connection settings in .env file');
      console.log('4. Default Neo4j credentials: username=neo4j, password=neo4j (change on first login)');
    }
    
    process.exit(1);
  } finally {
    await driver.close();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupNeo4j()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupNeo4j;