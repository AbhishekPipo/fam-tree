# In-Law Family Tree System

## Scenario: Amit (Suresh's son) Marries Meera

This document demonstrates how the family tree system handles complex in-law relationships when extended family members get married.

## Current Family Structure

```
Prashanth's Family Tree:
├── Ramesh (Father) ═══ Mallika (Mother)
│   └── Prashanth (ME) ═══ Anjali (Wife)
│       ├── Arjun (Son)
│       └── Simran (Daughter)
└── Suresh (Uncle)
    ├── Amit (Cousin) ← Gets married to Meera
    └── Priya (Cousin)
```

## Step 1: Add Meera as Amit's Wife

When Amit marries Meera, we need to:

1. **Create Meera as a user**
2. **Establish marriage relationship between Amit and Meera**
3. **Handle Meera's separate family tree**

### API Call to Add Meera as Amit's Spouse

```bash
# First, login as Amit
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "amit@family.com",
    "password": "FamilyTree123!"
  }'

# Add Meera as Amit's spouse
curl -X POST http://localhost:3000/api/family/spouse \
  -H "Authorization: Bearer <AMIT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Meera",
    "lastName": "Sharma",
    "email": "meera.sharma@family.com",
    "gender": "female",
    "dateOfBirth": "1982-03-15",
    "location": "Mumbai, India"
  }'
```

## Step 2: Create Meera's Family Tree

Meera has her own family that should be accessible on-demand:

```bash
# Login as Meera to create her family tree
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "meera.sharma@family.com",
    "password": "TempPassword123!"
  }'

# Add Meera's father
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <MEERA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Rajesh",
    "lastName": "Sharma",
    "email": "rajesh.sharma@family.com",
    "relationshipType": "father",
    "gender": "male",
    "dateOfBirth": "1950-01-10",
    "location": "Delhi, India"
  }'

# Add Meera's mother
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <MEERA_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Sunita",
    "lastName": "Sharma",
    "email": "sunita.sharma@family.com",
    "relationshipType": "mother",
    "gender": "female",
    "dateOfBirth": "1955-06-20",
    "location": "Delhi, India"
  }'

# Add Meera's brother
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
```

## Step 3: Add Children to Amit and Meera

```bash
# Login as Amit and add their children
curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <AMIT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Aarav",
    "lastName": "Patel",
    "email": "aarav.patel@family.com",
    "relationshipType": "son",
    "gender": "male",
    "dateOfBirth": "2010-04-15",
    "location": "Mumbai, India"
  }'

curl -X POST http://localhost:3000/api/family/member \
  -H "Authorization: Bearer <AMIT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Kavya",
    "lastName": "Patel",
    "email": "kavya.patel@family.com",
    "relationshipType": "daughter",
    "gender": "female",
    "dateOfBirth": "2012-08-22",
    "location": "Mumbai, India"
  }'
```

## Step 4: How Different Users See the Family Tree

### 1. Prashanth's View (Primary Tree)

```bash
curl -X GET http://localhost:3000/api/family/tree \
  -H "Authorization: Bearer <PRASHANTH_TOKEN>"
```

**Result:**
```json
{
  "success": true,
  "data": {
    "currentUser": {
      "id": 3,
      "firstName": "Prashanth",
      "relationship": "ME"
    },
    "ancestors": [
      {
        "user": { "firstName": "Suresh", "relationship": "uncle" },
        "children": [
          {
            "user": { "firstName": "Amit", "relationship": "cousin" },
            "directRelationships": [
              { "partner": { "firstName": "Meera" }, "relationshipType": "husband" }
            ],
            "children": [
              { "user": { "firstName": "Aarav" }, "relationship": "cousin's son" },
              { "user": { "firstName": "Kavya" }, "relationship": "cousin's daughter" }
            ]
          }
        ]
      }
    ]
  }
}
```

### 2. Prashanth's Extended View (Including In-Laws)

```bash
curl -X GET "http://localhost:3000/api/family/tree/extended?includeInLaws=true" \
  -H "Authorization: Bearer <PRASHANTH_TOKEN>"
```

**Result:**
```json
{
  "success": true,
  "data": {
    "currentUser": { "firstName": "Prashanth" },
    "ancestors": [...],
    "extendedInLaws": [
      {
        "throughMember": { "firstName": "Amit", "relationship": "cousin" },
        "inLawTree": {
          "currentUser": { "firstName": "Meera", "relationshipToUser": "spouse" },
          "ancestors": [
            { "user": { "firstName": "Rajesh" }, "relationship": "father-in-law", "isInLaw": true },
            { "user": { "firstName": "Sunita" }, "relationship": "mother-in-law", "isInLaw": true }
          ],
          "adjacent": [
            { "user": { "firstName": "Rohit" }, "relationship": "brother-in-law", "isInLaw": true }
          ]
        },
        "relationship": "cousin's spouse's family"
      }
    ]
  }
}
```

