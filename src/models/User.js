const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  middleName: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      len: [5, 100]
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  profilePicture: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  hasMedication: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  medicationName: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  medicationFrequency: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  medicationTime: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDeceased: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  staysWithUser: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fatherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  motherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'users',
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['fatherId']
    },
    {
      fields: ['motherId']
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.getFullName = function() {
  return this.middleName 
    ? `${this.firstName} ${this.middleName} ${this.lastName}`
    : `${this.firstName} ${this.lastName}`;
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

// Self-referential associations for parent relationships
User.belongsTo(User, { as: 'father', foreignKey: 'fatherId' });
User.belongsTo(User, { as: 'mother', foreignKey: 'motherId' });
User.hasMany(User, { as: 'childrenAsFather', foreignKey: 'fatherId' });
User.hasMany(User, { as: 'childrenAsMother', foreignKey: 'motherId' });

module.exports = User;
