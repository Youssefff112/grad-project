// src/Modules/Notification/notification.routes.js
import { Router } from 'express';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { notificationController } from './notification.controller.js';

const router = Router();

// ─── User Routes (authenticated) ─────────────────────────────────────────────
router.get('/', authenticate, notificationController.getUserNotifications);
router.patch('/mark-all-read', authenticate, notificationController.markAllAsRead);
router.patch('/:id/read', authenticate, notificationController.markAsRead);

// ─── Admin Routes ──────────────────────────────────────────────────────────
router.post('/send-reminders', authenticate, restrictTo('admin'), notificationController.sendReminders);
router.post('/schedule', authenticate, restrictTo('admin'), notificationController.scheduleNotification);

export default router;