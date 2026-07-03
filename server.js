import app from './src/app.js';
import { ENV } from './src/config/env.js';
import { connectMongo, disconnectMongo } from './src/config/mongo.js';
import { connectRedis, disconnectRedis } from './src/config/redis.js';

const start = async () => {
    await connectMongo();
    await connectRedis();

    const server = app.listen(ENV.PORT, () => {
        console.log(`[NovaPulse] Server running on port: ${ENV.PORT} (${ENV.NODE_ENV})`);
    });

    // Graceful shutdown - close DB connections before process exists
    const shutdown = async (signal) => {
        console.log(`\n[NovaPulse] ${signal} Received . Shutting down...`);
        server.close(async () => {
            await disconnectMongo();
            await disconnectRedis();
            console.log("[NovaPulse] shutdown complete.")
            process.exit(0);
        });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
};

start();