# Meera's Complex Family Tree Structure

## Meera's Family - Same Complexity as Prashanth's

Just like Prashanth has a multi-generational family with grandparents, parents, uncles, cousins, etc., Meera's family (the Sharma family) should have the same depth and complexity.

## Meera's Complete Family Structure

### **Sharma Family Tree (Meera's Side)**

```
                    Mohan Sharma ═══════ Kamala Sharma
                   (Meera's Grandfather) (Meera's Grandmother)
                           │                      │
                           └──────────┬───────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              Rajesh Sharma ═══ Sunita Sharma    Vinod Sharma
               (Meera's Father) (Meera's Mother)  (Meera's Uncle)
                    │                │                │
                    └──────┬─────────┘                │
                          │                          │
                          │                     ┌────┴────┐
                          │                     │         │
                     ┌────┼────┐            Ravi      Neha
                     │    │    │           (Cousin)  (Cousin)
                 Rohit  Meera  Pooja         │         │
               (Brother) (ME) (Sister)       │         │
                    │     │     │            │    ┌────┴────┐
                    │     │     │            │    │         │
               ┌────┴──┐  │  ┌──┴───┐   ┌────┴──┐ Dev    Arya
               │       │  │  │      │   │       │ (Neha's (Neha's
           Karan    Nisha │ Raj   Priya │    Kavita Son)  Daughter)
         (Rohit's (Rohit's│(Pooja's (Pooja's│  (Ravi's
           Son)  Daughter)│  Son)  Daughter)│   Wife)
                         │                 │
                    ┌────┴────┐       ┌────┴────┐
                    │         │       │         │
                Aarav      Kavya   Arjun    Ananya
              (Meera's   (Meera's (Ravi's  (Ravi's
                Son)    Daughter)  Son)   Daughter)
```

## API Calls to Create Meera's Complex Family

### Step 1: Login as Meera and Create Her Grandparents

```bash
# Login as Meera
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "meera.sharma@family.com",
    "password": "TempPassword123!"
  }'

# Add Meera's Grandfather
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <MEERA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Mohan",
    "lastName": "Sharma",
    "email": "mohan.sharma@family.com",
    "relationshipType": "grandfather",
    "gender": "male",
    "dateOfBirth": "1925-03-15",
    "location": "Delhi, India"
  }'

# Add Meera's Grandmother
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <MEERA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Kamala",
    "lastName": "Sharma",
    "email": "kamala.sharma@family.com",
    "relationshipType": "grandmother",
    "gender": "female",
    "dateOfBirth": "1930-07-20",
    "location": "Delhi, India"
  }'
```

### Step 2: Add Parents and Uncle

```bash
# Add Meera's Father
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <MEERA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Rajesh",
    "lastName": "Sharma",
    "email": "rajesh.sharma@family.com",
    "relationshipType": "father",
    "gender": "male",
    "dateOfBirth": "1955-01-10",
    "location": "Delhi, India"
  }'

# Add Meera's Mother
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <MEERA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Sunita",
    "lastName": "Sharma",
    "email": "sunita.sharma@family.com",
    "relationshipType": "mother",
    "gender": "female",
    "dateOfBirth": "1958-06-20",
    "location": "Delhi, India"
  }'

# Add Meera's Uncle (Father's brother)
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <MEERA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Vinod",
    "lastName": "Sharma",
    "email": "vinod.sharma@family.com",
    "relationshipType": "uncle",
    "gender": "male",
    "dateOfBirth": "1952-09-05",
    "location": "Mumbai, India"
  }'
```

### Step 3: Add Siblings

```bash
# Add Meera's Brother
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <MEERA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Rohit",
    "lastName": "Sharma",
    "email": "rohit.sharma@family.com",
    "relationshipType": "brother",
    "gender": "male",
    "dateOfBirth": "1985-09-12",
    "location": "Delhi, India"
  }'

# Add Meera's Sister
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <MEERA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Pooja",
    "lastName": "Sharma",
    "email": "pooja.sharma@family.com",
    "relationshipType": "sister",
    "gender": "female",
    "dateOfBirth": "1988-04-18",
    "location": "Bangalore, India"
  }'
```

### Step 4: Add Uncle's Children (Cousins)

```bash
# Add Cousin Ravi (Uncle's son)
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <MEERA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ravi",
    "lastName": "Sharma",
    "email": "ravi.sharma@family.com",
    "relationshipType": "cousin",
    "gender": "male",
    "dateOfBirth": "1983-11-25",
    "location": "Mumbai, India",
    "fatherName": "Vinod"
  }'

# Add Cousin Neha (Uncle's daughter)
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <MEERA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Neha",
    "lastName": "Sharma",
    "email": "neha.sharma@family.com",
    "relationshipType": "cousin",
    "gender": "female",
    "dateOfBirth": "1986-02-14",
    "location": "Mumbai, India",
    "fatherName": "Vinod"
  }'
```

