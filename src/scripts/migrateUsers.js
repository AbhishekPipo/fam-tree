const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { initDriver, getDriver, closeDriver } = require('../config/db');
const User = require('../models/User');

const migrateUsers = async () => {
  try {
    await initDriver();
    const driver = getDriver();

    const usersFilePath = path.join(__dirname, 'users.json');
    const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await User.createUser({
        email: user.email,
        password: hashedPassword,
        name: user.name,
      });
      console.log(`User ${user.email} migrated.`);
    }

  } catch (error) {
    console.error('Error migrating users:', error);
  } finally {
    await closeDriver();
  }
};

migrateUsers();
