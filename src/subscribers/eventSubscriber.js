import { redisSub } from '../config/redis.js';
import notificationService from '../services/NotificationService.js';
import { REDIS_EVENT_CAHNNEL } from '../config/env.js';

const CHANNEL = REDIS_EVENT_CAHNNEL;

// In-memeory queue for messages that arrive while a previous one
// is still being processed - prevents parallel DB writes for the
// same batch, keeps processing sequential and predictable
let isProcessing = false;
const queue = [];

const processQueue = async () => {
    if (isProcessing || queue.length === 0) return;

    isProcessing = true;

    while (queue.length > 0) {
        const raw = queue.shift();

        try {
            const eventPaylod = JSON.parse(raw);
            await notificationService.processEvent(eventPaylod);
        } catch (error) {
            // Log but don't crash the subscriber loop
            // will add dead-letter mechanism here
            console.error(`[EventSubscriber] Failed to process message: ${error.message}`);
            console.error(`[EventSubscriber] Raw payload: ${raw}`);
        }
    }

    isProcessing = false;
};

export const startEventSubscriber = async () => {
    // redisSub is a dedicated Redis Client - once subscribed
    // it can only receive messages, not issue commands
    await redisSub.subscribe(CHANNEL, (error) => {
        if (error) {
            console.error(`[EventSubscriber] Failed to subscribe: ${error.message}`);
            process.exit(1);
        }
        console.log(`[EvenetSubscriber] Subscribed to channel: ${CHANNEL}`);
    });

    redisSub.on("message", (channel, message) => {
        if (channel !== CHANNEL) return;

        queue.push(message);
        // Kick off processing - if already running,
        // the while loop above will pick up the newly queued item
        processQueue().catch((error) =>
            console.error(`[EventSubscriber] Queue error: ${error.message}`)
        );
    });

    redisSub.on('error', (error) => {
        console.error(`[EventSubscriber] Redis error: ${error.message}`);
    });
};
