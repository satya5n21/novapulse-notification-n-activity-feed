import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ---- GET /api/notifications/:userId ------------------------------------------
export const getUserNotifications = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { read, limit = 20, page = 1 } = req.query;

        if (!isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                error: { message: "Invalid userId format" }
            });
        }

        const filter = { userId };
        if (read !== undefined) {
            filter.read = read === "true";
        }

        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (parseInt(page) - 1) * limitNum;

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Notification.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: notifications,
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

// ---- GET /api/notifications/:userId/unread ------------------------------------
export const getUnreadCount = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                error: { message: "Invalid userId format" }
            });
        }

        const count = await Notification.countDocuments({ userId, read: false });

        return res, status(200).json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        next(error);
    }
}

// ---- PATCH /api/notifications/:userId/read ------------------------------------
export const markAsRead = async()   