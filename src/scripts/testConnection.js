const { initPostgres, query, closePool } = require('../config/postgres');

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...');
    
    // Initialize the connection
    await initPostgres();
    
    // Test a simple query
    const result = await query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].postgres_version);
    
    // Test if our tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Test user count
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    console.log(`\n👥 Users in database: ${userCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Provide helpful troubleshooting tips
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your .env file configuration');
    console.log('3. Verify database credentials');
    console.log('4. Ensure the database exists');
    console.log('5. Check network connectivity');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 It looks like PostgreSQL is not running. Try:');
      console.log('   - docker-compose up postgres');
      console.log('   - Or start your local PostgreSQL service');
    }
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Host not found. Check your DB_HOST in .env file');
    }
    
  } finally {
    await closePool();
    process.exit(0);
  }
}

testConnection();