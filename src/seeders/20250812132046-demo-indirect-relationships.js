'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('indirect_relationships', [
      // Ramesh's relationships (ID: 1)
      { userId: 1, relatedUserId: 3, relationshipLevel: -1, relationshipType: 'son', createdAt: new Date(), updatedAt: new Date() },
      { userId: 1, relatedUserId: 4, relationshipLevel: -1, relationshipType: 'daughter-in-law', createdAt: new Date(), updatedAt: new Date() },
      { userId: 1, relatedUserId: 5, relationshipLevel: -2, relationshipType: 'granddaughter', createdAt: new Date(), updatedAt: new Date() },
      { userId: 1, relatedUserId: 6, relationshipLevel: -2, relationshipType: 'grandson', createdAt: new Date(), updatedAt: new Date() },
      { userId: 1, relatedUserId: 7, relationshipLevel: -3, relationshipType: 'great-granddaughter', createdAt: new Date(), updatedAt: new Date() },
      { userId: 1, relatedUserId: 8, relationshipLevel: -3, relationshipType: 'great-grandson', createdAt: new Date(), updatedAt: new Date() },

      // Mallika's relationships (ID: 2)
      { userId: 2, relatedUserId: 3, relationshipLevel: -1, relationshipType: 'son', createdAt: new Date(), updatedAt: new Date() },
      { userId: 2, relatedUserId: 4, relationshipLevel: -1, relationshipType: 'daughter-in-law', createdAt: new Date(), updatedAt: new Date() },
      { userId: 2, relatedUserId: 5, relationshipLevel: -2, relationshipType: 'granddaughter', createdAt: new Date(), updatedAt: new Date() },
      { userId: 2, relatedUserId: 6, relationshipLevel: -2, relationshipType: 'grandson', createdAt: new Date(), updatedAt: new Date() },
      { userId: 2, relatedUserId: 7, relationshipLevel: -3, relationshipType: 'great-granddaughter', createdAt: new Date(), updatedAt: new Date() },
      { userId: 2, relatedUserId: 8, relationshipLevel: -3, relationshipType: 'great-grandson', createdAt: new Date(), updatedAt: new Date() },

      // Prashanth's relationships (ID: 3)
      { userId: 3, relatedUserId: 1, relationshipLevel: 1, relationshipType: 'father', createdAt: new Date(), updatedAt: new Date() },
      { userId: 3, relatedUserId: 2, relationshipLevel: 1, relationshipType: 'mother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 3, relatedUserId: 5, relationshipLevel: -1, relationshipType: 'daughter', createdAt: new Date(), updatedAt: new Date() },
      { userId: 3, relatedUserId: 6, relationshipLevel: -1, relationshipType: 'son', createdAt: new Date(), updatedAt: new Date() },
      { userId: 3, relatedUserId: 7, relationshipLevel: -2, relationshipType: 'granddaughter', createdAt: new Date(), updatedAt: new Date() },
      { userId: 3, relatedUserId: 8, relationshipLevel: -2, relationshipType: 'grandson', createdAt: new Date(), updatedAt: new Date() },

      // Anjali's relationships (ID: 4)
      { userId: 4, relatedUserId: 1, relationshipLevel: 1, relationshipType: 'father-in-law', createdAt: new Date(), updatedAt: new Date() },
      { userId: 4, relatedUserId: 2, relationshipLevel: 1, relationshipType: 'mother-in-law', createdAt: new Date(), updatedAt: new Date() },
      { userId: 4, relatedUserId: 5, relationshipLevel: -1, relationshipType: 'daughter', createdAt: new Date(), updatedAt: new Date() },
      { userId: 4, relatedUserId: 6, relationshipLevel: -1, relationshipType: 'son', createdAt: new Date(), updatedAt: new Date() },
      { userId: 4, relatedUserId: 7, relationshipLevel: -2, relationshipType: 'granddaughter', createdAt: new Date(), updatedAt: new Date() },
      { userId: 4, relatedUserId: 8, relationshipLevel: -2, relationshipType: 'grandson', createdAt: new Date(), updatedAt: new Date() },

      // Simran's relationships (ID: 5)
      { userId: 5, relatedUserId: 1, relationshipLevel: 2, relationshipType: 'grandfather', createdAt: new Date(), updatedAt: new Date() },
      { userId: 5, relatedUserId: 2, relationshipLevel: 2, relationshipType: 'grandmother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 5, relatedUserId: 3, relationshipLevel: 1, relationshipType: 'father', createdAt: new Date(), updatedAt: new Date() },
      { userId: 5, relatedUserId: 4, relationshipLevel: 1, relationshipType: 'mother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 5, relatedUserId: 6, relationshipLevel: 0, relationshipType: 'brother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 5, relatedUserId: 7, relationshipLevel: -1, relationshipType: 'daughter', createdAt: new Date(), updatedAt: new Date() },
      { userId: 5, relatedUserId: 8, relationshipLevel: -1, relationshipType: 'nephew', createdAt: new Date(), updatedAt: new Date() },

      // Arjun's relationships (ID: 6)
      { userId: 6, relatedUserId: 1, relationshipLevel: 2, relationshipType: 'grandfather', createdAt: new Date(), updatedAt: new Date() },
      { userId: 6, relatedUserId: 2, relationshipLevel: 2, relationshipType: 'grandmother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 6, relatedUserId: 3, relationshipLevel: 1, relationshipType: 'father', createdAt: new Date(), updatedAt: new Date() },
      { userId: 6, relatedUserId: 4, relationshipLevel: 1, relationshipType: 'mother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 6, relatedUserId: 5, relationshipLevel: 0, relationshipType: 'sister', createdAt: new Date(), updatedAt: new Date() },
      { userId: 6, relatedUserId: 7, relationshipLevel: -1, relationshipType: 'niece', createdAt: new Date(), updatedAt: new Date() },
      { userId: 6, relatedUserId: 8, relationshipLevel: -1, relationshipType: 'son', createdAt: new Date(), updatedAt: new Date() },

      // Elina's relationships (ID: 7)
      { userId: 7, relatedUserId: 1, relationshipLevel: 3, relationshipType: 'great-grandfather', createdAt: new Date(), updatedAt: new Date() },
      { userId: 7, relatedUserId: 2, relationshipLevel: 3, relationshipType: 'great-grandmother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 7, relatedUserId: 3, relationshipLevel: 2, relationshipType: 'grandfather', createdAt: new Date(), updatedAt: new Date() },
      { userId: 7, relatedUserId: 4, relationshipLevel: 2, relationshipType: 'grandmother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 7, relatedUserId: 5, relationshipLevel: 1, relationshipType: 'mother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 7, relatedUserId: 6, relationshipLevel: 1, relationshipType: 'uncle', createdAt: new Date(), updatedAt: new Date() },
      { userId: 7, relatedUserId: 8, relationshipLevel: 0, relationshipType: 'cousin', createdAt: new Date(), updatedAt: new Date() },

      // Rohan's relationships (ID: 8)
      { userId: 8, relatedUserId: 1, relationshipLevel: 3, relationshipType: 'great-grandfather', createdAt: new Date(), updatedAt: new Date() },
      { userId: 8, relatedUserId: 2, relationshipLevel: 3, relationshipType: 'great-grandmother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 8, relatedUserId: 3, relationshipLevel: 2, relationshipType: 'grandfather', createdAt: new Date(), updatedAt: new Date() },
      { userId: 8, relatedUserId: 4, relationshipLevel: 2, relationshipType: 'grandmother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 8, relatedUserId: 5, relationshipLevel: 1, relationshipType: 'aunt', createdAt: new Date(), updatedAt: new Date() },
      { userId: 8, relatedUserId: 6, relationshipLevel: 1, relationshipType: 'father', createdAt: new Date(), updatedAt: new Date() },
      { userId: 8, relatedUserId: 7, relationshipLevel: 0, relationshipType: 'cousin', createdAt: new Date(), updatedAt: new Date() },

      // Suresh's relationships (ID: 9) - Ramesh's brother
      { userId: 9, relatedUserId: 1, relationshipLevel: 0, relationshipType: 'brother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 9, relatedUserId: 2, relationshipLevel: 0, relationshipType: 'sister-in-law', createdAt: new Date(), updatedAt: new Date() },
      { userId: 9, relatedUserId: 3, relationshipLevel: -1, relationshipType: 'nephew', createdAt: new Date(), updatedAt: new Date() },
      { userId: 9, relatedUserId: 4, relationshipLevel: -1, relationshipType: 'niece-in-law', createdAt: new Date(), updatedAt: new Date() },
      { userId: 9, relatedUserId: 5, relationshipLevel: -2, relationshipType: 'grand-nephew', createdAt: new Date(), updatedAt: new Date() },
      { userId: 9, relatedUserId: 6, relationshipLevel: -2, relationshipType: 'grand-nephew', createdAt: new Date(), updatedAt: new Date() },
      { userId: 9, relatedUserId: 7, relationshipLevel: -3, relationshipType: 'great-grand-niece', createdAt: new Date(), updatedAt: new Date() },
      { userId: 9, relatedUserId: 8, relationshipLevel: -3, relationshipType: 'great-grand-nephew', createdAt: new Date(), updatedAt: new Date() },

      // Add Suresh to everyone else's relationships
      { userId: 1, relatedUserId: 9, relationshipLevel: 0, relationshipType: 'brother', createdAt: new Date(), updatedAt: new Date() },
      { userId: 2, relatedUserId: 9, relationshipLevel: 0, relationshipType: 'brother-in-law', createdAt: new Date(), updatedAt: new Date() },
      { userId: 3, relatedUserId: 9, relationshipLevel: 1, relationshipType: 'uncle', createdAt: new Date(), updatedAt: new Date() },
      { userId: 4, relatedUserId: 9, relationshipLevel: 1, relationshipType: 'uncle-in-law', createdAt: new Date(), updatedAt: new Date() },
      { userId: 5, relatedUserId: 9, relationshipLevel: 2, relationshipType: 'great-uncle', createdAt: new Date(), updatedAt: new Date() },
      { userId: 6, relatedUserId: 9, relationshipLevel: 2, relationshipType: 'great-uncle', createdAt: new Date(), updatedAt: new Date() },
      { userId: 7, relatedUserId: 9, relationshipLevel: 3, relationshipType: 'great-great-uncle', createdAt: new Date(), updatedAt: new Date() },
      { userId: 8, relatedUserId: 9, relationshipLevel: 3, relationshipType: 'great-great-uncle', createdAt: new Date(), updatedAt: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('indirect_relationships', null, {});
  }
};
