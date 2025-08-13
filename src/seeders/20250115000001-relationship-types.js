'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('relationship_types', [
      // DIRECT RELATIONSHIPS (Level 0 - Spouses/Partners)
      {
        name: 'husband',
        level: 0,
        gender: 'male',
        category: 'direct',
        subcategory: 'marriage',
        reciprocal_name: 'wife',
        description: 'Male spouse in a marriage',
        sort_order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'wife',
        level: 0,
        gender: 'female',
        category: 'direct',
        subcategory: 'marriage',
        reciprocal_name: 'husband',
        description: 'Female spouse in a marriage',
        sort_order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'partner',
        level: 0,
        gender: 'neutral',
        category: 'direct',
        subcategory: 'marriage',
        reciprocal_name: 'partner',
        description: 'Life partner or domestic partner',
        sort_order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // LEVEL +1 - PARENTS
      {
        name: 'father',
        level: 1,
        gender: 'male',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'son/daughter',
        description: 'Male parent',
        sort_order: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'mother',
        level: 1,
        gender: 'female',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'son/daughter',
        description: 'Female parent',
        sort_order: 11,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'stepfather',
        level: 1,
        gender: 'male',
        category: 'indirect',
        subcategory: 'step',
        reciprocal_name: 'stepson/stepdaughter',
        description: 'Male step-parent',
        sort_order: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'stepmother',
        level: 1,
        gender: 'female',
        category: 'indirect',
        subcategory: 'step',
        reciprocal_name: 'stepson/stepdaughter',
        description: 'Female step-parent',
        sort_order: 13,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'adoptive-father',
        level: 1,
        gender: 'male',
        category: 'indirect',
        subcategory: 'adoption',
        reciprocal_name: 'adopted-son/adopted-daughter',
        description: 'Male adoptive parent',
        sort_order: 14,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'adoptive-mother',
        level: 1,
        gender: 'female',
        category: 'indirect',
        subcategory: 'adoption',
        reciprocal_name: 'adopted-son/adopted-daughter',
        description: 'Female adoptive parent',
        sort_order: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // LEVEL -1 - CHILDREN
      {
        name: 'son',
        level: -1,
        gender: 'male',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'father/mother',
        description: 'Male child',
        sort_order: 20,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'daughter',
        level: -1,
        gender: 'female',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'father/mother',
        description: 'Female child',
        sort_order: 21,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'stepson',
        level: -1,
        gender: 'male',
        category: 'indirect',
        subcategory: 'step',
        reciprocal_name: 'stepfather/stepmother',
        description: 'Male step-child',
        sort_order: 22,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'stepdaughter',
        level: -1,
        gender: 'female',
        category: 'indirect',
        subcategory: 'step',
        reciprocal_name: 'stepfather/stepmother',
        description: 'Female step-child',
        sort_order: 23,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'adopted-son',
        level: -1,
        gender: 'male',
        category: 'indirect',
        subcategory: 'adoption',
        reciprocal_name: 'adoptive-father/adoptive-mother',
        description: 'Male adopted child',
        sort_order: 24,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'adopted-daughter',
        level: -1,
        gender: 'female',
        category: 'indirect',
        subcategory: 'adoption',
        reciprocal_name: 'adoptive-father/adoptive-mother',
        description: 'Female adopted child',
        sort_order: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // LEVEL 0 - SIBLINGS
      {
        name: 'brother',
        level: 0,
        gender: 'male',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'brother/sister',
        description: 'Male sibling',
        sort_order: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'sister',
        level: 0,
        gender: 'female',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'brother/sister',
        description: 'Female sibling',
        sort_order: 31,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'half-brother',
        level: 0,
        gender: 'male',
        category: 'indirect',
        subcategory: 'half',
        reciprocal_name: 'half-brother/half-sister',
        description: 'Male half-sibling (one shared parent)',
        sort_order: 32,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'half-sister',
        level: 0,
        gender: 'female',
        category: 'indirect',
        subcategory: 'half',
        reciprocal_name: 'half-brother/half-sister',
        description: 'Female half-sibling (one shared parent)',
        sort_order: 33,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'stepbrother',
        level: 0,
        gender: 'male',
        category: 'indirect',
        subcategory: 'step',
        reciprocal_name: 'stepbrother/stepsister',
        description: 'Male step-sibling',
        sort_order: 34,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'stepsister',
        level: 0,
        gender: 'female',
        category: 'indirect',
        subcategory: 'step',
        reciprocal_name: 'stepbrother/stepsister',
        description: 'Female step-sibling',
        sort_order: 35,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // LEVEL +2 - GRANDPARENTS
      {
        name: 'grandfather',
        level: 2,
        gender: 'male',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'grandson/granddaughter',
        description: 'Male grandparent',
        sort_order: 40,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'grandmother',
        level: 2,
        gender: 'female',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'grandson/granddaughter',
        description: 'Female grandparent',
        sort_order: 41,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // LEVEL -2 - GRANDCHILDREN
      {
        name: 'grandson',
        level: -2,
        gender: 'male',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'grandfather/grandmother',
        description: 'Male grandchild',
        sort_order: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'granddaughter',
        level: -2,
        gender: 'female',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'grandfather/grandmother',
        description: 'Female grandchild',
        sort_order: 51,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // LEVEL +3 - GREAT-GRANDPARENTS
      {
        name: 'great-grandfather',
        level: 3,
        gender: 'male',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'great-grandson/great-granddaughter',
        description: 'Male great-grandparent',
        sort_order: 60,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'great-grandmother',
        level: 3,
        gender: 'female',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'great-grandson/great-granddaughter',
        description: 'Female great-grandparent',
        sort_order: 61,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // LEVEL -3 - GREAT-GRANDCHILDREN
      {
        name: 'great-grandson',
        level: -3,
        gender: 'male',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'great-grandfather/great-grandmother',
        description: 'Male great-grandchild',
        sort_order: 70,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'great-granddaughter',
        level: -3,
        gender: 'female',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'great-grandfather/great-grandmother',
        description: 'Female great-grandchild',
        sort_order: 71,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // EXTENDED FAMILY - UNCLES/AUNTS (Level +1 from sibling perspective)
      {
        name: 'uncle',
        level: 1,
        gender: 'male',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'nephew/niece',
        description: 'Brother of parent',
        sort_order: 80,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'aunt',
        level: 1,
        gender: 'female',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'nephew/niece',
        description: 'Sister of parent',
        sort_order: 81,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // EXTENDED FAMILY - NEPHEWS/NIECES (Level -1 from sibling perspective)
      {
        name: 'nephew',
        level: -1,
        gender: 'male',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'uncle/aunt',
        description: 'Son of sibling',
        sort_order: 90,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'niece',
        level: -1,
        gender: 'female',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'uncle/aunt',
        description: 'Daughter of sibling',
        sort_order: 91,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // COUSINS (Level 0 from extended family perspective)
      {
        name: 'cousin',
        level: 0,
        gender: 'neutral',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'cousin',
        description: 'Child of uncle/aunt',
        sort_order: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'male-cousin',
        level: 0,
        gender: 'male',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'cousin',
        description: 'Male child of uncle/aunt',
        sort_order: 101,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'female-cousin',
        level: 0,
        gender: 'female',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'cousin',
        description: 'Female child of uncle/aunt',
        sort_order: 102,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // IN-LAWS
      {
        name: 'father-in-law',
        level: 1,
        gender: 'male',
        category: 'indirect',
        subcategory: 'marriage',
        reciprocal_name: 'son-in-law/daughter-in-law',
        description: 'Father of spouse',
        sort_order: 110,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'mother-in-law',
        level: 1,
        gender: 'female',
        category: 'indirect',
        subcategory: 'marriage',
        reciprocal_name: 'son-in-law/daughter-in-law',
        description: 'Mother of spouse',
        sort_order: 111,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'son-in-law',
        level: -1,
        gender: 'male',
        category: 'indirect',
        subcategory: 'marriage',
        reciprocal_name: 'father-in-law/mother-in-law',
        description: 'Husband of daughter',
        sort_order: 120,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'daughter-in-law',
        level: -1,
        gender: 'female',
        category: 'indirect',
        subcategory: 'marriage',
        reciprocal_name: 'father-in-law/mother-in-law',
        description: 'Wife of son',
        sort_order: 121,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'brother-in-law',
        level: 0,
        gender: 'male',
        category: 'indirect',
        subcategory: 'marriage',
        reciprocal_name: 'brother-in-law/sister-in-law',
        description: 'Brother of spouse or husband of sibling',
        sort_order: 130,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'sister-in-law',
        level: 0,
        gender: 'female',
        category: 'indirect',
        subcategory: 'marriage',
        reciprocal_name: 'brother-in-law/sister-in-law',
        description: 'Sister of spouse or wife of sibling',
        sort_order: 131,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // GREAT-GREAT LEVELS (Level 4 and -4)
      {
        name: 'great-great-grandfather',
        level: 4,
        gender: 'male',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'great-great-grandson/great-great-granddaughter',
        description: 'Male great-great-grandparent',
        sort_order: 140,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'great-great-grandmother',
        level: 4,
        gender: 'female',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'great-great-grandson/great-great-granddaughter',
        description: 'Female great-great-grandparent',
        sort_order: 141,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'great-great-grandson',
        level: -4,
        gender: 'male',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'great-great-grandfather/great-great-grandmother',
        description: 'Male great-great-grandchild',
        sort_order: 150,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'great-great-granddaughter',
        level: -4,
        gender: 'female',
        category: 'indirect',
        subcategory: 'blood',
        reciprocal_name: 'great-great-grandfather/great-great-grandmother',
        description: 'Female great-great-grandchild',
        sort_order: 151,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('relationship_types', null, {});
  }
};