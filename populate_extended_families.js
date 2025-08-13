const { User, DirectRelationship, sequelize } = require('./src/models');
const bcrypt = require('bcryptjs');

/**
 * Comprehensive script to populate both Patel and Sharma families
 * with the same complexity and multi-generational structure
 */

async function populateExtendedFamilies() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🌳 Starting to populate extended families...\n');
    
    // Clear existing data first
    console.log('🧹 Clearing existing family data...');
    await DirectRelationship.destroy({ where: {}, transaction });
    await User.destroy({ where: {}, transaction });
    console.log('✅ Existing data cleared.\n');

    // ===========================================
    // PATEL FAMILY (Prashanth's Side) - Enhanced
    // ===========================================
    
    console.log('👨‍👩‍👧‍👦 Creating Patel Family (Prashanth\'s Side)...');
    
    // Level 2: Patel Grandparents
    const patelGrandfather = await User.create({
      firstName: 'Harilal',
      lastName: 'Patel',
      email: 'harilal.patel@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1925-03-15',
      location: 'Ahmedabad, Gujarat, India'
    }, { transaction });

    const patelGrandmother = await User.create({
      firstName: 'Savitri',
      lastName: 'Patel',
      email: 'savitri.patel@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '1930-07-20',
      location: 'Ahmedabad, Gujarat, India'
    }, { transaction });

    // Marriage relationship for grandparents
    await DirectRelationship.create({
      userId: patelGrandfather.id,
      relatedUserId: patelGrandmother.id,
      relationshipType: 'husband'
    }, { transaction });
    
    await DirectRelationship.create({
      userId: patelGrandmother.id,
      relatedUserId: patelGrandfather.id,
      relationshipType: 'wife'
    }, { transaction });

    // Level 1: Patel Parents and Uncle
    const ramesh = await User.create({
      firstName: 'Ramesh',
      lastName: 'Patel',
      email: 'ramesh.patel@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1955-01-10',
      location: 'Mumbai, Maharashtra, India',
      fatherId: patelGrandfather.id,
      motherId: patelGrandmother.id
    }, { transaction });

    const mallika = await User.create({
      firstName: 'Mallika',
      lastName: 'Patel',
      email: 'mallika.patel@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '1958-06-20',
      location: 'Mumbai, Maharashtra, India'
    }, { transaction });

    const suresh = await User.create({
      firstName: 'Suresh',
      lastName: 'Patel',
      email: 'suresh.patel@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1952-09-05',
      location: 'Pune, Maharashtra, India',
      fatherId: patelGrandfather.id,
      motherId: patelGrandmother.id
    }, { transaction });

    // Suresh's wife
    const sureshWife = await User.create({
      firstName: 'Kiran',
      lastName: 'Patel',
      email: 'kiran.patel@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '1955-11-12',
      location: 'Pune, Maharashtra, India'
    }, { transaction });

    // Marriage relationships
    await DirectRelationship.createBidirectional(ramesh.id, mallika.id, 'husband', 'wife', transaction);
    await DirectRelationship.createBidirectional(suresh.id, sureshWife.id, 'husband', 'wife', transaction);

    // Level 0: Current generation and cousins
    const prashanth = await User.create({
      firstName: 'Prashanth',
      lastName: 'Patel',
      email: 'prashanth@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1980-05-15',
      location: 'Mumbai, Maharashtra, India',
      fatherId: ramesh.id,
      motherId: mallika.id
    }, { transaction });

    const anjali = await User.create({
      firstName: 'Anjali',
      lastName: 'Patel',
      email: 'anjali@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '1982-08-22',
      location: 'Mumbai, Maharashtra, India'
    }, { transaction });

    // Amit (Suresh's son)
    const amit = await User.create({
      firstName: 'Amit',
      lastName: 'Patel',
      email: 'amit@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1983-11-25',
      location: 'Pune, Maharashtra, India',
      fatherId: suresh.id,
      motherId: sureshWife.id
    }, { transaction });

    // Priya (Suresh's daughter)
    const priya = await User.create({
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '1986-02-14',
      location: 'Pune, Maharashtra, India',
      fatherId: suresh.id,
      motherId: sureshWife.id
    }, { transaction });

    // Priya's husband
    const priyaHusband = await User.create({
      firstName: 'Vikram',
      lastName: 'Shah',
      email: 'vikram.shah@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1984-07-18',
      location: 'Pune, Maharashtra, India'
    }, { transaction });

    // Marriage relationships
    await DirectRelationship.createBidirectional(prashanth.id, anjali.id, 'husband', 'wife', transaction);
    await DirectRelationship.createBidirectional(priya.id, priyaHusband.id, 'wife', 'husband', transaction);

    // Level -1: Patel children and extended children
    const arjun = await User.create({
      firstName: 'Arjun',
      lastName: 'Patel',
      email: 'arjun@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '2005-03-10',
      location: 'Mumbai, Maharashtra, India',
      fatherId: prashanth.id,
      motherId: anjali.id
    }, { transaction });

    const simran = await User.create({
      firstName: 'Simran',
      lastName: 'Patel',
      email: 'simran@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '2008-07-18',
      location: 'Mumbai, Maharashtra, India',
      fatherId: prashanth.id,
      motherId: anjali.id
    }, { transaction });

    // Priya's children
    const priyaSon = await User.create({
      firstName: 'Rohan',
      lastName: 'Shah',
      email: 'rohan.shah@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '2011-09-05',
      location: 'Pune, Maharashtra, India',
      fatherId: priyaHusband.id,
      motherId: priya.id
    }, { transaction });

    const priyaDaughter = await User.create({
      firstName: 'Ishita',
      lastName: 'Shah',
      email: 'ishita.shah@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '2013-12-20',
      location: 'Pune, Maharashtra, India',
      fatherId: priyaHusband.id,
      motherId: priya.id
    }, { transaction });

    console.log('✅ Patel family created successfully!\n');

    // ===========================================
    // SHARMA FAMILY (Meera's Side) - Same Complexity
    // ===========================================
    
    console.log('👨‍👩‍👧‍👦 Creating Sharma Family (Meera\'s Side)...');
    
    // Level 2: Sharma Grandparents
    const sharmaGrandfather = await User.create({
      firstName: 'Mohan',
      lastName: 'Sharma',
      email: 'mohan.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1925-03-15',
      location: 'Delhi, India'
    }, { transaction });

    const sharmaGrandmother = await User.create({
      firstName: 'Kamala',
      lastName: 'Sharma',
      email: 'kamala.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '1930-07-20',
      location: 'Delhi, India'
    }, { transaction });

    // Marriage relationship for grandparents
    await DirectRelationship.createBidirectional(sharmaGrandfather.id, sharmaGrandmother.id, 'husband', 'wife', transaction);

    // Level 1: Sharma Parents and Uncle
    const rajesh = await User.create({
      firstName: 'Rajesh',
      lastName: 'Sharma',
      email: 'rajesh.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1955-01-10',
      location: 'Delhi, India',
      fatherId: sharmaGrandfather.id,
      motherId: sharmaGrandmother.id
    }, { transaction });

    const sunita = await User.create({
      firstName: 'Sunita',
      lastName: 'Sharma',
      email: 'sunita.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '1958-06-20',
      location: 'Delhi, India'
    }, { transaction });

    const vinod = await User.create({
      firstName: 'Vinod',
      lastName: 'Sharma',
      email: 'vinod.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1952-09-05',
      location: 'Mumbai, India',
      fatherId: sharmaGrandfather.id,
      motherId: sharmaGrandmother.id
    }, { transaction });

    // Vinod's wife
    const vinodWife = await User.create({
      firstName: 'Rekha',
      lastName: 'Sharma',
      email: 'rekha.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '1955-11-12',
      location: 'Mumbai, India'
    }, { transaction });

    // Marriage relationships
    await DirectRelationship.createBidirectional(rajesh.id, sunita.id, 'husband', 'wife', transaction);
    await DirectRelationship.createBidirectional(vinod.id, vinodWife.id, 'husband', 'wife', transaction);

    // Level 0: Sharma siblings and cousins
    const rohit = await User.create({
      firstName: 'Rohit',
      lastName: 'Sharma',
      email: 'rohit.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1985-09-12',
      location: 'Delhi, India',
      fatherId: rajesh.id,
      motherId: sunita.id
    }, { transaction });

    const rohitWife = await User.create({
      firstName: 'Nisha',
      lastName: 'Sharma',
      email: 'nisha.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '1987-12-08',
      location: 'Delhi, India'
    }, { transaction });

    const meera = await User.create({
      firstName: 'Meera',
      lastName: 'Sharma',
      email: 'meera.sharma@family.com',
      password: await bcrypt.hash('TempPassword123!', 10),
      gender: 'female',
      dateOfBirth: '1982-03-15',
      location: 'Mumbai, India',
      fatherId: rajesh.id,
      motherId: sunita.id
    }, { transaction });

    const pooja = await User.create({
      firstName: 'Pooja',
      lastName: 'Sharma',
      email: 'pooja.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '1988-04-18',
      location: 'Bangalore, India',
      fatherId: rajesh.id,
      motherId: sunita.id
    }, { transaction });

    const poojaHusband = await User.create({
      firstName: 'Raj',
      lastName: 'Gupta',
      email: 'raj.gupta@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1985-05-22',
      location: 'Bangalore, India'
    }, { transaction });

    // Vinod's children (Meera's cousins)
    const ravi = await User.create({
      firstName: 'Ravi',
      lastName: 'Sharma',
      email: 'ravi.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1983-11-25',
      location: 'Mumbai, India',
      fatherId: vinod.id,
      motherId: vinodWife.id
    }, { transaction });

    const raviWife = await User.create({
      firstName: 'Kavita',
      lastName: 'Sharma',
      email: 'kavita.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '1985-08-30',
      location: 'Mumbai, India'
    }, { transaction });

    const neha = await User.create({
      firstName: 'Neha',
      lastName: 'Sharma',
      email: 'neha.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '1986-02-14',
      location: 'Mumbai, India',
      fatherId: vinod.id,
      motherId: vinodWife.id
    }, { transaction });

    const nehaHusband = await User.create({
      firstName: 'Deepak',
      lastName: 'Jain',
      email: 'deepak.jain@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '1984-07-18',
      location: 'Mumbai, India'
    }, { transaction });

    // Marriage relationships
    await DirectRelationship.createBidirectional(rohit.id, rohitWife.id, 'husband', 'wife', transaction);
    await DirectRelationship.createBidirectional(pooja.id, poojaHusband.id, 'wife', 'husband', transaction);
    await DirectRelationship.createBidirectional(ravi.id, raviWife.id, 'husband', 'wife', transaction);
    await DirectRelationship.createBidirectional(neha.id, nehaHusband.id, 'wife', 'husband', transaction);

    // THE MAIN MARRIAGE: Amit + Meera
    await DirectRelationship.createBidirectional(amit.id, meera.id, 'husband', 'wife', transaction);

    // Level -1: Sharma children and extended children
    // Rohit's children
    const rohitSon = await User.create({
      firstName: 'Karan',
      lastName: 'Sharma',
      email: 'karan.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '2012-03-10',
      location: 'Delhi, India',
      fatherId: rohit.id,
      motherId: rohitWife.id
    }, { transaction });

    const rohitDaughter = await User.create({
      firstName: 'Nisha',
      lastName: 'Sharma',
      email: 'nisha.sharma.jr@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '2014-07-18',
      location: 'Delhi, India',
      fatherId: rohit.id,
      motherId: rohitWife.id
    }, { transaction });

    // Pooja's children
    const poojaSon = await User.create({
      firstName: 'Raj',
      lastName: 'Gupta',
      email: 'raj.gupta.jr@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '2013-11-05',
      location: 'Bangalore, India',
      fatherId: poojaHusband.id,
      motherId: pooja.id
    }, { transaction });

    const poojaDaughter = await User.create({
      firstName: 'Priya',
      lastName: 'Gupta',
      email: 'priya.gupta@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '2016-01-20',
      location: 'Bangalore, India',
      fatherId: poojaHusband.id,
      motherId: pooja.id
    }, { transaction });

    // Ravi's children
    const raviSon = await User.create({
      firstName: 'Arjun',
      lastName: 'Sharma',
      email: 'arjun.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '2011-06-12',
      location: 'Mumbai, India',
      fatherId: ravi.id,
      motherId: raviWife.id
    }, { transaction });

    const raviDaughter = await User.create({
      firstName: 'Ananya',
      lastName: 'Sharma',
      email: 'ananya.sharma@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '2013-09-28',
      location: 'Mumbai, India',
      fatherId: ravi.id,
      motherId: raviWife.id
    }, { transaction });

    // Neha's children
    const nehaSon = await User.create({
      firstName: 'Dev',
      lastName: 'Jain',
      email: 'dev.jain@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '2012-04-15',
      location: 'Mumbai, India',
      fatherId: nehaHusband.id,
      motherId: neha.id
    }, { transaction });

    const nehaDaughter = await User.create({
      firstName: 'Arya',
      lastName: 'Jain',
      email: 'arya.jain@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '2014-08-22',
      location: 'Mumbai, India',
      fatherId: nehaHusband.id,
      motherId: neha.id
    }, { transaction });

    // Amit & Meera's children (appear in both family trees)
    const aarav = await User.create({
      firstName: 'Aarav',
      lastName: 'Patel',
      email: 'aarav.patel@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'male',
      dateOfBirth: '2010-04-15',
      location: 'Mumbai, India',
      fatherId: amit.id,
      motherId: meera.id
    }, { transaction });

    const kavya = await User.create({
      firstName: 'Kavya',
      lastName: 'Patel',
      email: 'kavya.patel@family.com',
      password: await bcrypt.hash('FamilyTree123!', 10),
      gender: 'female',
      dateOfBirth: '2012-08-22',
      location: 'Mumbai, India',
      fatherId: amit.id,
      motherId: meera.id
    }, { transaction });

    console.log('✅ Sharma family created successfully!\n');

    await transaction.commit();

    // ===========================================
    // SUMMARY STATISTICS
    // ===========================================
    
    console.log('📊 FAMILY CREATION SUMMARY:');
    console.log('============================');
    
    const totalUsers = await User.count();
    const totalRelationships = await DirectRelationship.count();
    
    console.log(`👥 Total Users Created: ${totalUsers}`);
    console.log(`💕 Total Relationships: ${totalRelationships}`);
    
    console.log('\n🏠 PATEL FAMILY STRUCTURE:');
    console.log('Level 2: Harilal, Savitri (Grandparents)');
    console.log('Level 1: Ramesh, Mallika (Parents) | Suresh, Kiran (Uncle & Aunt)');
    console.log('Level 0: Prashanth, Anjali (Current) | Amit, Priya (Cousins)');
    console.log('Level -1: Arjun, Simran (Children) | Aarav, Kavya (Amit\'s) | Rohan, Ishita (Priya\'s)');
    
    console.log('\n🏠 SHARMA FAMILY STRUCTURE:');
    console.log('Level 2: Mohan, Kamala (Grandparents)');
    console.log('Level 1: Rajesh, Sunita (Parents) | Vinod, Rekha (Uncle & Aunt)');
    console.log('Level 0: Rohit, Meera, Pooja (Siblings) | Ravi, Neha (Cousins)');
    console.log('Level -1: Multiple children across all branches');
    
    console.log('\n💒 MARRIAGE BRIDGE:');
    console.log('Amit Patel (Suresh\'s son) ↔ Meera Sharma (Rajesh\'s daughter)');
    console.log('Children: Aarav, Kavya (appear in both family trees)');
    
    console.log('\n✅ Database population completed successfully!');
    console.log('🚀 You can now test the complex family tree APIs with full multi-generational data.');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error populating families:', error);
    throw error;
  }
}

// Run the population script
if (require.main === module) {
  populateExtendedFamilies()
    .then(() => {
      console.log('\n🎉 Extended families populated successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to populate extended families:', error);
      process.exit(1);
    });
}

module.exports = { populateExtendedFamilies };