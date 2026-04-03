const { createClient } = require('redis');

let client = null;
let ready = false;

function getRedisClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        socketTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            console.error('[Redis] Max reconnection attempts reached');
            return new Error('Max reconnection attempts');
          }
          // Exponential backoff capped at 3 seconds
          const delay = Math.min(retries * 100, 3000);
          console.warn(`[Redis] Reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      },
    });

    client.on('ready', () => {
      ready = true;
      console.log('[Redis] Client ready');
    });

    client.on('error', (err) => {
      ready = false;
      console.error('[Redis] Client error:', err.message);
    });

    client.on('end', () => {
      ready = false;
      console.warn('[Redis] Connection closed');
    });
  }

  return client;
}

function isAvailable() {
  return ready && client !== null && client.isReady;
}

async function connectRedis() {
  try {
    const c = getRedisClient();
    await c.connect();
    console.log('[Redis] Connected successfully');
  } catch (err) {
    console.warn(`[Redis] Connection failed — server continues without cache: ${err.message}`);
  }
}

async function disconnectRedis() {
  if (client) {
    try {
      await client.quit();
    } catch {
      // Ignore errors on shutdown
    }
    client = null;
    ready = false;
  }
}

module.exports = { getRedisClient, isAvailable, connectRedis, disconnectRedis };
