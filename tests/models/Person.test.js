const Person = require('../../src/models/Person');
const database = require('../../src/config/database');

describe('Person Model', () => {
  let testPersonId;

  beforeEach(async () => {
    // Clean up any existing test data
    await database.runQuery('MATCH (p:Person {email: $email}) DETACH DELETE p', {
      email: 'test@example.com'
    });
  });

  afterEach(async () => {
    // Clean up test data
    if (testPersonId) {
      await database.runQuery('MATCH (p:Person {id: $id}) DETACH DELETE p', {
        id: testPersonId
      });
      testPersonId = null;
    }
  });

  describe('Constructor', () => {
    test('should create a person with required fields', () => {
      const personData = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male'
      };

      const person = new Person(personData);

      expect(person.firstName).toBe('John');
      expect(person.lastName).toBe('Doe');
      expect(person.gender).toBe('male');
      expect(person.id).toBeDefined();
      expect(person.createdAt).toBeDefined();
      expect(person.updatedAt).toBeDefined();
    });

    test('should set default values for optional fields', () => {
      const personData = {
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'female'
      };

      const person = new Person(personData);

      expect(person.isDeceased).toBe(false);
      expect(person.visibility).toBe('family');
      expect(person.livingArrangement).toBe('independent');
      expect(person.medicalConditions).toEqual([]);
      expect(person.allergies).toEqual([]);
      expect(person.tags).toEqual([]);
    });
  });

  describe('Computed Properties', () => {
    test('getFullName should return full name without middle name', () => {
      const person = new Person({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male'
      });

      expect(person.getFullName()).toBe('John Doe');
    });

    test('getFullName should return full name with middle name', () => {
      const person = new Person({
        firstName: 'John',
        middleName: 'William',
        lastName: 'Doe',
        gender: 'male'
      });

      expect(person.getFullName()).toBe('John William Doe');
    });

    test('getAge should calculate age correctly for living person', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const person = new Person({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: birthDate.toISOString()
      });

      expect(person.getAge()).toBe(30);
    });

    test('getAge should calculate age correctly for deceased person', () => {
      const birthDate = new Date('1950-01-01');
      const deathDate = new Date('2020-01-01');

      const person = new Person({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: birthDate.toISOString(),
        dateOfDeath: deathDate.toISOString(),
        isDeceased: true
      });

      expect(person.getAge()).toBe(70);
    });

    test('getAge should return null if no birth date', () => {
      const person = new Person({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male'
      });

      expect(person.getAge()).toBeNull();
    });

    test('isAlive should return correct status', () => {
      const livingPerson = new Person({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male'
      });

      const deceasedPerson = new Person({
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'female',
        isDeceased: true
      });

      expect(livingPerson.isAlive()).toBe(true);
      expect(deceasedPerson.isAlive()).toBe(false);
    });
  });

  describe('Validation', () => {
    test('should pass validation with valid data', () => {
      const person = new Person({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        email: 'john@example.com'
      });

      const errors = person.validate();
      expect(errors).toEqual([]);
    });

    test('should fail validation without first name', () => {
      const person = new Person({
        lastName: 'Doe',
        gender: 'male'
      });

      const errors = person.validate();
      expect(errors).toContain('First name is required');
    });

    test('should fail validation without last name', () => {
      const person = new Person({
        firstName: 'John',
        gender: 'male'
      });

      const errors = person.validate();
      expect(errors).toContain('Last name is required');
    });

    test('should fail validation with invalid gender', () => {
      const person = new Person({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'invalid'
      });

      const errors = person.validate();
      expect(errors).toContain('Valid gender is required (male, female, other)');
    });

    test('should fail validation with invalid email', () => {
      const person = new Person({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        email: 'invalid-email'
      });

      const errors = person.validate();
      expect(errors).toContain('Invalid email format');
    });

    test('should fail validation with future birth date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const person = new Person({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: futureDate.toISOString()
      });

      const errors = person.validate();
      expect(errors).toContain('Date of birth cannot be in the future');
    });

    test('should fail validation with death date before birth date', () => {
      const person = new Person({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: '2000-01-01',
        dateOfDeath: '1999-01-01'
      });

      const errors = person.validate();
      expect(errors).toContain('Date of death cannot be before date of birth');
    });
  });

  describe('Database Operations', () => {
    test('should save person to database', async () => {
      const personData = {
        firstName: 'Test',
        lastName: 'Person',
        gender: 'other',
        email: 'test@example.com'
      };

      const person = new Person(personData);
      const savedPerson = await person.save();
      testPersonId = savedPerson.id;

      expect(savedPerson.id).toBeDefined();
      expect(savedPerson.firstName).toBe('Test');
      expect(savedPerson.lastName).toBe('Person');
      expect(savedPerson.email).toBe('test@example.com');
    });

    test('should find person by id', async () => {
      // First create a person
      const personData = {
        firstName: 'Find',
        lastName: 'Me',
        gender: 'other',
        email: 'findme@example.com'
      };

      const person = new Person(personData);
      const savedPerson = await person.save();
      testPersonId = savedPerson.id;

      // Then find it
      const foundPerson = await Person.findById(savedPerson.id);

      expect(foundPerson).toBeDefined();
      expect(foundPerson.id).toBe(savedPerson.id);
      expect(foundPerson.firstName).toBe('Find');
      expect(foundPerson.lastName).toBe('Me');
    });

    test('should return null when person not found', async () => {
      const foundPerson = await Person.findById('non-existent-id');
      expect(foundPerson).toBeNull();
    });

    test('should find person by email', async () => {
      // First create a person
      const personData = {
        firstName: 'Email',
        lastName: 'Test',
        gender: 'other',
        email: 'emailtest@example.com'
      };

      const person = new Person(personData);
      const savedPerson = await person.save();
      testPersonId = savedPerson.id;

      // Then find it by email
      const foundPerson = await Person.findByEmail('emailtest@example.com');

      expect(foundPerson).toBeDefined();
      expect(foundPerson.email).toBe('emailtest@example.com');
      expect(foundPerson.firstName).toBe('Email');
    });

    test('should update person', async () => {
      // First create a person
      const personData = {
        firstName: 'Update',
        lastName: 'Me',
        gender: 'other',
        email: 'updateme@example.com'
      };

      const person = new Person(personData);
      const savedPerson = await person.save();
      testPersonId = savedPerson.id;

      // Then update it
      const updatedPerson = await Person.update(savedPerson.id, {
        firstName: 'Updated',
        occupation: 'Developer'
      });

      expect(updatedPerson.firstName).toBe('Updated');
      expect(updatedPerson.lastName).toBe('Me'); // Should remain unchanged
      expect(updatedPerson.occupation).toBe('Developer');
    });

    test('should delete person', async () => {
      // First create a person
      const personData = {
        firstName: 'Delete',
        lastName: 'Me',
        gender: 'other',
        email: 'deleteme@example.com'
      };

      const person = new Person(personData);
      const savedPerson = await person.save();

      // Then delete it
      const result = await Person.delete(savedPerson.id);

      expect(result.deletedCount).toBe(1);

      // Verify it's deleted
      const foundPerson = await Person.findById(savedPerson.id);
      expect(foundPerson).toBeNull();
    });
  });
});