const neo4j = require('neo4j-driver');
require('dotenv').config();

let driver;

const initDriver = async () => {
  driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
  );
  await driver.verifyConnectivity();
  console.log('Neo4j driver connected');
};

const getDriver = () => {
  if (!driver) {
    throw new Error('Neo4j driver not initialized');
  }
  return driver;
};

const closeDriver = async () => {
  if (driver) {
    await driver.close();
    console.log('Neo4j driver disconnected');
  }
};

module.exports = { initDriver, getDriver, closeDriver };
