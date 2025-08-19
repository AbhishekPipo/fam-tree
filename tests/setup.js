// Test setup file - runs before each test file
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Helper to create test user data
  createTestUser: (overrides = {}) => ({
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    gender: 'other',
    ...overrides
  }),

  // Helper to create test person data
  createTestPerson: (overrides = {}) => ({
    firstName: 'John',
    lastName: 'Doe',
    gender: 'male',
    dateOfBirth: '1990-01-01',
    ...overrides
  }),

  // Helper to create test family tree data
  createTestFamilyTree: (overrides = {}) => ({
    name: `Test Family Tree ${Date.now()}`,
    description: 'A test family tree',
    visibility: 'family',
    ...overrides
  }),

  // Helper to create test event data
  createTestEvent: (overrides = {}) => ({
    title: 'Test Event',
    eventType: 'other',
    date: '2023-01-01',
    ...overrides
  }),

  // Helper to wait for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate random string
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};

// Global cleanup function
global.cleanup = async () => {
  // Add any global cleanup logic here
  // For example, clearing test data from database
};

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});