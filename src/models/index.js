const sequelize = require('../config/database');
const User = require('./User');
const DirectRelationship = require('./DirectRelationship');
const IndirectRelationship = require('./IndirectRelationship');
const RelationshipType = require('./RelationshipType');

// Define associations between models
User.hasMany(DirectRelationship, { foreignKey: 'userId', as: 'directRelationships' });
User.hasMany(DirectRelationship, { foreignKey: 'relatedUserId', as: 'directRelationsTo' });

User.hasMany(IndirectRelationship, { foreignKey: 'userId', as: 'indirectRelationships' });
User.hasMany(IndirectRelationship, { foreignKey: 'relatedUserId', as: 'indirectRelationsTo' });

DirectRelationship.belongsTo(User, { foreignKey: 'userId', as: 'user' });
DirectRelationship.belongsTo(User, { foreignKey: 'relatedUserId', as: 'relatedUser' });

IndirectRelationship.belongsTo(User, { foreignKey: 'userId', as: 'user' });
IndirectRelationship.belongsTo(User, { foreignKey: 'relatedUserId', as: 'relatedUser' });

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  DirectRelationship,
  IndirectRelationship,
  RelationshipType
};