### Step 5: Add Spouses for Extended Family

```bash
# Login as Rohit and add his wife
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rohit.sharma@family.com",
    "password": "TempPassword123!"
  }'

curl -X POST http://localhost:3000/api/family/spouse \
  -H "Authorization: Bearer <ROHIT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Nisha",
    "lastName": "Sharma",
    "email": "nisha.sharma@family.com",
    "gender": "female",
    "dateOfBirth": "1987-12-08",
    "location": "Delhi, India"
  }'

# Login as Pooja and add her husband
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pooja.sharma@family.com",
    "password": "TempPassword123!"
  }'

curl -X POST http://localhost:3000/api/family/spouse \
  -H "Authorization: Bearer <POOJA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Raj",
    "lastName": "Gupta",
    "email": "raj.gupta@family.com",
    "gender": "male",
    "dateOfBirth": "1985-05-22",
    "location": "Bangalore, India"
  }'

# Login as Ravi and add his wife
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ravi.sharma@family.com",
    "password": "TempPassword123!"
  }'

curl -X POST http://localhost:3000/api/family/spouse \
  -H "Authorization: Bearer <RAVI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Kavita",
    "lastName": "Sharma",
    "email": "kavita.sharma@family.com",
    "gender": "female",
    "dateOfBirth": "1985-08-30",
    "location": "Mumbai, India"
  }'
```

### Step 6: Add Children to Extended Family

```bash
# Add Rohit's children
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <ROHIT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Karan",
    "lastName": "Sharma",
    "email": "karan.sharma@family.com",
    "relationshipType": "son",
    "gender": "male",
    "dateOfBirth": "2012-03-10",
    "location": "Delhi, India"
  }'

curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <ROHIT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Nisha",
    "lastName": "Sharma",
    "email": "nisha.sharma.jr@family.com",
    "relationshipType": "daughter",
    "gender": "female",
    "dateOfBirth": "2014-07-18",
    "location": "Delhi, India"
  }'

# Add Pooja's children
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <POOJA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Raj",
    "lastName": "Gupta",
    "email": "raj.gupta.jr@family.com",
    "relationshipType": "son",
    "gender": "male",
    "dateOfBirth": "2013-11-05",
    "location": "Bangalore, India"
  }'

curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <POOJA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Priya",
    "lastName": "Gupta",
    "email": "priya.gupta@family.com",
    "relationshipType": "daughter",
    "gender": "female",
    "dateOfBirth": "2016-01-20",
    "location": "Bangalore, India"
  }'

# Add Ravi's children
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <RAVI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Arjun",
    "lastName": "Sharma",
    "email": "arjun.sharma@family.com",
    "relationshipType": "son",
    "gender": "male",
    "dateOfBirth": "2011-06-12",
    "location": "Mumbai, India"
  }'

curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <RAVI_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ananya",
    "lastName": "Sharma",
    "email": "ananya.sharma@family.com",
    "relationshipType": "daughter",
    "gender": "female",
    "dateOfBirth": "2013-09-28",
    "location": "Mumbai, India"
  }'
```

## How This Appears in Different Contexts

### 1. From Meera's Perspective (Her Primary Tree)

```bash
curl -X GET http://localhost:3000/api/family/tree \
  -H "Authorization: Bearer <MEERA_TOKEN>"
```

