'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('indirect_relationships', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      relatedUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      relationshipLevel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Positive: Ancestors (1=parent, 2=grandparent), Negative: Descendants (-1=child, -2=grandchild), Zero: Same generation (siblings, cousins)'
      },
      relationshipType: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'father, mother, son, daughter, brother, sister, grandfather, grandmother, grandson, granddaughter, etc.'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('indirect_relationships', ['userId']);
    await queryInterface.addIndex('indirect_relationships', ['relatedUserId']);
    await queryInterface.addIndex('indirect_relationships', ['userId', 'relationshipLevel']);
    await queryInterface.addIndex('indirect_relationships', ['userId', 'relatedUserId'], {
      unique: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('indirect_relationships');
  }
};
