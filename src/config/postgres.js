const { Pool } = require('pg');
require('dotenv').config();

let pool;

const initPostgres = async () => {
  try {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Test the connection
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully');
    client.release();
    
    return pool;
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized. Call initPostgres() first.');
  }
  return pool;
};

const closePool = async () => {
  if (pool) {
    await pool.end();
    console.log('PostgreSQL pool closed');
  }
};

// Helper function to execute queries
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

module.exports = {
  initPostgres,
  getPool,
  closePool,
  query
};