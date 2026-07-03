import mongoose from 'mongoose';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { EVENT_TYPES } from '../config/env.js';

// -------- Message Template ----------
// pre-render a human-readable message at write time.
// stored in Notification.message - no joins needed at read time

const buildMessage = (eventType, payload, sourceName) => {
    const actor = sourceName ?? "System";

    const templates = {
        "task_completed": `${actor} completed task: ${payload.taskName ?? "Untitled"}`,
        "comment_added": `${actor} added a comment`,
        "mention": `${actor} mentioned you`,
        "level_up": `You reached level ${payload.newLevel ?? "?"}! (+${payload.xpEarned ?? 0} XP)`,
        "achievement_unlocked": `You unlocked achievement: ${payload.achievementName ?? "Unknown"}`,
        "followed": `${actor} started following you`,
        "post_liked": `${actor} liked your post`,
    };

    return templates[eventType] ?? `New event: ${eventType}`;
};

// ---- Resolve target users -------------------
// If targetUserIds is empty -> broadcast to All users subscribed to this event type.
// If targetUserIds is provided -> filter down to only those who are subscribed.
// This reoslves that a user will not get notification for an event type they have opted out of, even if he was expicitly targeted

const resolveTargetUsers = async (eventType, targetUserIds) => {
    const isBroadcast = !targetUserIds || targetUserIds.length === 0;

    const filter = {
        subscribedEventTypes: eventType,
        isActive: true
    };

    if (!isBroadcast) {
        filter._id = { $in: targetUserIds }
    };

    return User.find(filter, "_id name").lean();
};

// ---- Main service ---------------------------
export class NotificationService {
    // called by the event subscriber with the parsed Redis message payload
    // Returns the list of created notifications.

    async processEvent(eventPayload) {
        const { eventId, type, sourceUserId, targetUserIds, payload } = eventPayload;

        // 1. Resolve the source user's name for message templating (if exists)
        let sourceName = null;
        if (sourceUserId) {
            const sourceUser = await User.findById(sourceUserId, "name").lean();
            sourceName = sourceUser?.name ?? null;
        }

        // 2. Resolve which users should receive this notificaiton
        const targetUsers = await resolveTargetUsers(type, targetUserIds);

        if (targetUserIds.length === 0) {
            console.log(`[NotificationService] No eligible recipients for event ${eventId}`);
            return [];
        }

        // 3. Build notification documents for bulk insert
        const notificaitons = targetUsers.map((user) => ({
            userId: user._id,
            eventId: new mongoose.Types.ObjectId(eventId),
            eventType: type,
            message: buildMessage(type, payload, sourceName)
        }));

        // 4. Bulk insert - ordered: false means one duplicate won't block the rest (unique index on userId+eventId handles dupes)
        let insertd = [];
        try {
            insertd = await Notification.insertMany(notificaitons, {
                ordered: false,
                // returns only the successfully inserted docs
            });
        } catch (error) {
            // BulkWriteError code 11000 = duplicate key - safe to ignore
            if (error.code === 11000 || error.writeErrors?.length) {
                insertd
            }
        }
    }
}