# Prashanth Family Tree API Response

## 🔐 Authentication

**Login Credentials:**
- **Email**: `prashanth@family.com`
- **Password**: `FamilyTree123!`

## 📋 API Endpoint

**GET** `/api/family/tree`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## 📊 Expected Response

Based on the seed data and family service implementation, here's what the API response would look like:

### 🎯 **Main Response Structure**

```json
{
  "success": true,
  "data": {
    "currentUser": {
      "id": 38,
      "firstName": "Prashanth",
      "middleName": null,
      "lastName": "Patel",
      "email": "prashanth@family.com",
      "dateOfBirth": "1980-05-15",
      "gender": "male",
      "location": "Mumbai, Maharashtra, India",
      "profilePicture": null,
      "isOnline": true,
      "isDeceased": false,
      "fatherId": 34,
      "motherId": 35,
      "spouseId": 39,
      "father": {
        "id": 34,
        "firstName": "Ramesh",
        "lastName": "Patel",
        "gender": "male"
      },
      "mother": {
        "id": 35,
        "firstName": "Mallika",
        "lastName": "Patel",
        "gender": "female"
      }
    },
    "ancestors": [
      {
        "user": {
          "id": 32,
          "firstName": "Harilal",
          "lastName": "Patel",
          "gender": "male",
          "dateOfBirth": "1925-03-15",
          "location": "Ahmedabad, Gujarat, India",
          "isDeceased": false
        },
        "relationship": "grandfather",
        "level": 2,
        "directRelationships": [
          {
            "partner": {
              "id": 33,
              "firstName": "Savitri",
              "lastName": "Patel",
              "gender": "female"
            },
            "relationshipType": "husband"
          }
        ]
      },
      {
        "user": {
          "id": 33,
          "firstName": "Savitri",
          "lastName": "Patel",
          "gender": "female",
          "dateOfBirth": "1930-07-20",
          "location": "Ahmedabad, Gujarat, India",
          "isDeceased": false
        },
        "relationship": "grandmother",
        "level": 2,
        "directRelationships": [
          {
            "partner": {
              "id": 32,
              "firstName": "Harilal",
              "lastName": "Patel",
              "gender": "male"
            },
            "relationshipType": "wife"
          }
        ]
      },
      {
        "user": {
          "id": 34,
          "firstName": "Ramesh",
          "lastName": "Patel",
          "gender": "male",
          "dateOfBirth": "1955-08-10",
          "location": "Mumbai, Maharashtra, India",
          "isDeceased": false
        },
        "relationship": "father",
        "level": 1,
        "directRelationships": [
          {
            "partner": {
              "id": 35,
              "firstName": "Mallika",
              "lastName": "Patel",
              "gender": "female"
            },
            "relationshipType": "husband"
          }
        ]
      },
      {
        "user": {
          "id": 35,
          "firstName": "Mallika",
          "lastName": "Patel",
          "gender": "female",
          "dateOfBirth": "1958-12-03",
          "location": "Mumbai, Maharashtra, India",
          "isDeceased": false
        },
        "relationship": "mother",
        "level": 1,
        "directRelationships": [
          {
            "partner": {
              "id": 34,
              "firstName": "Ramesh",
              "lastName": "Patel",
              "gender": "male"
            },
            "relationshipType": "wife"
          }
        ]
      },
      {
        "user": {
          "id": 36,
          "firstName": "Suresh",
          "lastName": "Patel",
          "gender": "male",
          "dateOfBirth": "1960-11-25",
          "location": "Pune, Maharashtra, India",
          "isDeceased": false
        },
        "relationship": "uncle",
        "level": 1,
        "directRelationships": [
          {
            "partner": {
              "id": 37,
              "firstName": "Kiran",
              "lastName": "Patel",
              "gender": "female"
            },
            "relationshipType": "husband"
          }
        ]
      }
    ],
    "descendants": [
      {
        "user": {
          "id": 43,
          "firstName": "Arjun",
          "lastName": "Patel",
          "gender": "male",
          "dateOfBirth": "2005-03-20",
          "location": "Mumbai, Maharashtra, India",
          "isDeceased": false
        },
        "relationship": "son",
        "level": -1,
        "directRelationships": [
          {
            "partner": {
              "id": 44,
              "firstName": "Simran",
              "lastName": "Patel",
              "gender": "female"
            },
            "relationshipType": "brother"
          }
        ]
      },
      {
        "user": {
          "id": 44,
          "firstName": "Simran",
          "lastName": "Patel",
          "gender": "female",
          "dateOfBirth": "2008-09-15",
          "location": "Mumbai, Maharashtra, India",
          "isDeceased": false
        },
        "relationship": "daughter",
        "level": -1,
        "directRelationships": [
          {
            "partner": {
              "id": 43,
              "firstName": "Arjun",
              "lastName": "Patel",
              "gender": "male"
            },
            "relationshipType": "sister"
          }
        ]
      }
    ],
    "adjacent": [
      {
        "user": {
          "id": 39,
          "firstName": "Anjali",
          "lastName": "Patel",
          "gender": "female",
          "dateOfBirth": "1985-01-12",
          "location": "Mumbai, Maharashtra, India",
          "isDeceased": false
        },
        "relationship": "wife",
        "level": 0,
        "directRelationships": []
      }
    ],
    "totalMembers": 9
  }
}
```

