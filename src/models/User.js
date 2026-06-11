import mongoose from 'mongoose';

const EVENT_TYPES = [
  "task_completed",
  "comment_added",
  "mention",
  "level_up",
  "achievement_unlocked",
  "followed",
  "post_liked"
];

export { EVENT_TYPES };

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
userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
export default User;