**Result Structure:**
```json
{
  "currentUser": { "firstName": "Meera", "relationship": "ME" },
  "ancestors": [
    { "user": { "firstName": "Mohan" }, "relationship": "grandfather", "level": 2 },
    { "user": { "firstName": "Kamala" }, "relationship": "grandmother", "level": 2 },
    { "user": { "firstName": "Rajesh" }, "relationship": "father", "level": 1 },
    { "user": { "firstName": "Sunita" }, "relationship": "mother", "level": 1 },
    {
      "user": { "firstName": "Vinod" }, 
      "relationship": "uncle", 
      "level": 1,
      "children": [
        {
          "user": { "firstName": "Ravi" }, 
          "relationship": "cousin",
          "children": [
            { "user": { "firstName": "Arjun" }, "relationship": "cousin's son" },
            { "user": { "firstName": "Ananya" }, "relationship": "cousin's daughter" }
          ]
        },
        {
          "user": { "firstName": "Neha" }, 
          "relationship": "cousin",
          "children": [
            { "user": { "firstName": "Dev" }, "relationship": "cousin's son" },
            { "user": { "firstName": "Arya" }, "relationship": "cousin's daughter" }
          ]
        }
      ]
    }
  ],
  "adjacent": [
    { "user": { "firstName": "Amit" }, "relationship": "husband" },
    {
      "user": { "firstName": "Rohit" }, 
      "relationship": "brother",
      "children": [
        { "user": { "firstName": "Karan" }, "relationship": "nephew" },
        { "user": { "firstName": "Nisha" }, "relationship": "niece" }
      ]
    },
    {
      "user": { "firstName": "Pooja" }, 
      "relationship": "sister",
      "children": [
        { "user": { "firstName": "Raj" }, "relationship": "nephew" },
        { "user": { "firstName": "Priya" }, "relationship": "niece" }
      ]
    }
  ],
  "descendants": [
    { "user": { "firstName": "Aarav" }, "relationship": "son", "level": -1 },
    { "user": { "firstName": "Kavya" }, "relationship": "daughter", "level": -1 }
  ]
}
```

### 2. From Amit's Perspective (Meera's Family as In-Laws)

```bash
curl -X GET http://localhost:3000/api/family/tree/in-laws/<MEERA_ID> \
  -H "Authorization: Bearer <AMIT_TOKEN>"
```

**Result Structure:**
```json
{
  "context": "in-laws",
  "currentUser": { "firstName": "Meera", "isSpouse": true },
  "ancestors": [
    { "user": { "firstName": "Mohan" }, "relationship": "grandfather-in-law", "isInLaw": true },
    { "user": { "firstName": "Kamala" }, "relationship": "grandmother-in-law", "isInLaw": true },
    { "user": { "firstName": "Rajesh" }, "relationship": "father-in-law", "isInLaw": true },
    { "user": { "firstName": "Sunita" }, "relationship": "mother-in-law", "isInLaw": true },
    {
      "user": { "firstName": "Vinod" }, 
      "relationship": "uncle-in-law", 
      "isInLaw": true,
      "children": [
        { "user": { "firstName": "Ravi" }, "relationship": "cousin-in-law", "isInLaw": true },
        { "user": { "firstName": "Neha" }, "relationship": "cousin-in-law", "isInLaw": true }
      ]
    }
  ],
  "adjacent": [
    { "user": { "firstName": "Rohit" }, "relationship": "brother-in-law", "isInLaw": true },
    { "user": { "firstName": "Pooja" }, "relationship": "sister-in-law", "isInLaw": true }
  ]
}
```

### 3. From Prashanth's Perspective (Extended In-Laws)

```bash
curl -X GET "http://localhost:3000/api/family/tree/extended?includeInLaws=true" \
  -H "Authorization: Bearer <PRASHANTH_TOKEN>"
```

**Result includes:**
```json
{
  "extendedInLaws": [
    {
      "throughMember": { "firstName": "Amit", "relationship": "cousin" },
      "inLawTree": {
        "ancestors": [
          { "user": { "firstName": "Mohan" }, "relationship": "grandfather-in-law" },
          { "user": { "firstName": "Vinod" }, "relationship": "uncle-in-law" }
        ]
      },
      "relationship": "cousin's spouse's family"
    }
  ]
}
```

## Visual Representation

The complete family structure would show:

```
Prashanth's Extended View:
├── Patel Family (Primary)
│   └── Suresh → Amit ═══ Meera
│       └── Children: Aarav, Kavya
└── Sharma Family (Through Amit's Marriage)
    ├── Grandparents: Mohan, Kamala
    ├── Parents: Rajesh, Sunita  
    ├── Uncle: Vinod
    │   ├── Ravi ═══ Kavita → Children: Arjun, Ananya
    │   └── Neha → Children: Dev, Arya
    ├── Siblings: Rohit, Pooja
    │   ├── Rohit ═══ Nisha → Children: Karan, Nisha Jr.
    │   └── Pooja ═══ Raj → Children: Raj Jr., Priya
    └── Meera ═══ Amit → Children: Aarav, Kavya
```

This creates a rich, multi-generational family network where:
- ✅ **Meera has the same family complexity as Prashanth**
- ✅ **Multiple generations with grandparents, uncles, cousins**
- ✅ **Extended family members with their own spouses and children**
- ✅ **Proper in-law relationship handling at all levels**
- ✅ **Children connected upstream to their actual parents**
- ✅ **On-demand access to different family tree contexts**