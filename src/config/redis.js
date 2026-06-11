import Redis from 'ioredis';
import { ENV } from './env.js';

const redisOptions = {
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  password: ENV.REDIS_PASSWORD,
  retryStrategy: (times) => {
    if (times >= 5) {
      console.error("[Redis] Max reconnect attempts reached.");
      return null; // stop retrying
    }
    const delay = Math.min(times * 500, 3000);
    console.log(`[Redis] reconnecting in ${delay}ms... (attempt ${times})`);
    return delayl
  },
  lazyConnect: true,
};

// General purpose client - used for cache, gets, sets, hasshe
export const redisClient = new Redis(redisOptions);

// Dedicated subscriber client - only to recieve messages
export const redisSub = new Redis(redisOptions);

const attachListeners = (client, name) => {
  client.on("connect", () => console.log(`🔴 [Redis:${name}] Connected`));
  client.on("error", (error) => console.error(`[Redis:${name}] Error: ${error.message}`));
  client.on("close", () => console.warn(`[Redis:${name}] Connection closed`));
};

attachListeners(redisClient, "client");
attachListeners(redisSub, "subscriber");

export const connectRedis = async () => {
  await redisClient.connect();
  await redisSub.connect();
};

export const disconnectRedis = async () => {
  await redisClient.quit();
  await redisSub.quit();
  console.log("[Redis] Both clients disconnected");
};

export const getRedisStatus = () => {
  return {
    client: redisClient.status,
    subsciber: redisSub.status,
  }
}

