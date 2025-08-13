const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IndirectRelationship = sequelize.define('IndirectRelationship', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  relatedUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  relationshipLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Positive: Ancestors (1=parent, 2=grandparent), Negative: Descendants (-1=child, -2=grandchild), Zero: Same generation (siblings, cousins)'
  },
  relationshipType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'father, mother, son, daughter, brother, sister, grandfather, grandmother, grandson, granddaughter, etc.'
  }
}, {
  tableName: 'indirect_relationships',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['relatedUserId']
    },
    {
      fields: ['userId', 'relationshipLevel']
    },
    {
      unique: true,
      fields: ['userId', 'relatedUserId']
    }
  ],
  validate: {
    // Ensure users don't have relationship with themselves
    notSelfRelated() {
      if (this.userId === this.relatedUserId) {
        throw new Error('Users cannot have a relationship with themselves');
      }
    }
  }
});

// Class method to create bidirectional indirect relationship
IndirectRelationship.createBidirectional = async function(
  userId, 
  relatedUserId, 
  userLevel, 
  userType, 
  relatedUserLevel, 
  relatedUserType, 
  transaction = null
) {
  const relationships = await Promise.all([
    this.create({
      userId,
      relatedUserId,
      relationshipLevel: userLevel,
      relationshipType: userType
    }, { transaction }),
    this.create({
      userId: relatedUserId,
      relatedUserId: userId,
      relationshipLevel: relatedUserLevel,
      relationshipType: relatedUserType
    }, { transaction })
  ]);
  
  return relationships;
};

// Class method to remove bidirectional indirect relationship
IndirectRelationship.removeBidirectional = async function(userId, relatedUserId, transaction = null) {
  await Promise.all([
    this.destroy({
      where: { userId, relatedUserId }
    }, { transaction }),
    this.destroy({
      where: { userId: relatedUserId, relatedUserId: userId }
    }, { transaction })
  ]);
};

// Helper method to get relationship type based on level and gender
IndirectRelationship.getRelationshipType = async function(level, gender) {
  const RelationshipType = require('./RelationshipType');
  
  try {
    // Try to get from database first
    const relationshipName = await RelationshipType.getRelationshipName(level, gender);
    return relationshipName;
  } catch (error) {
    console.error('Error getting relationship type:', error);
    // Fallback to basic logic
    return this.getBasicRelationshipType(level, gender);
  }
};

// Fallback method for basic relationship types
IndirectRelationship.getBasicRelationshipType = function(level, gender) {
  const relationships = {
    1: {
      male: 'father',
      female: 'mother'
    },
    2: {
      male: 'grandfather',
      female: 'grandmother'
    },
    3: {
      male: 'great-grandfather',
      female: 'great-grandmother'
    },
    '-1': {
      male: 'son',
      female: 'daughter'
    },
    '-2': {
      male: 'grandson',
      female: 'granddaughter'
    },
    '-3': {
      male: 'great-grandson',
      female: 'great-granddaughter'
    },
    0: {
      male: 'brother',
      female: 'sister'
    }
  };

  return relationships[level] && relationships[level][gender] 
    ? relationships[level][gender] 
    : 'relative';
};

module.exports = IndirectRelationship;
