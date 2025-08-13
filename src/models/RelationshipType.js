const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RelationshipType = sequelize.define('RelationshipType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true,
      min: -50, // Allow up to 50 generations down
      max: 50   // Allow up to 50 generations up
    }
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'neutral'),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('direct', 'indirect'),
    allowNull: false
  },
  subcategory: {
    type: DataTypes.ENUM('blood', 'marriage', 'adoption', 'step', 'half'),
    allowNull: true
  },
  reciprocalName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'reciprocal_name'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order'
  }
}, {
  tableName: 'relationship_types',
  indexes: [
    {
      fields: ['level']
    },
    {
      fields: ['gender']
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['level', 'gender']
    }
  ]
});

// Class methods for finding relationship types
RelationshipType.findByLevelAndGender = async function(level, gender) {
  return await this.findAll({
    where: {
      level,
      gender: [gender, 'neutral'],
      isActive: true
    },
    order: [['sortOrder', 'ASC'], ['name', 'ASC']]
  });
};

RelationshipType.findByCategory = async function(category) {
  return await this.findAll({
    where: {
      category,
      isActive: true
    },
    order: [['level', 'ASC'], ['sortOrder', 'ASC'], ['name', 'ASC']]
  });
};

RelationshipType.getRelationshipName = async function(level, gender) {
  const relationships = await this.findByLevelAndGender(level, gender);
  
  if (relationships.length > 0) {
    // Prefer gender-specific over neutral
    const genderSpecific = relationships.find(r => r.gender === gender);
    return genderSpecific ? genderSpecific.name : relationships[0].name;
  }
  
  // Fallback to dynamic generation for extreme levels
  return this.generateDynamicRelationshipName(level, gender);
};

RelationshipType.generateDynamicRelationshipName = function(level, gender) {
  if (level > 0) {
    // Ancestors
    if (level === 1) return gender === 'male' ? 'father' : 'mother';
    if (level === 2) return gender === 'male' ? 'grandfather' : 'grandmother';
    
    // For level 3+, add "great-" prefixes
    const greats = 'great-'.repeat(level - 2);
    return gender === 'male' ? `${greats}grandfather` : `${greats}grandmother`;
  }
  
  if (level < 0) {
    // Descendants
    const absLevel = Math.abs(level);
    if (absLevel === 1) return gender === 'male' ? 'son' : 'daughter';
    if (absLevel === 2) return gender === 'male' ? 'grandson' : 'granddaughter';
    
    // For level 3+, add "great-" prefixes
    const greats = 'great-'.repeat(absLevel - 2);
    return gender === 'male' ? `${greats}grandson` : `${greats}granddaughter`;
  }
  
  // Level 0 (same generation)
  return gender === 'male' ? 'brother' : 'sister';
};

RelationshipType.getAllowedInputTypes = async function() {
  const types = await this.findAll({
    where: {
      isActive: true,
      // Only return types that can be used for adding new family members
      category: ['direct', 'indirect']
    },
    attributes: ['name', 'level', 'gender', 'category', 'description'],
    order: [['category', 'ASC'], ['level', 'DESC'], ['sortOrder', 'ASC']]
  });
  
  return types.map(type => ({
    value: type.name,
    label: type.name.charAt(0).toUpperCase() + type.name.slice(1),
    level: type.level,
    gender: type.gender,
    category: type.category,
    description: type.description
  }));
};

module.exports = RelationshipType;