## 🔍 **Response Analysis**

### **Family Structure for Prashanth:**

#### **👤 Current User**
- **Prashanth Patel** (ID: 38)
- Born: May 15, 1980
- Location: Mumbai, Maharashtra, India
- Status: Online, Living

#### **👨‍👩‍👧‍👦 Family Relationships**

**Ancestors (5 members):**
- **Grandparents**: Harilal & Savitri Patel (married couple)
- **Parents**: Ramesh & Mallika Patel (married couple)
- **Uncle**: Suresh Patel (married to Kiran)

**Descendants (2 members):**
- **Son**: Arjun Patel (born 2005)
- **Daughter**: Simran Patel (born 2008)

**Adjacent (1 member):**
- **Wife**: Anjali Patel (married to Prashanth)

### **📊 Key Metrics**
- **Total Family Members**: 9 people
- **Generations Covered**: 4 generations (grandparents to children)
- **Relationship Levels**: -1 to +2 (children to grandparents)
- **Marriage Relationships**: 3 couples in the tree

### **🔗 Relationship Mapping**
```
Harilal ←→ Savitri (Grandparents)
    ↓
Ramesh ←→ Mallika (Parents)  |  Suresh ←→ Kiran (Uncle/Aunt)
    ↓                              ↓
Prashanth ←→ Anjali           Amit, Priya (Cousins)
    ↓
Arjun, Simran (Children)
```

## 🚀 **How to Test This**

### **Step 1: Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prashanth@family.com",
    "password": "FamilyTree123!"
  }'
```

### **Step 2: Get Family Tree**
```bash
curl -X GET http://localhost:3000/api/family/tree \
  -H "Authorization: Bearer <JWT_TOKEN_FROM_LOGIN>" \
  -H "Content-Type: application/json"
```

### **Alternative: Using Browser**
1. Visit: http://localhost:3000/api-docs
2. Use the interactive Swagger documentation
3. Authenticate with Prashanth's credentials
4. Test the `/api/family/tree` endpoint

## 📝 **Additional Notes**

- **Data Source**: Based on seed data in `seedDatabase.js`
- **Authentication**: JWT token required for all family endpoints
- **Privacy**: Only shows family members connected to the authenticated user
- **Relationships**: Includes blood relations, marriages, and extended family
- **Levels**: Organized by generational distance from current user

This response structure provides a comprehensive view of Prashanth's family tree with all relationships, personal details, and hierarchical organization.