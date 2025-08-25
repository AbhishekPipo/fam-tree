/**
 * Test file for comprehensive family member addition functionality
 */

const request = require('supertest');
const app = require('./server');

// Test user credentials
const testUser = {
  phone: '+1234567890',
  name: 'Test User',
  email: 'testuser@example.com'
};

let authToken = '';
let testUserId = '';

describe('Comprehensive Family Member Addition Tests', () => {
  beforeAll(async () => {
    // Login and get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        phone: testUser.phone
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token;
      testUserId = loginResponse.body.user.id;
    }
  });

  describe('Relationship Types API', () => {
    test('should get all relationship types', async () => {
      const response = await request(app)
        .get('/api/family/relationship-types')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('relationshipTypes');
      expect(response.body.relationshipTypes).toHaveProperty('spouse');
      expect(response.body.relationshipTypes).toHaveProperty('parents');
      expect(response.body.relationshipTypes).toHaveProperty('children');
      expect(response.body.relationshipTypes).toHaveProperty('siblings');
      expect(response.body.relationshipTypes).toHaveProperty('grandparents');
    });

    test('should get relationship suggestions for a specific type', async () => {
      const response = await request(app)
        .get('/api/family/relationship-suggestions/father')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('suggestions');
    });
  });

  describe('Family Member Addition', () => {
    test('should add a father', async () => {
      const fatherData = {
        name: 'John Doe Sr.',
        relationshipType: 'father',
        email: 'johnsr@example.com',
        phone: '+1234567891',
        birthDate: '1960-05-15',
        gender: 'male'
      };

      const response = await request(app)
        .post('/api/family/member')
        .set('Authorization', `Bearer ${authToken}`)
        .send(fatherData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('member');
      expect(response.body.member.name).toBe(fatherData.name);
      expect(response.body).toHaveProperty('relationship');
      expect(response.body.relationship.type).toBe('father');
    });

    test('should add a mother', async () => {
      const motherData = {
        name: 'Jane Doe',
        relationshipType: 'mother',
        email: 'jane@example.com',
        phone: '+1234567892',
        birthDate: '1962-08-20',
        gender: 'female'
      };

      const response = await request(app)
        .post('/api/family/member')
        .set('Authorization', `Bearer ${authToken}`)
        .send(motherData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('member');
      expect(response.body.member.name).toBe(motherData.name);
    });

    test('should add a brother', async () => {
      const brotherData = {
        name: 'Mike Doe',
        relationshipType: 'brother',
        email: 'mike@example.com',
        phone: '+1234567893',
        birthDate: '1995-03-10',
        gender: 'male'
      };

      const response = await request(app)
        .post('/api/family/member')
        .set('Authorization', `Bearer ${authToken}`)
        .send(brotherData);

      expect(response.status).toBe(201);
      expect(response.body.relationship.type).toBe('brother');
    });

    test('should add an uncle (father\'s brother)', async () => {
      const uncleData = {
        name: 'Robert Doe',
        relationshipType: 'uncle',
        email: 'robert@example.com',
        phone: '+1234567894',
        birthDate: '1958-12-05',
        gender: 'male'
      };

      const response = await request(app)
        .post('/api/family/member')
        .set('Authorization', `Bearer ${authToken}`)
        .send(uncleData);

      expect(response.status).toBe(201);
      expect(response.body.relationship.type).toBe('uncle');
    });
  });

  describe('Relationship Validation', () => {
    test('should validate a valid relationship', async () => {
      const validationData = {
        relationshipType: 'cousin',
        memberData: {
          name: 'Sarah Doe',
          birthDate: '1990-07-25'
        }
      };

      const response = await request(app)
        .post('/api/family/validate-relationship')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validationData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isValid');
    });

    test('should reject invalid relationship type', async () => {
      const invalidData = {
        relationshipType: 'invalid_relation',
        memberData: {
          name: 'Invalid Relation'
        }
      };

      const response = await request(app)
        .post('/api/family/validate-relationship')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('Bulk Addition', () => {
    test('should add multiple family members', async () => {
      const bulkData = {
        members: [
          {
            name: 'Grandmother Mary',
            relationshipType: 'grandmother',
            email: 'mary@example.com',
            phone: '+1234567895',
            birthDate: '1940-04-12',
            gender: 'female'
          },
          {
            name: 'Grandfather Joe',
            relationshipType: 'grandfather',
            email: 'joe@example.com',
            phone: '+1234567896',
            birthDate: '1938-09-30',
            gender: 'male'
          }
        ]
      };

      const response = await request(app)
        .post('/api/family/bulk-add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('addedMembers');
      expect(response.body.addedMembers).toHaveLength(2);
    });
  });

  describe('Family Member Suggestions', () => {
    test('should get suggestions for potential family members', async () => {
      const response = await request(app)
        .get('/api/family/member-suggestions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('suggestions');
    });
  });

  describe('Family Tree Retrieval', () => {
    test('should get complete family tree with all added members', async () => {
      const response = await request(app)
        .get('/api/family/tree')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('familyTree');
      expect(response.body.familyTree).toHaveProperty('ancestors');
      expect(response.body.familyTree).toHaveProperty('descendants');
      expect(response.body.familyTree).toHaveProperty('siblings');
    });

    test('should get family statistics', async () => {
      const response = await request(app)
        .get('/api/family/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('totalMembers');
      expect(response.body.stats).toHaveProperty('relationshipCounts');
    });
  });
});
