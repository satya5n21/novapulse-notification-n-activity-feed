import mongoose from 'mongoose';
import { EVENT_TYPES } from '../config/env.js';

const eventSchema = new mongoose.Schema({
    type: {
        type: String,
        required: [true, "Event type is required"],
        enum: {
            values: EVENT_TYPES,
            message: "{VALUE} is not a supported event type"
        }
    },

    // who triggered the event (optional as it can be system generated)
    sourceUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // explicit list of users this event is relevant to
    // Empty arr = broadcast to all users subscribed to  this event type
    targetUserIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: []
    },

    // Felxible payload - stores event-specific data
    payload: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Wheather this event has been fully processed by the notification service
    processed: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

// Compund index - most common query pattern: filter by type, sort by time
eventSchema.index({ type: 1, createdAt: -1 });

// For querying events by source user (e.g: "activity by userId")
eventSchema.index({ sourceUserId: 1, createdAt: -1 });

// For querying events targetting a specific user
eventSchema.index({ targetUserIds: 1, createdAt: -1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;