import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../config/mongo.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import { EVENT_TYPES } from '../config/env.js';

const USERS = [
    {
        name: "Alice Chen",
        email: "alice@novapulse.dev",
        subscribedEventTypes: EVENT_TYPES // subscribed to everything
    },
    {
        name: "Bob Zhao",
        email: "bob@novapulse.dev",
        subscribedEventTypes: ["task_completed", "mention", "comment_added"]
    },
    {
        name: "Charlie Davis",
        email: "charlie@novapulse.dev",
        subscribedEventTypes: ["level_up", "achievement_unlocked", "followed",]
    },
    {
        name: "Diana Evans",
        email: "diana@novapulse.dev",
        subscribedEventTypes: ["mention", "post_liked"]
    },
    {
        name: "Eve Santos",
        email: "eve@novapulse.dev",
        subscribedEventTypes: EVENT_TYPES
    },
];

const seed = async () => {
    await connectMongo();

    console.log("[Seed] Clearing existing data...");
    await Promise.all([
        User.deleteMany({}),
        Event.deleteMany({}),
        Notification.deleteMany({})
    ]);

    console.log("[Seed] Inserting users...");
    const users = await User.insertMany(USERS);
    users.forEach((u) => console.log(`  ✅ (${u.name}) (${u._id})`));

    console.log("[Seed] Inserting sample events...");
    const [alice, bob, eve] = users;

    const events = await Event.insertMany([
        {
            type: "task_completed",
            sourceUserId: alice._id,
            targetUserIds: [
                bob._id,
                eve._id
            ],
            payload: {
                taskName: "Desgin the data schema",
                projectId: "proj_001"
            }
        },
        {
            type: "mention",
            sourceUserId: bob._id,
            targetUserIds: [
                alice._id
            ],
            payload: {
                comment: "Hey @alice can you review this PR?",
                prId: "pr_42"
            }
        },
        {
            type: "level_up",
            sourceUserId: null,
            targetUserIds: [
                eve._id
            ],
            payload: {
                newLevel: 12,
                previousLevel: 12,
                xpEarned: 500
            }
        },
    ]);
    events.forEach((e) => console.log(`  ✅ (${e.type}) (${e._id})`));

    console.log("[Seed] Inserting sample notifications...");
    await Notification.insertMany([
        {
            userId: bob._id,
            eventId: events[0]._id,
            eventType: "task_completed",
            message: "Alice Chen completed task: Design the data schema"
        },
        {
            userId: eve._id,
            eventId: events[0]._id,
            eventType: "task_completed",
            message: "Alice Chen completed task: Design the data schema"
        },
        {
            userId: alice._id,
            eventId: events[1]._id,
            eventType: "mention",
            message: "Bob Zhao mentioned you in a comment"
        },
        {
            userId: eve._id,
            eventId: events[2]._id,
            eventType: "level_up",
            message: "You reached level 12! (+500 XP)"
        },
    ]);

    console.log("[Seed] Done. Summury:");
    console.log(`   Users:          ${await User.countDocuments()}`);
    console.log(`   Events:         ${await Event.countDocuments()}`);
    console.log(`   Notifications:  ${await Notification.countDocuments()}`);

    await disconnectMongo();
    process.exit(0);
};

seed().catch((error) => {
    console.error("[Seed] Failed:", error.message);
    process.exit(1);
});