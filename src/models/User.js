const { getDriver } = require('../config/db');

const createUser = async (user) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(
      'CREATE (u:User {id: randomUUID(), email: $email, password: $password, name: $name}) RETURN u',
      user
    );
    return result.records[0].get('u').properties;
  } finally {
    await session.close();
  }
};

const findUserByEmail = async (email) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run('MATCH (u:User {email: $email}) RETURN u', { email });
    if (result.records.length === 0) {
      return null;
    }
    return result.records[0].get('u').properties;
  } finally {
    await session.close();
  }
};

module.exports = { createUser, findUserByEmail };
