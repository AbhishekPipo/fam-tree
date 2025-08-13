'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('relationship_types', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'The relationship name (e.g., father, mother, cousin, etc.)'
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Relationship level: positive for ancestors, negative for descendants, zero for same generation'
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'neutral'),
        allowNull: false,
        comment: 'Gender specificity of the relationship'
      },
      category: {
        type: Sequelize.ENUM('direct', 'indirect'),
        allowNull: false,
        comment: 'Direct relationships (spouse/partner) vs indirect (blood/family)'
      },
      subcategory: {
        type: Sequelize.ENUM('blood', 'marriage', 'adoption', 'step', 'half'),
        allowNull: true,
        comment: 'More specific categorization of relationship type'
      },
      reciprocal_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'The reciprocal relationship name (e.g., father -> son/daughter)'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of the relationship'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this relationship type is currently active/available'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Sort order for displaying relationship types'
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
    await queryInterface.addIndex('relationship_types', ['level']);
    await queryInterface.addIndex('relationship_types', ['gender']);
    await queryInterface.addIndex('relationship_types', ['category']);
    await queryInterface.addIndex('relationship_types', ['is_active']);
    await queryInterface.addIndex('relationship_types', ['level', 'gender']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('relationship_types');
  }
};