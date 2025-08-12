const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DirectRelationship = sequelize.define('DirectRelationship', {
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
  relationshipType: {
    type: DataTypes.ENUM('husband', 'wife', 'partner'),
    allowNull: false
  }
}, {
  tableName: 'direct_relationships',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['relatedUserId']
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

// Class method to create bidirectional relationship
DirectRelationship.createBidirectional = async function(userId, relatedUserId, userType, relatedUserType, transaction = null) {
  const relationships = await Promise.all([
    this.create({
      userId,
      relatedUserId,
      relationshipType: userType
    }, { transaction }),
    this.create({
      userId: relatedUserId,
      relatedUserId: userId,
      relationshipType: relatedUserType
    }, { transaction })
  ]);
  
  return relationships;
};

// Class method to remove bidirectional relationship
DirectRelationship.removeBidirectional = async function(userId, relatedUserId, transaction = null) {
  await Promise.all([
    this.destroy({
      where: { userId, relatedUserId }
    }, { transaction }),
    this.destroy({
      where: { userId: relatedUserId, relatedUserId: userId }
    }, { transaction })
  ]);
};

module.exports = DirectRelationship;
