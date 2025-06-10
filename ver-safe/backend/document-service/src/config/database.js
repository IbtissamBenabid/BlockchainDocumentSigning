const { Pool } = require('pg');

let pool;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'versafe_db',
  user: process.env.DB_USER || 'versafe_user',
  password: process.env.DB_PASSWORD || 'versafe_password',
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // how long to wait when connecting a new client
};

async function connectDB() {
  try {
    pool = new Pool(dbConfig);
    
    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('Database connection established successfully');
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

function getDB() {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return pool;
}

async function closeDB() {
  if (pool) {
    await pool.end();
    console.log('Database connection closed');
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB
};