### 3. Meera's Family Tree (From Her Perspective)

```bash
curl -X GET http://localhost:3000/api/family/tree \
  -H "Authorization: Bearer <MEERA_TOKEN>"
```

**Result:**
```json
{
  "success": true,
  "data": {
    "currentUser": {
      "firstName": "Meera",
      "relationship": "ME"
    },
    "ancestors": [
      { "user": { "firstName": "Rajesh" }, "relationship": "father" },
      { "user": { "firstName": "Sunita" }, "relationship": "mother" }
    ],
    "adjacent": [
      { "user": { "firstName": "Amit" }, "relationship": "husband" },
      { "user": { "firstName": "Rohit" }, "relationship": "brother" }
    ],
    "descendants": [
      { "user": { "firstName": "Aarav" }, "relationship": "son" },
      { "user": { "firstName": "Kavya" }, "relationship": "daughter" }
    ]
  }
}
```

### 4. Get Meera's Family Tree as In-Laws (From Amit's Perspective)

```bash
curl -X GET http://localhost:3000/api/family/tree/in-laws/<MEERA_ID> \
  -H "Authorization: Bearer <AMIT_TOKEN>"
```

**Result:**
```json
{
  "success": true,
  "data": {
    "currentUser": { "firstName": "Meera", "isSpouse": true },
    "ancestors": [
      { "user": { "firstName": "Rajesh" }, "relationship": "father-in-law", "isInLaw": true },
      { "user": { "firstName": "Sunita" }, "relationship": "mother-in-law", "isInLaw": true }
    ],
    "adjacent": [
      { "user": { "firstName": "Rohit" }, "relationship": "brother-in-law", "isInLaw": true }
    ],
    "context": "in-laws",
    "spouseId": "<MEERA_ID>",
    "primaryUserId": "<AMIT_ID>"
  }
}
```

## Visual Tree Structure

### Complete Extended Family Tree

```
                    Rajesh ═══ Sunita           Grandfather ═══ Grandmother
                   (Meera's    (Meera's              │                │
                    Father)    Mother)               └────────┬───────┘
                       │          │                          │
                       └────┬─────┘                          │
                            │                    ┌───────────┼───────────┐
                            │                    │           │           │
                       ┌────┴────┐         Ramesh ═══ Mallika      Suresh
                       │         │         (Father)  (Mother)      (Uncle)
                   Rohit      Meera ═══════ Amit                      │
                 (Brother)    (Wife)    (Cousin)                     │
                                 │                               ┌───┴───┐
                                 │                               │       │
                            ┌────┴────┐                      Amit    Priya
                            │         │                   (Cousin) (Cousin)
                        Aarav      Kavya                      │
                        (Son)   (Daughter)                   │
                                                        ┌────┴────┐
                                                        │         │
                                                    Aarav      Kavya
                                                 (Amit's    (Amit's
                                                   Son)    Daughter)
```

## Key Features

### 1. **Separate Family Trees**
- Each person maintains their own family tree
- Meera's family tree is independent of Amit's
- Can be fetched on-demand when needed

### 2. **In-Law Relationships**
- Automatic conversion of relationships to in-law equivalents
- Father → Father-in-law, Brother → Brother-in-law, etc.
- Maintains connection through spouse

### 3. **Extended In-Law Access**
- From Prashanth's perspective, he can see Amit's wife's family
- Relationships are labeled as "cousin's spouse's family"
- On-demand loading prevents overwhelming the main tree

### 4. **Children Appear in Main Tree**
- Amit and Meera's children appear in Prashanth's main family tree
- They are connected upstream to their actual parents (Amit)
- Proper generational relationships maintained

### 5. **Multiple Contexts**
- **Primary**: User's own blood family
- **Extended**: Includes in-law families of extended family members
- **In-Laws**: Specific spouse's family tree with in-law relationships

## API Endpoints Summary

1. **`GET /api/family/tree`** - Primary family tree
2. **`GET /api/family/tree/extended?includeInLaws=true`** - Extended tree with in-laws
3. **`GET /api/family/tree/in-laws/:spouseId`** - Specific spouse's family as in-laws
4. **`POST /api/family/spouse`** - Add a spouse
5. **`POST /api/family/member`** - Add family members

This system allows for:
- ✅ Complex multi-generational family trees
- ✅ Separate family trees that can be accessed on-demand
- ✅ Proper in-law relationship handling
- ✅ Children appearing in the correct tree positions
- ✅ Scalable architecture for large extended families