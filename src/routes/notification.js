import { Router } from 'express';
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
} from '../controllers/notificationController.js';

const router = Router();

// ---- paginatedd list ----
router.get("/:userId", getUserNotifications);

// ---- unread count -------
router.get("/:userId/unread", getUnreadCount);

// ---- mark one as read ---
router.patch("/:id/read", markAsRead);

// ---- mark all as read ---
router.patch("/:userId/read-all", markAllAsRead);