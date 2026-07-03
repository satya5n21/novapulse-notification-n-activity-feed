import mongoose, { mongo } from 'mongoose';
import { EVENT_TYPES } from '../config/env';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "userId is required"]
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: [true, "eventId is required"]
    },

    // Denormalize for fast reads - avoids join just to show message
    eventType: {
        type: String,
        enum: EVENT_TYPES,
        required: true
    },

    // Pre-rendered human-readable message stored at write time
    message: {
        type: String,
        required: [true, "message is required"],
        maxlength: 256
    },
    read: {
        type: Boolean,
        default: false
    },

    // when the notification was delivered via SSE (null = not yet delivered)
    deliveredAt: {
        type: Date,
        default: null,
    }
}, { timestamps: true });

// Primary query pattern: all notification for a user, newest first
notificationSchema.index({ userId: 1, createdAt: -1 });

// Unread count query: userId + read status
notificationSchema.index({ userId: 1, read: 1 });

// Prevent duplicate notifications for the same user + event
notificationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;