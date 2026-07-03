import mongoose, { mongo } from 'mongoose';
import { ENV } from './env.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

let retries = 0;

const connect = async () => {
    try {
        await mongoose.connect(ENV.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("✅ [MongoDB]: connected successfully");
        retries = 0;
    } catch (error) {
        retries++;
        console.error(`[MongoDB] connection failed (attempt ${retries}): ${error.message}]`);

        if (retries >= MAX_RETRIES) {
            console.log("[MongoDB] Max retries reached. Exiting");
            process.exit(1);
        }

        console.log(`[MongoDB] retrying in ${RETRY_DELAY_MS / 1000}s...`);
        setTimeout(connect, RETRY_DELAY_MS);
    }
};

mongoose.connection.on("disconnected", () => {
    console.warn(`[MongoDB] Disconnected. Attempting reconnect...`);
    connect();
});

export const connectMongo = connect;

export const disconnectMongo = async () => {
    await mongoose.connection.close();
    console.log("[MongoDB] Connection closed");
};

export const getMongoStatus = () => {
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };
    return states[mongoose.connection.readyState] || "unknown";
}