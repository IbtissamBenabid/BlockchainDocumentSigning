const { Pool } = require('pg');

let pool;

const connectDB = async () => {
  try {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'versafe_db',
      user: process.env.DB_USER || 'versafe_user',
      password: process.env.DB_PASSWORD || 'versafe_password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    const client = await pool.connect();
    console.log('Database connection established successfully');
    client.release();

    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const getDB = () => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  return pool;
};

module.exports = {
  connectDB,
  getDB
};
