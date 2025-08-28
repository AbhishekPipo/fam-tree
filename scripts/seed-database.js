const db = require('../config/database');
const User = require('../src/models/User');
const { Relationship } = require('../src/models/Relationship');
const { Event } = require('../src/models/Event');
const { Post } = require('../src/models/Post');
const { Media } = require('../src/models/Media');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    
    // Connect to database
    await db.connect();
    console.log('✅ Connected to JanusGraph');

    // Clear existing data (optional)
    const g = db.getTraversal();
    console.log('🧹 Clearing existing data...');
    await g.V().drop().iterate();
    console.log('✅ Database cleared');

    // Create the Patel family users
    console.log('👥 Creating Patel family users...');
    const users = [];

    // Create grandparents - Harilal & Savitri Patel
    const harilal = new User({
      firstName: 'Harilal',
      lastName: 'Patel',
      gender: 'male',
      dateOfBirth: '1925-03-15',
      placeOfBirth: 'Ahmedabad, Gujarat, India',
      occupation: 'Retired Businessman',
      biography: 'The patriarch of the Patel family, a successful businessman who built his legacy in Gujarat.',
      isAppUser: true,
      primaryEmail: 'harilal.patel@family.com',
      primaryPhone: '+919876543210',
      currentAddress: 'Ahmedabad, Gujarat, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'married'
    });
    await harilal.save();
    users.push(harilal);

    const savitri = new User({
      firstName: 'Savitri',
      lastName: 'Patel',
      gender: 'female',
      dateOfBirth: '1930-07-20',
      placeOfBirth: 'Ahmedabad, Gujarat, India',
      occupation: 'Homemaker',
      biography: 'The loving matriarch who raised a wonderful family and kept everyone together.',
      isAppUser: true,
      primaryEmail: 'savitri.patel@family.com',
      primaryPhone: '+919876543211',
      currentAddress: 'Ahmedabad, Gujarat, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'married'
    });
    await savitri.save();
    users.push(savitri);

    // Create sons of Harilal & Savitri - Ramesh & Suresh
    const ramesh = new User({
      firstName: 'Ramesh',
      lastName: 'Patel',
      gender: 'male',
      dateOfBirth: '1955-01-10',
      placeOfBirth: 'Ahmedabad, Gujarat, India',
      occupation: 'Engineer',
      biography: 'Senior engineer working in Mumbai, eldest son of Harilal and Savitri.',
      isAppUser: true,
      primaryEmail: 'ramesh.patel@family.com',
      primaryPhone: '+919876543212',
      currentAddress: 'Mumbai, Maharashtra, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'married'
    });
    await ramesh.save();
    users.push(ramesh);

    const mallika = new User({
      firstName: 'Mallika',
      lastName: 'Patel',
      gender: 'female',
      dateOfBirth: '1958-06-20',
      placeOfBirth: 'Mumbai, Maharashtra, India',
      occupation: 'Teacher',
      biography: 'Devoted wife of Ramesh and loving mother, works as a school teacher.',
      isAppUser: true,
      primaryEmail: 'mallika.patel@family.com',
      primaryPhone: '+919876543213',
      currentAddress: 'Mumbai, Maharashtra, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'married'
    });
    await mallika.save();
    users.push(mallika);

    const suresh = new User({
      firstName: 'Suresh',
      lastName: 'Patel',
      gender: 'male',
      dateOfBirth: '1952-09-05',
      placeOfBirth: 'Ahmedabad, Gujarat, India',
      occupation: 'Doctor',
      biography: 'Successful doctor in Pune, younger son of Harilal and Savitri.',
      isAppUser: true,
      primaryEmail: 'suresh.patel@family.com',
      primaryPhone: '+919876543214',
      currentAddress: 'Pune, Maharashtra, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'married'
    });
    await suresh.save();
    users.push(suresh);

    const kiran = new User({
      firstName: 'Kiran',
      lastName: 'Patel',
      gender: 'female',
      dateOfBirth: '1955-12-18',
      placeOfBirth: 'Pune, Maharashtra, India',
      occupation: 'Nurse',
      biography: 'Dedicated nurse and loving wife of Suresh, mother of three.',
      isAppUser: true,
      primaryEmail: 'kiran.patel@family.com',
      primaryPhone: '+919876543215',
      currentAddress: 'Pune, Maharashtra, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'married'
    });
    await kiran.save();
    users.push(kiran);

    // Create children of Ramesh & Mallika
    const prashanth = new User({
      firstName: 'Prashanth',
      lastName: 'Patel',
      gender: 'male',
      dateOfBirth: '1980-05-15',
      placeOfBirth: 'Mumbai, Maharashtra, India',
      occupation: 'Software Engineer',
      biography: 'Tech professional and family man, son of Ramesh and Mallika.',
      isAppUser: true,
      primaryEmail: 'prashanth@family.com',
      primaryPhone: '+919876543216',
      currentAddress: 'Mumbai, Maharashtra, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'married',
      isOnline: true
    });
    await prashanth.save();
    users.push(prashanth);

    const anjali = new User({
      firstName: 'Anjali',
      lastName: 'Patel',
      gender: 'female',
      dateOfBirth: '1982-08-22',
      placeOfBirth: 'Mumbai, Maharashtra, India',
      occupation: 'Designer',
      biography: 'Creative designer and loving wife of Prashanth.',
      isAppUser: true,
      primaryEmail: 'anjali@family.com',
      primaryPhone: '+919876543217',
      currentAddress: 'Mumbai, Maharashtra, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'married'
    });
    await anjali.save();
    users.push(anjali);

    // Create children of Suresh & Kiran
    const amit = new User({
      firstName: 'Amit',
      lastName: 'Patel',
      gender: 'male',
      dateOfBirth: '1983-11-25',
      placeOfBirth: 'Pune, Maharashtra, India',
      occupation: 'Business Analyst',
      biography: 'Analytical professional, son of Suresh and Kiran.',
      isAppUser: true,
      primaryEmail: 'amit@family.com',
      primaryPhone: '+919876543218',
      currentAddress: 'Pune, Maharashtra, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'married'
    });
    await amit.save();
    users.push(amit);

    const priya = new User({
      firstName: 'Priya',
      lastName: 'Patel',
      gender: 'female',
      dateOfBirth: '1986-02-14',
      placeOfBirth: 'Pune, Maharashtra, India',
      occupation: 'Marketing Manager',
      biography: 'Dynamic marketing professional, daughter of Suresh and Kiran.',
      isAppUser: true,
      primaryEmail: 'priya.patel@family.com',
      primaryPhone: '+919876543219',
      currentAddress: 'Pune, Maharashtra, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'married'
    });
    await priya.save();
    users.push(priya);

    // Create spouses
    const vikram = new User({
      firstName: 'Vikram',
      lastName: 'Shah',
      gender: 'male',
      dateOfBirth: '1984-07-30',
      placeOfBirth: 'Pune, Maharashtra, India',
      occupation: 'Architect',
      biography: 'Creative architect and loving husband of Priya.',
      isAppUser: true,
      primaryEmail: 'vikram.shah@family.com',
      primaryPhone: '+919876543220',
      currentAddress: 'Pune, Maharashtra, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'married'
    });
    await vikram.save();
    users.push(vikram);

    const meera = new User({
      firstName: 'Meera',
      lastName: 'Sharma',
      maidenName: 'Sharma',
      gender: 'female',
      dateOfBirth: '1985-04-12',
      placeOfBirth: 'Pune, Maharashtra, India',
      occupation: 'Pharmacist',
      biography: 'Healthcare professional and loving wife of Amit.',
      isAppUser: true,
      primaryEmail: 'meera.sharma@family.com',
      primaryPhone: '+919876543223',
      currentAddress: 'Pune, Maharashtra, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'married'
    });
    await meera.save();
    users.push(meera);

    // Create grandchildren
    const arjun = new User({
      firstName: 'Arjun',
      lastName: 'Patel',
      gender: 'male',
      dateOfBirth: '2005-03-10',
      placeOfBirth: 'Mumbai, Maharashtra, India',
      occupation: 'Student',
      biography: 'Bright young student, son of Prashanth and Anjali.',
      isAppUser: true,
      primaryEmail: 'arjun@family.com',
      primaryPhone: '+919876543221',
      currentAddress: 'Mumbai, Maharashtra, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'single'
    });
    await arjun.save();
    users.push(arjun);

    const simran = new User({
      firstName: 'Simran',
      lastName: 'Patel',
      gender: 'female',
      dateOfBirth: '2008-07-18',
      placeOfBirth: 'Mumbai, Maharashtra, India',
      occupation: 'Student',
      biography: 'Energetic young girl, daughter of Prashanth and Anjali.',
      isAppUser: true,
      primaryEmail: 'simran@family.com',
      primaryPhone: '+919876543222',
      currentAddress: 'Mumbai, Maharashtra, India',
      nationality: 'Indian',
      religion: 'Hindu',
      isAlive: true,
      maritalStatus: 'single'
    });
    await simran.save();
    users.push(simran);

    console.log(`✅ Created ${users.length} users`);

    // Create Patel family relationships
    console.log('💑 Creating Patel family relationships...');

    // Marriage relationships - Generation 1 (Grandparents)
    await new Relationship({
      fromUserId: harilal.id,
      toUserId: savitri.id,
      relationshipType: 'MARRIED_TO',
      properties: {
        marriageDate: '1950-04-10',
        marriagePlace: 'Ahmedabad, Gujarat',
        isVerified: true,
        confidence: 1.0
      },
      createdBy: harilal.id
    }).save();

    // Marriage relationships - Generation 2 (Parents)
    await new Relationship({
      fromUserId: ramesh.id,
      toUserId: mallika.id,
      relationshipType: 'MARRIED_TO',
      properties: {
        marriageDate: '1978-12-05',
        marriagePlace: 'Mumbai, Maharashtra',
        isVerified: true,
        confidence: 1.0
      },
      createdBy: ramesh.id
    }).save();

    await new Relationship({
      fromUserId: suresh.id,
      toUserId: kiran.id,
      relationshipType: 'MARRIED_TO',
      properties: {
        marriageDate: '1975-11-20',
        marriagePlace: 'Pune, Maharashtra',
        isVerified: true,
        confidence: 1.0
      },
      createdBy: suresh.id
    }).save();

    // Marriage relationships - Generation 3 (Children)
    await new Relationship({
      fromUserId: prashanth.id,
      toUserId: anjali.id,
      relationshipType: 'MARRIED_TO',
      properties: {
        marriageDate: '2005-02-18',
        marriagePlace: 'Mumbai, Maharashtra',
        isVerified: true,
        confidence: 1.0
      },
      createdBy: prashanth.id
    }).save();

    await new Relationship({
      fromUserId: amit.id,
      toUserId: meera.id,
      relationshipType: 'MARRIED_TO',
      properties: {
        marriageDate: '2010-03-15',
        marriagePlace: 'Pune, Maharashtra',
        isVerified: true,
        confidence: 1.0
      },
      createdBy: amit.id
    }).save();

    await new Relationship({
      fromUserId: priya.id,
      toUserId: vikram.id,
      relationshipType: 'MARRIED_TO',
      properties: {
        marriageDate: '2008-12-12',
        marriagePlace: 'Pune, Maharashtra',
        isVerified: true,
        confidence: 1.0
      },
      createdBy: priya.id
    }).save();

    // Parent-child relationships - Generation 1 to 2
    await new Relationship({
      fromUserId: harilal.id,
      toUserId: ramesh.id,
      relationshipType: 'FATHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: harilal.id
    }).save();

    await new Relationship({
      fromUserId: harilal.id,
      toUserId: suresh.id,
      relationshipType: 'FATHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: harilal.id
    }).save();

    await new Relationship({
      fromUserId: savitri.id,
      toUserId: ramesh.id,
      relationshipType: 'MOTHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: savitri.id
    }).save();

    await new Relationship({
      fromUserId: savitri.id,
      toUserId: suresh.id,
      relationshipType: 'MOTHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: savitri.id
    }).save();

    // Parent-child relationships - Generation 2 to 3
    await new Relationship({
      fromUserId: ramesh.id,
      toUserId: prashanth.id,
      relationshipType: 'FATHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: ramesh.id
    }).save();

    await new Relationship({
      fromUserId: mallika.id,
      toUserId: prashanth.id,
      relationshipType: 'MOTHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: mallika.id
    }).save();

    await new Relationship({
      fromUserId: suresh.id,
      toUserId: amit.id,
      relationshipType: 'FATHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: suresh.id
    }).save();

    await new Relationship({
      fromUserId: suresh.id,
      toUserId: priya.id,
      relationshipType: 'FATHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: suresh.id
    }).save();

    await new Relationship({
      fromUserId: kiran.id,
      toUserId: amit.id,
      relationshipType: 'MOTHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: kiran.id
    }).save();

    await new Relationship({
      fromUserId: kiran.id,
      toUserId: priya.id,
      relationshipType: 'MOTHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: kiran.id
    }).save();

    // Parent-child relationships - Generation 3 to 4
    await new Relationship({
      fromUserId: prashanth.id,
      toUserId: arjun.id,
      relationshipType: 'FATHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: prashanth.id
    }).save();

    await new Relationship({
      fromUserId: prashanth.id,
      toUserId: simran.id,
      relationshipType: 'FATHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: prashanth.id
    }).save();

    await new Relationship({
      fromUserId: anjali.id,
      toUserId: arjun.id,
      relationshipType: 'MOTHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: anjali.id
    }).save();

    await new Relationship({
      fromUserId: anjali.id,
      toUserId: simran.id,
      relationshipType: 'MOTHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: anjali.id
    }).save();

    // Sibling relationships
    await new Relationship({
      fromUserId: ramesh.id,
      toUserId: suresh.id,
      relationshipType: 'BROTHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: harilal.id
    }).save();

    await new Relationship({
      fromUserId: amit.id,
      toUserId: priya.id,
      relationshipType: 'BROTHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: suresh.id
    }).save();

    await new Relationship({
      fromUserId: arjun.id,
      toUserId: simran.id,
      relationshipType: 'BROTHER_OF',
      properties: { isVerified: true, confidence: 1.0 },
      createdBy: prashanth.id
    }).save();

    console.log('✅ Created family relationships');

    // Create sample events
    console.log('📅 Creating sample events...');

    const events = [];

    const weddingEvent = new Event({
      title: 'Harilal & Savitri Wedding',
      description: 'The beautiful wedding ceremony of Harilal and Savitri',
      eventType: 'marriage',
      date: '1945-05-20T14:00:00Z',
      location: {
        address: 'Patel Community Hall',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India'
      },
      significance: 'high',
      privacy: 'family',
      isVerified: true,
      createdBy: harilal.id
    });
    await weddingEvent.save();
    await weddingEvent.addParticipant(harilal.id, 'groom');
    await weddingEvent.addParticipant(savitri.id, 'bride');
    events.push(weddingEvent);

    const birthEvent = new Event({
      title: 'Arjun\'s Birth',
      description: 'Welcome to the world, Arjun!',
      eventType: 'birth',
      date: '2008-03-10T08:30:00Z',
      location: {
        address: 'Kokilaben Hospital',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India'
      },
      significance: 'high',
      privacy: 'family',
      isVerified: true,
      createdBy: prashanth.id
    });
    await birthEvent.save();
    await birthEvent.addParticipant(arjun.id, 'subject');
    await birthEvent.addParticipant(prashanth.id, 'parent');
    await birthEvent.addParticipant(anjali.id, 'parent');
    events.push(birthEvent);

    const graduationEvent = new Event({
      title: 'Prashanth\'s Engineering Graduation',
      description: 'Prashanth graduates with honors from IIT Bombay',
      eventType: 'graduation',
      date: '2003-05-15T15:00:00Z',
      location: {
        address: 'IIT Bombay',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India'
      },
      significance: 'high',
      privacy: 'family',
      isVerified: true,
      createdBy: prashanth.id
    });
    await graduationEvent.save();
    await graduationEvent.addParticipant(prashanth.id, 'graduate');
    await graduationEvent.addParticipant(ramesh.id, 'attendee');
    await graduationEvent.addParticipant(mallika.id, 'attendee');
    events.push(graduationEvent);

    console.log(`✅ Created ${events.length} events`);

    // Create sample posts
    console.log('📱 Creating sample posts...');

    const posts = [];

    const memoryPost = new Post({
      content: 'Found this beautiful photo from our wedding day 75+ years ago! Time flies but love remains strong. ❤️',
      title: 'Wedding Memory',
      type: 'memory',
      visibility: 'family',
      isMemory: true,
      significance: 'high',
      eventDate: '1945-05-20',
      authorId: harilal.id,
      tags: ['wedding', 'memory', '1940s', 'love'],
      location: { city: 'Ahmedabad', state: 'Gujarat' }
    });
    await memoryPost.save();
    posts.push(memoryPost);

    const announcementPost = new Post({
      content: 'Excited to announce that Arjun made the Dean\'s List this semester! So proud of our son! 🎓',
      title: 'Academic Achievement',
      type: 'announcement',
      visibility: 'family',
      isAnnouncement: true,
      significance: 'medium',
      authorId: prashanth.id,
      tags: ['education', 'achievement', 'pride'],
      mentionedUsers: [arjun.id]
    });
    await announcementPost.save();
    posts.push(announcementPost);

    const familyPost = new Post({
      content: 'Had the most wonderful family dinner tonight. Four generations around one table - these are the moments that matter most. 🍽️👨‍👩‍👧‍👦',
      type: 'text',
      visibility: 'family',
      significance: 'medium',
      authorId: mallika.id,
      tags: ['family', 'dinner', 'togetherness'],
      mentionedUsers: [harilal.id, savitri.id, ramesh.id, prashanth.id, arjun.id, simran.id]
    });
    await familyPost.save();
    posts.push(familyPost);

    const recipePost = new Post({
      content: `Here's Savitri Nani's famous Gujarati Dhokla recipe that's been in our family for generations:

Ingredients:
- 2 cups gram flour (besan)
- 1 cup water
- 1 tsp ginger-green chili paste
- 1 tsp lemon juice
- Salt to taste
- 1 tsp fruit salt (Eno)
- Mustard seeds and curry leaves for tempering

Instructions:
1. Mix gram flour with water to make smooth batter
2. Add ginger-chili paste, lemon juice, and salt
3. Add fruit salt and mix gently
4. Steam for 15-20 minutes
5. Temper with mustard seeds and curry leaves

This recipe has brought our family together for decades! 🍛`,
      title: 'Nani\'s Famous Gujarati Dhokla',
      type: 'recipe',
      visibility: 'family',
      isRecipe: true,
      significance: 'medium',
      authorId: savitri.id,
      tags: ['recipe', 'dhokla', 'family tradition', 'gujarati', 'cooking'],
      category: 'family recipes'
    });
    await recipePost.save();
    posts.push(recipePost);

    console.log(`✅ Created ${posts.length} posts`);

    // Add some likes and comments to posts
    console.log('👍 Adding interactions...');
    await memoryPost.addLike(ramesh.id);
    await memoryPost.addLike(mallika.id);
    await memoryPost.addLike(prashanth.id);
    await memoryPost.addLike(anjali.id);

    await announcementPost.addLike(harilal.id);
    await announcementPost.addLike(savitri.id);
    await announcementPost.addLike(anjali.id);

    await familyPost.addLike(harilal.id);
    await familyPost.addLike(savitri.id);
    await familyPost.addLike(arjun.id);

    await recipePost.addLike(ramesh.id);
    await recipePost.addLike(mallika.id);
    await recipePost.addLike(priya.id);

    // Add some comments
    await memoryPost.addComment({
      content: 'What a beautiful photo! You both look so happy and young. ❤️',
      authorId: mallika.id
    });

    await announcementPost.addComment({
      content: 'Thanks Papa! Couldn\'t have done it without your support! 📚',
      authorId: arjun.id
    });

    await familyPost.addComment({
      content: 'These family dinners are the highlight of my week! Love you all! 💕',
      authorId: simran.id
    });

    await recipePost.addComment({
      content: 'I need to learn how to make this! Can you teach me next time I visit? 👩‍🍳',
      authorId: priya.id
    });

    console.log('✅ Added likes and comments');

    // Create sample media
    console.log('📸 Creating sample media...');

    const weddingPhoto = new Media({
      filename: 'wedding-1945.jpg',
      originalName: 'harilal-savitri-wedding.jpg',
      mimeType: 'image/jpeg',
      mediaType: 'image',
      size: 2500000,
      url: '/uploads/wedding-1945.jpg',
      title: 'Harilal & Savitri Wedding Photo',
      description: 'Beautiful wedding photo from 1945',
      tags: ['wedding', 'vintage', '1940s', 'black and white'],
      visibility: 'family',
      uploadedBy: harilal.id,
      dateTaken: '1945-05-20T14:30:00Z',
      peopleTagged: [harilal.id, savitri.id],
      eventsLinked: [weddingEvent.id],
      historicalPeriod: '1940s',
      decade: '1940s'
    });
    await weddingPhoto.save();

    const familyDinnerPhoto = new Media({
      filename: 'family-dinner-2024.jpg',
      originalName: 'patel-family-dinner.jpg',
      mimeType: 'image/jpeg',
      mediaType: 'image',
      size: 4200000,
      url: '/uploads/family-dinner-2024.jpg',
      title: 'Patel Family Dinner 2024',
      description: 'Four generations enjoying dinner together',
      tags: ['family', 'dinner', 'festival', 'togetherness', 'gujarati'],
      visibility: 'family',
      uploadedBy: mallika.id,
      dateTaken: '2024-01-15T18:00:00Z',
      peopleTagged: [harilal.id, savitri.id, ramesh.id, mallika.id, prashanth.id, anjali.id, arjun.id, simran.id]
    });
    await familyDinnerPhoto.save();

    console.log('✅ Created sample media');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${users.length} (Patel Family - 4 generations)`);
    console.log(`💑 Relationships: 14 (marriages, parent-child, siblings)`);
    console.log(`📅 Events: ${events.length}`);
    console.log(`📱 Posts: ${posts.length}`);
    console.log(`📸 Media: 2`);
    console.log(`👍 Interactions: Multiple likes and comments`);

    console.log('\n🔐 Login Credentials (Patel Family):');
    console.log('Email: harilal.patel@email.com | Password: password123 | Phone: +91-9876543210');
    console.log('Email: savitri.patel@email.com | Password: password123 | Phone: +91-9876543211');
    console.log('Email: ramesh.patel@email.com | Password: password123 | Phone: +91-9876543212');
    console.log('Email: mallika.patel@email.com | Password: password123 | Phone: +91-9876543213');
    console.log('Email: suresh.patel@email.com | Password: password123 | Phone: +91-9876543214');
    console.log('Email: kiran.patel@email.com | Password: password123 | Phone: +91-9876543215');
    console.log('Email: prashanth.patel@email.com | Password: password123 | Phone: +91-9876543216');
    console.log('Email: anjali.patel@email.com | Password: password123 | Phone: +91-9876543217');
    console.log('Email: amit.patel@email.com | Password: password123 | Phone: +91-9876543218');
    console.log('Email: meera.patel@email.com | Password: password123 | Phone: +91-9876543219');
    console.log('Email: priya.patel@email.com | Password: password123 | Phone: +91-9876543220');
    console.log('Email: vikram.patel@email.com | Password: password123 | Phone: +91-9876543221');
    console.log('Email: arjun.patel@email.com | Password: password123 | Phone: +91-9876543222');
    console.log('Email: simran.patel@email.com | Password: password123 | Phone: +91-9876543223');

    console.log('\n🚀 You can now:');
    console.log('1. Start the API server: npm start');
    console.log('2. Visit API docs: http://localhost:3000/api-docs');
    console.log('3. Test the family tree endpoints');
    console.log('4. Explore the social feed');
    console.log('5. View events and media');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await db.disconnect();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n✨ Database seeding finished!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;