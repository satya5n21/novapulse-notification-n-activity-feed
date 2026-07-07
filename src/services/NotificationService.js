import mongoose from 'mongoose';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// ---- Messag Templates --------------------------------
// pre-render a human-readable message at write time
// stored in Notification.message - no join needed at read time

const buildMessage = (eventType, payload, sourceName) => {
    const actor = sourceName ?? "System";

    const templates = {
        "task_completed": `${actor} completed task: ${payload.taskName ?? "Untitled"}`,
        "comment_added": `${actor} added a comment`,
        "mention": `${actor} mentioned you`,
        "level_up": `You reached level ${payload.newLevel ?? "?"}! (+${payload.xpEarned ?? 0} XP)`,
        "achievement_unlocked": `You unlocked achievement: ${payload.achievementName ?? "Unknown"}`,
        "followed": `${actor} started following you`,
        "post_liked": `${actor} liked your post`
    };

    return templates[eventType] ?? `New event: ${eventType}`;
};

// ---- Resolve target users ----------------------------
// If targetUserIds is empty -> broadcast to ALL users subscribed to thisevent type.
// If targetUserIds is provided -> filterdown to only those who are subscribed.
// This means a user will never get a notification for an event type they 
// opted out of, even if they were explicitly targeted.

const resolveTargetUsers = async (eventType, targetUserIds) => {
    const isBoradcast = !targetUserIds || targetUserIds.length === 0;

    const filter = {
        subscribedEventTypes: eventType,
        isActive: true
    };

    if (!isBoradcast) {
        filter._id = { $in: targetUserIds };
    }

    return User.find(filter, "_id name").lean();
};

// ---- Main Service ----------------------------------------
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

        // 2. Resolve which users should receive this notification
        const targetUsers = await resolveTargetUsers(type, targetUserIds);

        if (targetUsers.length === 0) {
            console.log(`[NotificationService] No eligible recipients for event ${eventId}`);
            return [];
        }

        // 3. Build notification documents for insert
        const notifications = targetUsers.map((user) => ({
            userId: user._id,
            eventId: new mongoose.Types.ObjectId(eventId),
            eventType: type,
            message: buildMessage(type, payload, sourceName)
        }));

        // 4. Bulk insert - ordered: false means one duplicate won't 
        // block the rest (unique index on userId+eventId handles dupes)
        let inserted = [];
        try {
            inserted = await Notification.insertMany(notifications, {
                ordered: false,
                // return only successfully inserted docs
            });
        } catch (error) {
            // BulkWriteError code 11000 = duplicate key - safe to ignore
            if (error.code === 11000 || error.writeErrors?.length) {
                inserted = error.insertedDocs ?? [];
                console.warn(
                    `[NotificationService] ${error.writeErrors?.length ?? 0} duplicate(s) skipped for event ${eventId}`
                );
            } else {
                throw error;
            }
        }

        // 5. Mark the source event as processed in MongoDB
        await mongoose.model("Event").findByIdAndUpdate(eventId, {
            processed: true
        });

        console.log(
            `[NotificationService] Event ${eventId} [${type}] -> ${inserted.length} notifications created`
        );

        return inserted;
    }
};

export default new NotificationService();