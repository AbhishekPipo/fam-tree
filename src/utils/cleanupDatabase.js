// Database cleanup script to remove Person nodes and migrate to User-only architecture

const database = require('../config/database');

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Connect to database
    await database.connect();
    
    // 1. Check what nodes currently exist
    console.log('\n📊 Current database state:');
    
    const nodeCountQuery = `
      MATCH (n)
      RETURN labels(n) as labels, count(n) as count
      ORDER BY count DESC
    `;
    
    const nodeResult = await database.runQuery(nodeCountQuery);
    nodeResult.records.forEach(record => {
      const labels = record.get('labels');
      const count = record.get('count').toNumber();
      console.log(`  ${labels.join(':')} nodes: ${count}`);
    });
    
    // 2. Check for any User nodes that still have Person label
    console.log('\n🔍 Checking for User nodes with Person label...');
    
    const dualLabelQuery = `
      MATCH (n:User:Person)
      RETURN count(n) as count
    `;
    
    const dualLabelResult = await database.runQuery(dualLabelQuery);
    const dualLabelCount = dualLabelResult.records[0].get('count').toNumber();
    
    if (dualLabelCount > 0) {
      console.log(`  Found ${dualLabelCount} nodes with both User and Person labels`);
      
      // Remove Person label from User nodes
      console.log('  Removing Person label from User nodes...');
      const removeLabelQuery = `
        MATCH (n:User:Person)
        REMOVE n:Person
        RETURN count(n) as updated
      `;
      
      const removeResult = await database.runQuery(removeLabelQuery);
      const updatedCount = removeResult.records[0].get('updated').toNumber();
      console.log(`  ✅ Updated ${updatedCount} nodes`);
    } else {
      console.log('  ✅ No User nodes have Person label');
    }
    
    // 3. Check for standalone Person nodes (not User nodes)
    console.log('\n🔍 Checking for standalone Person nodes...');
    
    const standalonePersonQuery = `
      MATCH (p:Person)
      WHERE NOT p:User
      RETURN count(p) as count
    `;
    
    const standaloneResult = await database.runQuery(standalonePersonQuery);
    const standaloneCount = standaloneResult.records[0].get('count').toNumber();
    
    if (standaloneCount > 0) {
      console.log(`  Found ${standaloneCount} standalone Person nodes`);
      
      // Show some examples
      const exampleQuery = `
        MATCH (p:Person)
        WHERE NOT p:User
        RETURN p.firstName, p.lastName, p.id
        LIMIT 5
      `;
      
      const exampleResult = await database.runQuery(exampleQuery);
      console.log('  Examples:');
      exampleResult.records.forEach(record => {
        const firstName = record.get('p.firstName');
        const lastName = record.get('p.lastName');
        const id = record.get('p.id');
        console.log(`    ${firstName} ${lastName} (${id})`);
      });
      
      console.log('\n⚠️  WARNING: Found standalone Person nodes!');
      console.log('   These might be from family tree data or GEDCOM imports.');
      console.log('   Please review before deletion.');
      
      // Uncomment the following lines to delete standalone Person nodes
      // console.log('  Deleting standalone Person nodes...');
      // const deleteQuery = `
      //   MATCH (p:Person)
      //   WHERE NOT p:User
      //   DETACH DELETE p
      //   RETURN count(p) as deleted
      // `;
      // 
      // const deleteResult = await database.runQuery(deleteQuery);
      // const deletedCount = deleteResult.records[0].get('deleted').toNumber();
      // console.log(`  ✅ Deleted ${deletedCount} Person nodes`);
    } else {
      console.log('  ✅ No standalone Person nodes found');
    }
    
    // 4. Drop old Person constraints and indexes
    console.log('\n🗑️  Cleaning up old Person constraints and indexes...');
    
    const oldConstraints = [
      'DROP CONSTRAINT person_id_unique IF EXISTS',
      'DROP CONSTRAINT person_name_exists IF EXISTS', 
      'DROP CONSTRAINT person_gender_exists IF EXISTS'
    ];
    
    const oldIndexes = [
      'DROP INDEX person_name_index IF EXISTS',
      'DROP INDEX person_birth_index IF EXISTS',
      'DROP INDEX person_gender_index IF EXISTS',
      'DROP INDEX person_search_index IF EXISTS'
    ];
    
    for (const constraint of oldConstraints) {
      try {
        await database.runQuery(constraint);
        console.log(`  ✅ ${constraint}`);
      } catch (error) {
        console.log(`  ℹ️  ${constraint} - ${error.message}`);
      }
    }
    
    for (const index of oldIndexes) {
      try {
        await database.runQuery(index);
        console.log(`  ✅ ${index}`);
      } catch (error) {
        console.log(`  ℹ️  ${index} - ${error.message}`);
      }
    }
    
    // 5. Final state check
    console.log('\n📊 Final database state:');
    
    const finalResult = await database.runQuery(nodeCountQuery);
    finalResult.records.forEach(record => {
      const labels = record.get('labels');
      const count = record.get('count').toNumber();
      console.log(`  ${labels.join(':')} nodes: ${count}`);
    });
    
    console.log('\n✅ Database cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await database.disconnect();
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupDatabase()
    .then(() => {
      console.log('🎉 Cleanup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = cleanupDatabase;
