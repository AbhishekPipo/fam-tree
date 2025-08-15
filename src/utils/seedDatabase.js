const database = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 Seeding Neo4j database with family tree data...');
    
    // Connect to database
    await database.connect();
    
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('FamilyTree123!', 12);
    
    // Create users matching the expected response structure
    const users = [
      {
        id: 32,
        firstName: 'Harilal',
        middleName: null,
        lastName: 'Patel',
        email: 'harilal.patel@family.com',
        password: hashedPassword,
        dateOfBirth: '1925-03-15',
        gender: 'male',
        location: 'Ahmedabad, Gujarat, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: null,
        motherId: null,
        spouseId: 33,
        createdAt: '2025-08-13T20:23:22.974Z',
        updatedAt: '2025-08-13T20:23:22.974Z'
      },
      {
        id: 33,
        firstName: 'Savitri',
        middleName: null,
        lastName: 'Patel',
        email: 'savitri.patel@family.com',
        password: hashedPassword,
        dateOfBirth: '1930-07-20',
        gender: 'female',
        location: 'Ahmedabad, Gujarat, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: null,
        motherId: null,
        spouseId: 32,
        createdAt: '2025-08-13T20:23:23.323Z',
        updatedAt: '2025-08-13T20:23:23.323Z'
      },
      {
        id: 34,
        firstName: 'Ramesh',
        middleName: null,
        lastName: 'Patel',
        email: 'ramesh.patel@family.com',
        password: hashedPassword,
        dateOfBirth: '1955-01-10',
        gender: 'male',
        location: 'Mumbai, Maharashtra, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: 32,
        motherId: 33,
        spouseId: 35,
        createdAt: '2025-08-13T20:23:23.673Z',
        updatedAt: '2025-08-13T20:23:23.673Z'
      },
      {
        id: 35,
        firstName: 'Mallika',
        middleName: null,
        lastName: 'Patel',
        email: 'mallika.patel@family.com',
        password: hashedPassword,
        dateOfBirth: '1958-06-20',
        gender: 'female',
        location: 'Mumbai, Maharashtra, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: null,
        motherId: null,
        spouseId: 34,
        createdAt: '2025-08-13T20:23:24.019Z',
        updatedAt: '2025-08-13T20:23:24.019Z'
      },
      {
        id: 36,
        firstName: 'Suresh',
        middleName: null,
        lastName: 'Patel',
        email: 'suresh.patel@family.com',
        password: hashedPassword,
        dateOfBirth: '1952-09-05',
        gender: 'male',
        location: 'Pune, Maharashtra, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: 32,
        motherId: 33,
        spouseId: 37,
        createdAt: '2025-08-13T20:23:24.367Z',
        updatedAt: '2025-08-13T20:23:24.367Z'
      },
      {
        id: 37,
        firstName: 'Kiran',
        middleName: null,
        lastName: 'Patel',
        email: 'kiran.patel@family.com',
        password: hashedPassword,
        dateOfBirth: '1955-12-18',
        gender: 'female',
        location: 'Pune, Maharashtra, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: null,
        motherId: null,
        spouseId: 36,
        createdAt: '2025-08-13T20:23:24.720Z',
        updatedAt: '2025-08-13T20:23:24.720Z'
      },
      {
        id: 38,
        firstName: 'Prashanth',
        middleName: null,
        lastName: 'Patel',
        email: 'prashanth@family.com',
        password: hashedPassword,
        dateOfBirth: '1980-05-15',
        gender: 'male',
        location: 'Mumbai, Maharashtra, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: true,
        isDeceased: false,
        staysWithUser: false,
        fatherId: 34,
        motherId: 35,
        spouseId: 39,
        createdAt: '2025-08-13T20:23:25.057Z',
        updatedAt: '2025-08-13T20:27:40.913Z'
      },
      {
        id: 39,
        firstName: 'Anjali',
        middleName: null,
        lastName: 'Patel',
        email: 'anjali@family.com',
        password: hashedPassword,
        dateOfBirth: '1982-08-22',
        gender: 'female',
        location: 'Mumbai, Maharashtra, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: null,
        motherId: null,
        spouseId: 38,
        createdAt: '2025-08-13T20:23:25.401Z',
        updatedAt: '2025-08-13T20:23:25.401Z'
      },
      {
        id: 40,
        firstName: 'Amit',
        middleName: null,
        lastName: 'Patel',
        email: 'amit@family.com',
        password: hashedPassword,
        dateOfBirth: '1983-11-25',
        gender: 'male',
        location: 'Pune, Maharashtra, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: 36,
        motherId: 37,
        spouseId: 55,
        createdAt: '2025-08-13T20:23:25.745Z',
        updatedAt: '2025-08-13T20:27:23.338Z'
      },
      {
        id: 41,
        firstName: 'Priya',
        middleName: null,
        lastName: 'Patel',
        email: 'priya.patel@family.com',
        password: hashedPassword,
        dateOfBirth: '1986-02-14',
        gender: 'female',
        location: 'Pune, Maharashtra, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: 36,
        motherId: 37,
        spouseId: 42,
        createdAt: '2025-08-13T20:23:26.092Z',
        updatedAt: '2025-08-13T20:23:26.092Z'
      },
      {
        id: 42,
        firstName: 'Vikram',
        middleName: null,
        lastName: 'Shah',
        email: 'vikram.shah@family.com',
        password: hashedPassword,
        dateOfBirth: '1984-07-30',
        gender: 'male',
        location: 'Pune, Maharashtra, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: null,
        motherId: null,
        spouseId: 41,
        createdAt: '2025-08-13T20:23:26.440Z',
        updatedAt: '2025-08-13T20:23:26.440Z'
      },
      {
        id: 43,
        firstName: 'Arjun',
        middleName: null,
        lastName: 'Patel',
        email: 'arjun@family.com',
        password: hashedPassword,
        dateOfBirth: '2005-03-10',
        gender: 'male',
        location: 'Mumbai, Maharashtra, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: 38,
        motherId: 39,
        spouseId: null,
        createdAt: '2025-08-13T20:23:26.783Z',
        updatedAt: '2025-08-13T20:23:26.783Z'
      },
      {
        id: 44,
        firstName: 'Simran',
        middleName: null,
        lastName: 'Patel',
        email: 'simran@family.com',
        password: hashedPassword,
        dateOfBirth: '2008-07-18',
        gender: 'female',
        location: 'Mumbai, Maharashtra, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: 38,
        motherId: 39,
        spouseId: null,
        createdAt: '2025-08-13T20:23:27.128Z',
        updatedAt: '2025-08-13T20:23:27.128Z'
      },
      {
        id: 55,
        firstName: 'Meera',
        middleName: null,
        lastName: 'Sharma',
        email: 'meera.sharma@family.com',
        password: hashedPassword,
        dateOfBirth: '1985-04-12',
        gender: 'female',
        location: 'Pune, Maharashtra, India',
        profilePicture: null,
        hasMedication: false,
        medicationName: null,
        medicationFrequency: null,
        medicationTime: null,
        isOnline: false,
        isDeceased: false,
        staysWithUser: false,
        fatherId: null,
        motherId: null,
        spouseId: 40,
        createdAt: '2025-08-13T20:27:23.000Z',
        updatedAt: '2025-08-13T20:27:23.000Z'
      }
    ];

    console.log('👥 Creating users...');
    
    // Create all users
    for (const userData of users) {
      const cypher = `
        CREATE (u:User $properties)
        RETURN u
      `;
      
      await database.runQuery(cypher, { properties: userData });
      console.log(`✅ Created user: ${userData.firstName} ${userData.lastName}`);
    }

    console.log('💑 Creating marriage relationships...');
    
    // Create marriage relationships
    const marriages = [
      // Harilal ↔ Savitri (husband/wife)
      { user1: 32, user2: 33, type1: 'husband', type2: 'wife' },
      // Ramesh ↔ Mallika (husband/wife)
      { user1: 34, user2: 35, type1: 'husband', type2: 'wife' },
      // Suresh ↔ Kiran (husband/wife)
      { user1: 36, user2: 37, type1: 'husband', type2: 'wife' },
      // Prashanth ↔ Anjali (husband/wife)
      { user1: 38, user2: 39, type1: 'husband', type2: 'wife' },
      // Amit ↔ Meera (husband/wife)
      { user1: 40, user2: 55, type1: 'husband', type2: 'wife' },
      // Priya ↔ Vikram (wife/husband)
      { user1: 41, user2: 42, type1: 'wife', type2: 'husband' }
    ];

    for (const marriage of marriages) {
      const queries = [
        {
          cypher: `
            MATCH (u1:User {id: $user1}), (u2:User {id: $user2})
            CREATE (u1)-[r:MARRIED_TO {
              type: $type1,
              createdAt: datetime()
            }]->(u2)
            RETURN r
          `,
          parameters: { user1: marriage.user1, user2: marriage.user2, type1: marriage.type1 }
        },
        {
          cypher: `
            MATCH (u1:User {id: $user1}), (u2:User {id: $user2})
            CREATE (u2)-[r:MARRIED_TO {
              type: $type2,
              createdAt: datetime()
            }]->(u1)
            RETURN r
          `,
          parameters: { user1: marriage.user1, user2: marriage.user2, type2: marriage.type2 }
        }
      ];

      await database.runTransaction(queries);
      console.log(`💍 Created marriage: ${marriage.type1} ↔ ${marriage.type2}`);
    }

    console.log('👨‍👩‍👧‍👦 Creating parent-child relationships...');
    
    // Create parent-child relationships
    const parentChildRelationships = [
      // Harilal → Ramesh (father → son)
      { parent: 32, child: 34, parentType: 'father', childType: 'son' },
      // Savitri → Ramesh (mother → son)
      { parent: 33, child: 34, parentType: 'mother', childType: 'son' },
      // Harilal → Suresh (father → son)
      { parent: 32, child: 36, parentType: 'father', childType: 'son' },
      // Savitri → Suresh (mother → son)
      { parent: 33, child: 36, parentType: 'mother', childType: 'son' },
      
      // Ramesh → Prashanth (father → son)
      { parent: 34, child: 38, parentType: 'father', childType: 'son' },
      // Mallika → Prashanth (mother → son)
      { parent: 35, child: 38, parentType: 'mother', childType: 'son' },
      
      // Suresh → Amit (father → son)
      { parent: 36, child: 40, parentType: 'father', childType: 'son' },
      // Kiran → Amit (mother → son)
      { parent: 37, child: 40, parentType: 'mother', childType: 'son' },
      // Suresh → Priya (father → daughter)
      { parent: 36, child: 41, parentType: 'father', childType: 'daughter' },
      // Kiran → Priya (mother → daughter)
      { parent: 37, child: 41, parentType: 'mother', childType: 'daughter' },
      
      // Prashanth → Arjun (father → son)
      { parent: 38, child: 43, parentType: 'father', childType: 'son' },
      // Anjali → Arjun (mother → son)
      { parent: 39, child: 43, parentType: 'mother', childType: 'son' },
      // Prashanth → Simran (father → daughter)
      { parent: 38, child: 44, parentType: 'father', childType: 'daughter' },
      // Anjali → Simran (mother → daughter)
      { parent: 39, child: 44, parentType: 'mother', childType: 'daughter' }
    ];

    for (const rel of parentChildRelationships) {
      const queries = [
        {
          cypher: `
            MATCH (parent:User {id: $parentId}), (child:User {id: $childId})
            CREATE (parent)-[r:PARENT_OF {
              type: $parentType,
              createdAt: datetime()
            }]->(child)
            RETURN r
          `,
          parameters: { parentId: rel.parent, childId: rel.child, parentType: rel.parentType }
        },
        {
          cypher: `
            MATCH (parent:User {id: $parentId}), (child:User {id: $childId})
            CREATE (child)-[r:CHILD_OF {
              type: $childType,
              createdAt: datetime()
            }]->(parent)
            RETURN r
          `,
          parameters: { parentId: rel.parent, childId: rel.child, childType: rel.childType }
        }
      ];

      await database.runTransaction(queries);
      console.log(`👨‍👧 Created parent-child: ${rel.parentType} → ${rel.childType}`);
    }

    console.log('👫 Creating sibling relationships...');
    
    // Create sibling relationships
    const siblingRelationships = [
      // Ramesh ↔ Suresh (brother ↔ brother)
      { user1: 34, user2: 36, type1: 'brother', type2: 'brother' },
      // Amit ↔ Priya (brother ↔ sister)
      { user1: 40, user2: 41, type1: 'brother', type2: 'sister' },
      // Arjun ↔ Simran (brother ↔ sister)
      { user1: 43, user2: 44, type1: 'brother', type2: 'sister' }
    ];

    for (const sibling of siblingRelationships) {
      const queries = [
        {
          cypher: `
            MATCH (u1:User {id: $user1}), (u2:User {id: $user2})
            CREATE (u1)-[r:SIBLING_OF {
              type: $type1,
              createdAt: datetime()
            }]->(u2)
            RETURN r
          `,
          parameters: { user1: sibling.user1, user2: sibling.user2, type1: sibling.type1 }
        },
        {
          cypher: `
            MATCH (u1:User {id: $user1}), (u2:User {id: $user2})
            CREATE (u2)-[r:SIBLING_OF {
              type: $type2,
              createdAt: datetime()
            }]->(u1)
            RETURN r
          `,
          parameters: { user1: sibling.user1, user2: sibling.user2, type2: sibling.type2 }
        }
      ];

      await database.runTransaction(queries);
      console.log(`👫 Created sibling: ${sibling.type1} ↔ ${sibling.type2}`);
    }

    console.log('🏠 Creating extended family relationships...');
    
    // Create uncle/aunt relationships (Suresh as uncle to Prashanth)
    const extendedRelationships = [
      // Suresh → Prashanth (uncle → nephew)
      { user1: 'suresh-patel-009', user2: 'prashanth-patel-003', type1: 'uncle', type2: 'nephew' },
      // Suresh → Simran (great-uncle → great-niece)
      { user1: 'suresh-patel-009', user2: 'simran-patel-005', type1: 'uncle', type2: 'niece' },
      // Suresh → Arjun (great-uncle → great-nephew)
      { user1: 'suresh-patel-009', user2: 'arjun-patel-006', type1: 'uncle', type2: 'nephew' }
    ];

    for (const rel of extendedRelationships) {
      const queries = [
        {
          cypher: `
            MATCH (u1:User {id: $user1}), (u2:User {id: $user2})
            CREATE (u1)-[r:EXTENDED_FAMILY {
              type: $type1,
              createdAt: datetime()
            }]->(u2)
            RETURN r
          `,
          parameters: { user1: rel.user1, user2: rel.user2, type1: rel.type1 }
        },
        {
          cypher: `
            MATCH (u1:User {id: $user1}), (u2:User {id: $user2})
            CREATE (u2)-[r:EXTENDED_FAMILY {
              type: $type2,
              createdAt: datetime()
            }]->(u1)
            RETURN r
          `,
          parameters: { user1: rel.user1, user2: rel.user2, type2: rel.type2 }
        }
      ];

      await database.runTransaction(queries);
      console.log(`🏠 Created extended family: ${rel.type1} ↔ ${rel.type2}`);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Family Tree Summary:
👴 Grandparents: Ramesh & Mallika Patel
👨‍👩‍👧‍👦 Parents: Prashanth & Anjali Patel  
👧👦 Children: Simran & Arjun Patel
👶 Grandchildren: Elina (Simran's daughter) & Rohan (Arjun's son)
👨 Uncle: Suresh Patel

🔐 All users have password: FamilyTree123!
    `);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await database.close();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Database seeding finished!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;