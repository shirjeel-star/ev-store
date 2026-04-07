const Redis = require('ioredis');
const logger = require('./logger');

let redis;

async function connectRedis() {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => logger.error('Redis error', err));
  return redis;
}

function getRedis() {
  if (!redis) throw new Error('Redis not initialized');
  return redis;
}

module.exports = { connectRedis, getRedis };
