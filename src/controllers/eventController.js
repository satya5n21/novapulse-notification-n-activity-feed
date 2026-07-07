import mongoose from 'mongoose';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { redisClient } from '../config/redis.js';
import { REDIS_EVENT_CAHNNEL } from '../config/env.js'

// ---- Helpers --------------------------------------------------
const REDIS_CHANNEL = REDIS_EVENT_CAHNNEL;

// Builds the Redis message published after an event is saved
const buildPublishPaylod = (event) => ({
    eventId: event._id.toString(),
    type: event.type,
    sourceUserId: event.sourceUserId?.toString() ?? null,
    targetUserIds: event.targetUserIds.map((id) => id.toString()),
    payload: event.payload,
    createdAt: event.createdAt.toISOString(),
});

// ---- POST /api/events ------------------------------------------
export const ingestEvent = async (req, res, next) => {
    try {
        const { type, sourceUserId, targetUserIds, payload } = req.body;
        console.debug("events reqBody::", type, sourceUserId, targetUserIds, payload);

        // if sourceUserId was provided. verify the user actually exists
        if (sourceUserId) {
            const sourceExists = await User.exists({ _id: sourceUserId });
            if (!sourceExists) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: `Source user ${sourceUserId} not found.`
                    }
                });
            }
        }

        if (targetUserIds.length > 0) {
            const foundCount = await User.countDocuments({
                _id: { $in: targetUserIds }
            });
            if (foundCount !== targetUserIds.length) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: "One or more targetUserIds do not exists"
                    }
                })
            }
        }

        // Persist the event to MongoDB
        const event = await Event.create({
            type,
            sourceUserId: sourceUserId ?? null,
            targetUserIds,
            payload,
        });

        // Publish to Redis so the subscriber can fan out notification
        // We do this AFTER a successful DB write - never to publish an event that wasn't persisted
        const publishPaylod = buildPublishPaylod(event);
        await redisClient.publish(REDIS_CHANNEL, JSON.stringify(publishPaylod));

        console.log(`[Event] ingested & published [${type}] -> ${event._id}`);

        return res.status(201).json({
            success: true,
            data: event
        });
    } catch (error) {
        next(error);
    }
};

// ---- GET /api/update -------------------------------------------
export const getEvents = async (req, res, next) => {
    try {
        const {
            type,
            sourceUserId,
            processed,
            limit = 20,
            page = 1
        } = req.query;

        const filter = {};

        if (type) {
            filter.type = type;
        };

        if (sourceUserId) {
            if (!mongoose.Types.ObjectId.isValid(sourceUserId)) {
                return res.status(400).json({
                    success: false,
                    error: { message: "Invalid sourceUserId format" }
                });
            }
            filter.sourceUserId = sourceUserId;
        }

        if (processed !== undefined) {
            filter.processed = processed === "true";
        }

        const limitNum = Math.min(parseInt(limit), 100) // cap at 100
        const skip = (parseInt(page) - 1) * limitNum;

        const [events, total] = await Promise.all([
            Event.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Event.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: events,
            meta: {
                total,
                page: parseInt(page),
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        })
    } catch (error) {
        next(error);
    }
}

// ---- GET /api/events/:id ---------------------------------------
export const getEventById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: { message: "Invalid Evnet ID format" }
            });
        }

        const event = await Event.findById(id).lean();

        if (!event) {
            return res.status(404).json({
                success: false,
                error: { message: `Event ${id} not found` }
            });
        }

        return res.status(200).json({
            success: true,
            data: event
        });

    } catch (error) {
        next(error);
    }
}