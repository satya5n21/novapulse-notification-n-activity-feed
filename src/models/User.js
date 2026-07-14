import mongoose from 'mongoose';
import { EVENT_TYPES } from '../config/env.js';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: 2,
        maxlength: 64
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
    // which event typrs this ussr wants to get notifications of
    subscribedEventTypes: {
        type: [String],
        enum: EVENT_TYPES,
        default: EVENT_TYPES, // subscribing to all by defult
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

// Indexing for fast preference lookups during fan-out
userSchema.index({ subscribedEventTypes: 1 });
// userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
export default User;