'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('FamilyTree123!', 12);
    
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        firstName: 'Ramesh',
        lastName: 'Patel',
        email: 'ramesh@family.com',
        password: hashedPassword,
        gender: 'male',
        dateOfBirth: '1945-05-15',
        location: 'Mumbai, India',
        isDeceased: false,
        hasMedication: false,
        isOnline: false,
        staysWithUser: false,
        fatherId: null,
        motherId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        firstName: 'Mallika',
        lastName: 'Patel',
        email: 'mallika@family.com',
        password: hashedPassword,
        gender: 'female',
        dateOfBirth: '1950-08-22',
        location: 'Mumbai, India',
        isDeceased: false,
        hasMedication: false,
        isOnline: false,
        staysWithUser: false,
        fatherId: null,
        motherId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        firstName: 'Prashanth',
        lastName: 'Patel',
        email: 'prashanth@family.com',
        password: hashedPassword,
        gender: 'male',
        dateOfBirth: '1975-03-10',
        location: 'Bangalore, India',
        fatherId: 1,
        motherId: 2,
        hasMedication: true,
        medicationName: 'Blood Pressure Medicine',
        medicationFrequency: 'Daily',
        medicationTime: 'Morning',
        isDeceased: false,
        isOnline: false,
        staysWithUser: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        firstName: 'Anjali',
        lastName: 'Patel',
        email: 'anjali@family.com',
        password: hashedPassword,
        gender: 'female',
        dateOfBirth: '1978-11-05',
        location: 'Bangalore, India',
        hasMedication: false,
        isDeceased: false,
        isOnline: false,
        staysWithUser: false,
        fatherId: null,
        motherId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        firstName: 'Simran',
        lastName: 'Patel',
        email: 'simran@family.com',
        password: hashedPassword,
        gender: 'female',
        dateOfBirth: '2005-07-20',
        location: 'Bangalore, India',
        fatherId: 3,
        motherId: 4,
        staysWithUser: true,
        hasMedication: false,
        isDeceased: false,
        isOnline: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        firstName: 'Arjun',
        lastName: 'Patel',
        email: 'arjun@family.com',
        password: hashedPassword,
        gender: 'male',
        dateOfBirth: '2008-12-15',
        location: 'Bangalore, India',
        fatherId: 3,
        motherId: 4,
        staysWithUser: true,
        hasMedication: false,
        isDeceased: false,
        isOnline: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 7,
        firstName: 'Elina',
        lastName: 'Patel',
        email: 'elina@family.com',
        password: hashedPassword,
        gender: 'female',
        dateOfBirth: '2025-04-18',
        location: 'Bangalore, India',
        fatherId: null,
        motherId: 5,
        hasMedication: false,
        isDeceased: false,
        isOnline: false,
        staysWithUser: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 8,
        firstName: 'Rohan',
        lastName: 'Patel',
        email: 'rohan@family.com',
        password: hashedPassword,
        gender: 'male',
        dateOfBirth: '2027-09-22',
        location: 'Bangalore, India',
        fatherId: 6,
        motherId: null,
        hasMedication: false,
        isDeceased: false,
        isOnline: false,
        staysWithUser: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 9,
        firstName: 'Suresh',
        lastName: 'Patel',
        email: 'suresh@family.com',
        password: hashedPassword,
        gender: 'male',
        dateOfBirth: '1948-02-10',
        location: 'Mumbai, India',
        hasMedication: false,
        isDeceased: false,
        isOnline: false,
        staysWithUser: false,
        fatherId: null,
        motherId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
