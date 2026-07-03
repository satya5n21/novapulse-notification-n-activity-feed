import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';
import { ingestEvent, getEvents, getEventById } from '../controllers/eventController.js';
import { EVENT_TYPES } from '../config/env.js';

const router = Router();

const createEventSchema = z.object({
    type: z.enum(EVENT_TYPES, {
        errorMap: () => ({
            message: `type must be one of: ${EVENT_TYPES.join(",")})`
        }),
    }),

    // Optional - null means system-generated event
    sourceUserId: z.string()
        .regex(/^[a-f\d]{24}$/i, "sourceUserId must be a valid MongoDB ObjectId")
        .nullable()
        .optional()
        .default(null),

    // Optional - Empty array means broadcast to all subscribers
    targetUserIds: z.array(
        z.string()
            .regex(/^[a-f\d]{24}$/i, "Each targetUserId must be a valid MongoDB ObjectId")
    )
        .optional()
        .default([]),

    // Flexible object - any shape is accepted
    payload: z.record(z.unknown())
        .optional()
        .default([])
});

// POST /api/events -- ingest a new event
// GET /api/events -- list events (with filters)
// GET /api/event/:id -- get single event by ID
router.post("/", validate(createEventSchema), ingestEvent);
router.get("/", getEvents);
router.get("/:id", getEventById);

export default router;