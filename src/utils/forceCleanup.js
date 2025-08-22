// Force cleanup script - removes all Person nodes and ensures User-only architecture

const database = require('../config/database');

async function forceCleanup() {
  try {
    console.log('🚨 FORCE CLEANUP: Removing all Person nodes...');
    
    await database.connect();
    
    // 1. Remove Person label from any User nodes
    console.log('1. Removing Person labels from User nodes...');
    const removeLabelResult = await database.runQuery(`
      MATCH (n:User:Person)
      REMOVE n:Person
      RETURN count(n) as updated
    `);
    const updatedCount = removeLabelResult.records.length > 0 ? 
      removeLabelResult.records[0].get('updated') : 0;
    console.log(`   Updated: ${updatedCount} nodes`);
    
    // 2. Delete all standalone Person nodes
    console.log('2. Deleting standalone Person nodes...');
    const deletePersonResult = await database.runQuery(`
      MATCH (p:Person)
      WHERE NOT p:User
      DETACH DELETE p
      RETURN count(p) as deleted
    `);
    const deletedCount = deletePersonResult.records.length > 0 ? 
      deletePersonResult.records[0].get('deleted') : 0;
    console.log(`   Deleted: ${deletedCount} nodes`);
    
    // 3. Drop old Person constraints
    console.log('3. Dropping Person constraints...');
    const oldConstraints = [
      'DROP CONSTRAINT person_id_unique IF EXISTS',
      'DROP CONSTRAINT person_name_exists IF EXISTS',
      'DROP CONSTRAINT person_gender_exists IF EXISTS'
    ];
    
    for (const constraint of oldConstraints) {
      try {
        await database.runQuery(constraint);
        console.log(`   ✅ ${constraint}`);
      } catch (error) {
        console.log(`   ℹ️  ${constraint} - Already dropped or doesn't exist`);
      }
    }
    
    // 4. Drop old Person indexes
    console.log('4. Dropping Person indexes...');
    const oldIndexes = [
      'DROP INDEX person_name_index IF EXISTS',
      'DROP INDEX person_birth_index IF EXISTS',
      'DROP INDEX person_gender_index IF EXISTS',
      'DROP INDEX person_search_index IF EXISTS'
    ];
    
    for (const index of oldIndexes) {
      try {
        await database.runQuery(index);
        console.log(`   ✅ ${index}`);
      } catch (error) {
        console.log(`   ℹ️  ${index} - Already dropped or doesn't exist`);
      }
    }
    
    // 5. Verify cleanup
    console.log('5. Verifying cleanup...');
    const verifyResult = await database.runQuery(`
      MATCH (n)
      RETURN labels(n) as labels, count(n) as count
      ORDER BY count DESC
    `);
    
    console.log('   Current nodes in database:');
    verifyResult.records.forEach(record => {
      const labels = record.get('labels');
      const count = record.get('count');
      console.log(`   ${labels.join(':')} nodes: ${count}`);
    });
    
    // Check for any remaining Person nodes
    const personCheckResult = await database.runQuery(`
      MATCH (p:Person)
      RETURN count(p) as count
    `);
    
    const personCount = personCheckResult.records.length > 0 ? 
      personCheckResult.records[0].get('count') : 0;
    if (personCount === 0) {
      console.log('   ✅ No Person nodes remain in database');
    } else {
      console.log(`   ⚠️  WARNING: ${personCount} Person nodes still exist!`);
    }
    
    console.log('\n🎉 Force cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during force cleanup:', error);
    throw error;
  } finally {
    await database.close();
  }
}

module.exports = forceCleanup;

// Run if executed directly
if (require.main === module) {
  forceCleanup()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}
