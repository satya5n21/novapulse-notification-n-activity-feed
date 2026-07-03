import { Router } from 'express';
import { getMongoStatus } from '../config/mongo.js';
import { getRedisStatus } from '../config/redis.js';

const router = Router();

router.get('/health', (req, res) => {
    const mongo = getMongoStatus();
    const redis = getRedisStatus();

    const allHealthy =
        mongo.client === 'ready' &&
        redis.client === 'ready' &&
        redis.subsciber === 'ready';

    res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'ok' : 'degraded',
        uptime: `${Math.floor(process.uptime())}s`,
        timestamp: new Date().toISOString(),
        services: {
            mongodb: mongo,
            redis: {
                client: redis.client,
                subsciber: redis.subsciber,
            }
        }
    });
});

export default router;