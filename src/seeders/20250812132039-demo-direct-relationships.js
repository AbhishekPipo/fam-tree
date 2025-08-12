'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('direct_relationships', [
      // Ramesh ↔ Mallika (husband/wife)
      {
        userId: 1,
        relatedUserId: 2,
        relationshipType: 'husband',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: 2,
        relatedUserId: 1,
        relationshipType: 'wife',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Prashanth ↔ Anjali (husband/wife)
      {
        userId: 3,
        relatedUserId: 4,
        relationshipType: 'husband',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: 4,
        relatedUserId: 3,
        relationshipType: 'wife',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('direct_relationships', null, {});
  }
};
