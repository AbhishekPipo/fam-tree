const { sequelize, User, DirectRelationship, IndirectRelationship } = require('../models');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    console.log('🗄️  Setting up database...');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Drop and recreate all tables
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created');

    console.log('ℹ️  Database setup completed. Use migrations and seeders to populate data:');
    console.log('   npx sequelize-cli db:migrate');
    console.log('   npx sequelize-cli db:seed:all');

    console.log('\n🌳 Sample Family Tree Structure:');
    console.log('Ramesh (grandfather) ↔ Mallika (grandmother)    Suresh (brother)');
    console.log('       ↓');
    console.log('Prashanth (father) ↔ Anjali (mother)');
    console.log('       ↓                    ↓');
    console.log('   Simran (daughter)    Arjun (son)');
    console.log('       ↓                    ↓');
    console.log('   Elina (granddaughter) Rohan (grandson)');

    console.log('\n👨‍👩‍👧‍👦 Sample Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: prashanth@family.com | Password: FamilyTree123!');
    console.log('Email: anjali@family.com    | Password: FamilyTree123!');
    console.log('Email: simran@family.com    | Password: FamilyTree123!');
    console.log('Email: ramesh@family.com    | Password: FamilyTree123!');
    console.log('Email: suresh@family.com    | Password: FamilyTree123! [NEW: Ramesh\'s brother]');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✅ Database setup completed successfully!');
    console.log('🚀 You can now start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Only run if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
