const redis = require('redis');

let client;

async function connectRedis() {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis client connected');
    });

    client.on('ready', () => {
      console.log('Redis client ready');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
}

function getRedis() {
  if (!client) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return client;
}

async function closeRedis() {
  if (client) {
    await client.quit();
    console.log('Redis connection closed');
  }
}

module.exports = {
  connectRedis,
  getRedis,
  closeRedis
};
