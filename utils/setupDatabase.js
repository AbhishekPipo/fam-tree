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

    console.log('👨‍👩‍👧‍👦 Creating sample family data...');

    // Create the family members
    const familyMembers = await User.bulkCreate([
      {
        id: 1,
        firstName: 'Ramesh',
        lastName: 'Patel',
        email: 'ramesh@family.com',
        password: 'FamilyTree123!',
        gender: 'male',
        dateOfBirth: '1945-05-15',
        location: 'Mumbai, India',
        isDeceased: false
      },
      {
        id: 2,
        firstName: 'Mallika',
        lastName: 'Patel',
        email: 'mallika@family.com',
        password: 'FamilyTree123!',
        gender: 'female',
        dateOfBirth: '1950-08-22',
        location: 'Mumbai, India',
        isDeceased: false
      },
      {
        id: 3,
        firstName: 'Prashanth',
        lastName: 'Patel',
        email: 'prashanth@family.com',
        password: 'FamilyTree123!',
        gender: 'male',
        dateOfBirth: '1975-03-10',
        location: 'Bangalore, India',
        fatherId: 1,
        motherId: 2,
        hasMedication: true,
        medicationName: 'Blood Pressure Medicine',
        medicationFrequency: 'Daily',
        medicationTime: 'Morning'
      },
      {
        id: 4,
        firstName: 'Anjali',
        lastName: 'Patel',
        email: 'anjali@family.com',
        password: 'FamilyTree123!',
        gender: 'female',
        dateOfBirth: '1978-11-05',
        location: 'Bangalore, India',
        hasMedication: false
      },
      {
        id: 5,
        firstName: 'Simran',
        lastName: 'Patel',
        email: 'simran@family.com',
        password: 'FamilyTree123!',
        gender: 'female',
        dateOfBirth: '2005-07-20',
        location: 'Bangalore, India',
        fatherId: 3,
        motherId: 4,
        staysWithUser: true
      },
      {
        id: 6,
        firstName: 'Arjun',
        lastName: 'Patel',
        email: 'arjun@family.com',
        password: 'FamilyTree123!',
        gender: 'male',
        dateOfBirth: '2008-12-15',
        location: 'Bangalore, India',
        fatherId: 3,
        motherId: 4,
        staysWithUser: true
      },
      {
        id: 7,
        firstName: 'Elina',
        lastName: 'Patel',
        email: 'elina@family.com',
        password: 'FamilyTree123!',
        gender: 'female',
        dateOfBirth: '2025-04-18',
        location: 'Bangalore, India',
        fatherId: null, // Simran's husband would be the father
        motherId: 5
      },
      {
        id: 8,
        firstName: 'Rohan',
        lastName: 'Patel',
        email: 'rohan@family.com',
        password: 'FamilyTree123!',
        gender: 'male',
        dateOfBirth: '2027-09-22',
        location: 'Bangalore, India',
        fatherId: null, // Arjun's wife would be the mother
        motherId: null,
        // For this example, let's assume Arjun is the father
        fatherId: 6
      },
      {
        id: 9,
        firstName: 'Suresh',
        lastName: 'Patel',
        email: 'suresh@family.com',
        password: 'FamilyTree123!',
        gender: 'male',
        dateOfBirth: '1948-02-10',
        location: 'Mumbai, India',
        hasMedication: false,
        isDeceased: false
      }
    ], {
      individualHooks: true // This ensures password hashing hooks are triggered
    });

    console.log('✅ Family members created');

    // Create direct relationships (spouses)
    await DirectRelationship.bulkCreate([
      // Ramesh ↔ Mallika (husband/wife)
      { userId: 1, relatedUserId: 2, relationshipType: 'husband' },
      { userId: 2, relatedUserId: 1, relationshipType: 'wife' },
      
      // Prashanth ↔ Anjali (husband/wife)
      { userId: 3, relatedUserId: 4, relationshipType: 'husband' },
      { userId: 4, relatedUserId: 3, relationshipType: 'wife' }
    ]);

    console.log('✅ Direct relationships created');

    // Create indirect relationships
    // This is complex but follows our logic exactly
    const indirectRelationships = [
      // Ramesh's relationships (ID: 1)
      { userId: 1, relatedUserId: 3, relationshipLevel: -1, relationshipType: 'son' },        // Prashanth is son
      { userId: 1, relatedUserId: 4, relationshipLevel: -1, relationshipType: 'daughter-in-law' }, // Anjali is daughter-in-law
      { userId: 1, relatedUserId: 5, relationshipLevel: -2, relationshipType: 'granddaughter' }, // Simran is granddaughter
      { userId: 1, relatedUserId: 6, relationshipLevel: -2, relationshipType: 'grandson' },   // Arjun is grandson
      { userId: 1, relatedUserId: 7, relationshipLevel: -3, relationshipType: 'great-granddaughter' }, // Elina is great-granddaughter
      { userId: 1, relatedUserId: 8, relationshipLevel: -3, relationshipType: 'great-grandson' }, // Rohan is great-grandson

      // Mallika's relationships (ID: 2)
      { userId: 2, relatedUserId: 3, relationshipLevel: -1, relationshipType: 'son' },        // Prashanth is son
      { userId: 2, relatedUserId: 4, relationshipLevel: -1, relationshipType: 'daughter-in-law' }, // Anjali is daughter-in-law
      { userId: 2, relatedUserId: 5, relationshipLevel: -2, relationshipType: 'granddaughter' }, // Simran is granddaughter
      { userId: 2, relatedUserId: 6, relationshipLevel: -2, relationshipType: 'grandson' },   // Arjun is grandson
      { userId: 2, relatedUserId: 7, relationshipLevel: -3, relationshipType: 'great-granddaughter' }, // Elina is great-granddaughter
      { userId: 2, relatedUserId: 8, relationshipLevel: -3, relationshipType: 'great-grandson' }, // Rohan is great-grandson

      // Prashanth's relationships (ID: 3) - The main user in our example
      { userId: 3, relatedUserId: 1, relationshipLevel: 1, relationshipType: 'father' },      // Ramesh is father
      { userId: 3, relatedUserId: 2, relationshipLevel: 1, relationshipType: 'mother' },      // Mallika is mother
      { userId: 3, relatedUserId: 5, relationshipLevel: -1, relationshipType: 'daughter' },   // Simran is daughter
      { userId: 3, relatedUserId: 6, relationshipLevel: -1, relationshipType: 'son' },        // Arjun is son
      { userId: 3, relatedUserId: 7, relationshipLevel: -2, relationshipType: 'granddaughter' }, // Elina is granddaughter
      { userId: 3, relatedUserId: 8, relationshipLevel: -2, relationshipType: 'grandson' },   // Rohan is grandson

      // Anjali's relationships (ID: 4)
      { userId: 4, relatedUserId: 1, relationshipLevel: 1, relationshipType: 'father-in-law' }, // Ramesh is father-in-law
      { userId: 4, relatedUserId: 2, relationshipLevel: 1, relationshipType: 'mother-in-law' }, // Mallika is mother-in-law
      { userId: 4, relatedUserId: 5, relationshipLevel: -1, relationshipType: 'daughter' },   // Simran is daughter
      { userId: 4, relatedUserId: 6, relationshipLevel: -1, relationshipType: 'son' },        // Arjun is son
      { userId: 4, relatedUserId: 7, relationshipLevel: -2, relationshipType: 'granddaughter' }, // Elina is granddaughter
      { userId: 4, relatedUserId: 8, relationshipLevel: -2, relationshipType: 'grandson' },   // Rohan is grandson

      // Simran's relationships (ID: 5)
      { userId: 5, relatedUserId: 1, relationshipLevel: 2, relationshipType: 'grandfather' }, // Ramesh is grandfather
      { userId: 5, relatedUserId: 2, relationshipLevel: 2, relationshipType: 'grandmother' }, // Mallika is grandmother
      { userId: 5, relatedUserId: 3, relationshipLevel: 1, relationshipType: 'father' },     // Prashanth is father
      { userId: 5, relatedUserId: 4, relationshipLevel: 1, relationshipType: 'mother' },     // Anjali is mother
      { userId: 5, relatedUserId: 6, relationshipLevel: 0, relationshipType: 'brother' },    // Arjun is brother
      { userId: 5, relatedUserId: 7, relationshipLevel: -1, relationshipType: 'daughter' },  // Elina is daughter
      { userId: 5, relatedUserId: 8, relationshipLevel: -1, relationshipType: 'nephew' },    // Rohan is nephew

      // Arjun's relationships (ID: 6)
      { userId: 6, relatedUserId: 1, relationshipLevel: 2, relationshipType: 'grandfather' }, // Ramesh is grandfather
      { userId: 6, relatedUserId: 2, relationshipLevel: 2, relationshipType: 'grandmother' }, // Mallika is grandmother
      { userId: 6, relatedUserId: 3, relationshipLevel: 1, relationshipType: 'father' },     // Prashanth is father
      { userId: 6, relatedUserId: 4, relationshipLevel: 1, relationshipType: 'mother' },     // Anjali is mother
      { userId: 6, relatedUserId: 5, relationshipLevel: 0, relationshipType: 'sister' },     // Simran is sister
      { userId: 6, relatedUserId: 7, relationshipLevel: -1, relationshipType: 'niece' },     // Elina is niece
      { userId: 6, relatedUserId: 8, relationshipLevel: -1, relationshipType: 'son' },       // Rohan is son

      // Elina's relationships (ID: 7)
      { userId: 7, relatedUserId: 1, relationshipLevel: 3, relationshipType: 'great-grandfather' }, // Ramesh is great-grandfather
      { userId: 7, relatedUserId: 2, relationshipLevel: 3, relationshipType: 'great-grandmother' }, // Mallika is great-grandmother
      { userId: 7, relatedUserId: 3, relationshipLevel: 2, relationshipType: 'grandfather' }, // Prashanth is grandfather
      { userId: 7, relatedUserId: 4, relationshipLevel: 2, relationshipType: 'grandmother' }, // Anjali is grandmother
      { userId: 7, relatedUserId: 5, relationshipLevel: 1, relationshipType: 'mother' },     // Simran is mother
      { userId: 7, relatedUserId: 6, relationshipLevel: 1, relationshipType: 'uncle' },      // Arjun is uncle
      { userId: 7, relatedUserId: 8, relationshipLevel: 0, relationshipType: 'cousin' },     // Rohan is cousin

      // Rohan's relationships (ID: 8)
      { userId: 8, relatedUserId: 1, relationshipLevel: 3, relationshipType: 'great-grandfather' }, // Ramesh is great-grandfather
      { userId: 8, relatedUserId: 2, relationshipLevel: 3, relationshipType: 'great-grandmother' }, // Mallika is great-grandmother
      { userId: 8, relatedUserId: 3, relationshipLevel: 2, relationshipType: 'grandfather' }, // Prashanth is grandfather
      { userId: 8, relatedUserId: 4, relationshipLevel: 2, relationshipType: 'grandmother' }, // Anjali is grandmother
      { userId: 8, relatedUserId: 5, relationshipLevel: 1, relationshipType: 'aunt' },       // Simran is aunt
      { userId: 8, relatedUserId: 6, relationshipLevel: 1, relationshipType: 'father' },     // Arjun is father
      { userId: 8, relatedUserId: 7, relationshipLevel: 0, relationshipType: 'cousin' },     // Elina is cousin

      // Suresh's relationships (ID: 9) - Ramesh's brother
      { userId: 9, relatedUserId: 1, relationshipLevel: 0, relationshipType: 'brother' },    // Ramesh is brother
      { userId: 9, relatedUserId: 2, relationshipLevel: 0, relationshipType: 'sister-in-law' }, // Mallika is sister-in-law
      { userId: 9, relatedUserId: 3, relationshipLevel: -1, relationshipType: 'nephew' },    // Prashanth is nephew
      { userId: 9, relatedUserId: 4, relationshipLevel: -1, relationshipType: 'niece-in-law' }, // Anjali is niece-in-law
      { userId: 9, relatedUserId: 5, relationshipLevel: -2, relationshipType: 'grand-nephew' }, // Simran is grand-nephew
      { userId: 9, relatedUserId: 6, relationshipLevel: -2, relationshipType: 'grand-nephew' }, // Arjun is grand-nephew
      { userId: 9, relatedUserId: 7, relationshipLevel: -3, relationshipType: 'great-grand-niece' }, // Elina is great-grand-niece
      { userId: 9, relatedUserId: 8, relationshipLevel: -3, relationshipType: 'great-grand-nephew' }, // Rohan is great-grand-nephew

      // Add Suresh to everyone else's relationships
      { userId: 1, relatedUserId: 9, relationshipLevel: 0, relationshipType: 'brother' },    // Suresh is Ramesh's brother
      { userId: 2, relatedUserId: 9, relationshipLevel: 0, relationshipType: 'brother-in-law' }, // Suresh is Mallika's brother-in-law
      { userId: 3, relatedUserId: 9, relationshipLevel: 1, relationshipType: 'uncle' },      // Suresh is Prashanth's uncle
      { userId: 4, relatedUserId: 9, relationshipLevel: 1, relationshipType: 'uncle-in-law' }, // Suresh is Anjali's uncle-in-law
      { userId: 5, relatedUserId: 9, relationshipLevel: 2, relationshipType: 'great-uncle' }, // Suresh is Simran's great-uncle
      { userId: 6, relatedUserId: 9, relationshipLevel: 2, relationshipType: 'great-uncle' }, // Suresh is Arjun's great-uncle
      { userId: 7, relatedUserId: 9, relationshipLevel: 3, relationshipType: 'great-great-uncle' }, // Suresh is Elina's great-great-uncle
      { userId: 8, relatedUserId: 9, relationshipLevel: 3, relationshipType: 'great-great-uncle' }  // Suresh is Rohan's great-great-uncle
    ];

    await IndirectRelationship.bulkCreate(indirectRelationships);

    console.log('✅ Indirect relationships created');

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
