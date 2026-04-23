// src/Modules/Notification/notification.controller.js
import { notificationService } from './notification.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

export const notificationController = {
  // GET /notifications — fetch all in-app notifications for current user
  async getUserNotifications(req, res, next) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user.id);
      successResponse(res, 200, 'Notifications retrieved successfully', { notifications });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /notifications/:id/read — mark single notification as read
  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req.user.id, req.params.id);
      successResponse(res, 200, 'Notification marked as read', { notification });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /notifications/mark-all-read — mark all unread notifications as read
  async markAllAsRead(req, res, next) {
    try {
      const count = await notificationService.markAllAsRead(req.user.id);
      successResponse(res, 200, `Marked ${count} notifications as read`);
    } catch (error) {
      next(error);
    }
  },

  // POST /notifications/send-reminders — admin: manually trigger workout reminders
  async sendReminders(req, res, next) {
    try {
      const result = await notificationService.sendWorkoutReminders();
      successResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  },

  // POST /notifications/schedule — admin: schedule a future notification
  async scheduleNotification(req, res, next) {
    try {
      const notification = await notificationService.scheduleNotification(req.body);
      successResponse(res, 201, 'Notification scheduled', { notification });
    } catch (error) {
      next(error);
    }
  }
};
