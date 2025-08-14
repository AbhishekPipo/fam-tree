// Complete Family Tree Import for Neo4j
// Run these commands in Neo4j Browser or cypher-shell

// 1. Clear existing data (CAUTION: This will delete all data)
MATCH (n) DETACH DELETE n;

// 2. Create Indexes for Performance
CREATE INDEX person_id FOR (p:Person) ON (p.id);
CREATE INDEX person_name FOR (p:Person) ON (p.firstName, p.lastName);
CREATE INDEX person_gender FOR (p:Person) ON (p.gender);

// 3. Create All Family Members
CREATE 
  (harilal:Person {id: 32, firstName: "Harilal", lastName: "Patel", gender: "Male", dateOfBirth: "1925-03-15", location: "Ahmedabad, Gujarat, India", createdAt: datetime()}),
  (savitri:Person {id: 33, firstName: "Savitri", lastName: "Patel", gender: "Female", dateOfBirth: "1930-07-20", location: "Ahmedabad, Gujarat, India", createdAt: datetime()}),
  (ramesh:Person {id: 34, firstName: "Ramesh", lastName: "Patel", gender: "Male", dateOfBirth: "1955-01-10", location: "Mumbai, Maharashtra, India", createdAt: datetime()}),
  (mallika:Person {id: 35, firstName: "Mallika", lastName: "Patel", gender: "Female", dateOfBirth: "1958-06-20", location: "Mumbai, Maharashtra, India", createdAt: datetime()}),
  (suresh:Person {id: 36, firstName: "Suresh", lastName: "Patel", gender: "Male", dateOfBirth: "1952-09-05", location: "Pune, Maharashtra, India", createdAt: datetime()}),
  (kiran:Person {id: 37, firstName: "Kiran", lastName: "Patel", gender: "Female", location: "Pune, Maharashtra, India", createdAt: datetime()}),
  (prashanth:Person {id: 38, firstName: "Prashanth", lastName: "Patel", gender: "Male", dateOfBirth: "1980-05-15", location: "Mumbai, Maharashtra, India", email: "prashanth@family.com", profilePicture: null, isOnline: true, createdAt: datetime()}),
  (anjali:Person {id: 39, firstName: "Anjali", lastName: "Patel", gender: "Female", dateOfBirth: "1982-08-22", location: "Mumbai, Maharashtra, India", email: "anjali@family.com", createdAt: datetime()}),
  (amit:Person {id: 40, firstName: "Amit", lastName: "Patel", gender: "Male", dateOfBirth: "1983-11-25", location: "Pune, Maharashtra, India", email: "amit@family.com", createdAt: datetime()}),
  (priya:Person {id: 41, firstName: "Priya", lastName: "Patel", gender: "Female", dateOfBirth: "1986-02-14", location: "Pune, Maharashtra, India", email: "priya.patel@family.com", createdAt: datetime()}),
  (vikram:Person {id: 42, firstName: "Vikram", lastName: "Shah", gender: "Male", createdAt: datetime()}),
  (arjun:Person {id: 43, firstName: "Arjun", lastName: "Patel", gender: "Male", dateOfBirth: "2005-03-10", location: "Mumbai, Maharashtra, India", email: "arjun@family.com", createdAt: datetime()}),
  (simran:Person {id: 44, firstName: "Simran", lastName: "Patel", gender: "Female", dateOfBirth: "2008-07-18", location: "Mumbai, Maharashtra, India", email: "simran@family.com", createdAt: datetime()}),
  (meera:Person {id: 55, firstName: "Meera", lastName: "Sharma", gender: "Female", createdAt: datetime()}),

  // Grandparents Marriage
  (harilal)-[:MARRIED_TO]->(savitri),
  (savitri)-[:MARRIED_TO]->(harilal),
  
  // Parents Generation Marriages
  (ramesh)-[:MARRIED_TO]->(mallika),
  (mallika)-[:MARRIED_TO]->(ramesh),
  (suresh)-[:MARRIED_TO]->(kiran),
  (kiran)-[:MARRIED_TO]->(suresh),
  
  // Current Generation Marriages
  (prashanth)-[:MARRIED_TO]->(anjali),
  (anjali)-[:MARRIED_TO]->(prashanth),
  (amit)-[:MARRIED_TO]->(meera),
  (meera)-[:MARRIED_TO]->(amit),
  (priya)-[:MARRIED_TO]->(vikram),
  (vikram)-[:MARRIED_TO]->(priya),
  
  // Grandparents to Parents
  (harilal)-[:FATHER_OF]->(ramesh),
  (harilal)-[:FATHER_OF]->(suresh),
  (savitri)-[:MOTHER_OF]->(ramesh),
  (savitri)-[:MOTHER_OF]->(suresh),
  
  // Parents to Children
  (ramesh)-[:FATHER_OF]->(prashanth),
  (mallika)-[:MOTHER_OF]->(prashanth),
  (suresh)-[:FATHER_OF]->(amit),
  (suresh)-[:FATHER_OF]->(priya),
  (kiran)-[:MOTHER_OF]->(amit),
  (kiran)-[:MOTHER_OF]->(priya),
  
  // Children to Grandchildren
  (prashanth)-[:FATHER_OF]->(arjun),
  (prashanth)-[:FATHER_OF]->(simran),
  (anjali)-[:MOTHER_OF]->(arjun),
  (anjali)-[:MOTHER_OF]->(simran);

// 4. Verification Queries

// Count all persons
MATCH (p:Person) RETURN count(p) as totalPersons;

// Count relationships by type
MATCH ()-[r]->() RETURN type(r) as relationshipType, count(r) as count ORDER BY count DESC;

// Show family structure (parents and their children)
MATCH (p:Person)
OPTIONAL MATCH (p)-[:FATHER_OF|MOTHER_OF]->(child:Person)
RETURN p.firstName + ' ' + p.lastName as person, 
       collect(child.firstName + ' ' + child.lastName) as children
ORDER BY p.id;

// Find all marriages
MATCH (p1:Person)-[:MARRIED_TO]->(p2:Person)
WHERE p1.id < p2.id  // Avoid duplicate pairs
RETURN p1.firstName + ' ' + p1.lastName + ' married to ' + p2.firstName + ' ' + p2.lastName as marriages;

// Get Prashanth's extended family (3 degrees of separation)
MATCH (prashanth:Person {id: 38})-[*1..3]-(family:Person)
RETURN DISTINCT prashanth.firstName as center, 
       collect(DISTINCT family.firstName + ' ' + family.lastName) as connectedFamily;

// Show family tree hierarchy
MATCH (grandparent:Person)-[:FATHER_OF|MOTHER_OF]->(parent:Person)-[:FATHER_OF|MOTHER_OF]->(child:Person)
RETURN grandparent.firstName + ' ' + grandparent.lastName as grandparent,
       parent.firstName + ' ' + parent.lastName as parent,
       child.firstName + ' ' + child.lastName as child
ORDER BY grandparent.id, parent.id, child.id;

// Find siblings (people who share the same parents)
MATCH (p1:Person)<-[:FATHER_OF|MOTHER_OF]-(parent:Person)-[:FATHER_OF|MOTHER_OF]->(p2:Person)
WHERE p1.id < p2.id  // Avoid duplicate pairs
RETURN p1.firstName + ' ' + p1.lastName + ' and ' + p2.firstName + ' ' + p2.lastName as siblings,
       parent.firstName + ' ' + parent.lastName as parent;