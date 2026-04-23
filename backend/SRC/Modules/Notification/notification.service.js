import { WorkoutPlan } from '../Workout/workout.model.js';
import { User } from '../User/user.model.js';
import { Notification } from './notification.model.js';
import { sendEmail, sendWorkoutReminderEmail } from '../../Utils/Emails/sendEmail.utils.js';
import { AppError } from '../../Utils/appError.utils.js';
import { Op } from 'sequelize';

export const notificationService = {
  // Send workout reminders (FR-3.4)
  async sendWorkoutReminders() {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    // Find all active workout plans for today
    const plans = await WorkoutPlan.findAll({
      where: { isActive: true }
    });

    let sentCount = 0;
    for (const plan of plans) {
      const todayWorkout = (plan.weeklySchedule || []).find(d => d.day === today && !d.isRestDay);
      if (!todayWorkout) continue;

      const user = await User.findByPk(plan.userId);
      if (user && user.userType === 'offline') {
        try {
          await sendWorkoutReminderEmail(user, todayWorkout);
          sentCount++;
        } catch (error) {
          console.error(`Failed to send reminder to ${user.email}:`, error);
        }
      }
    }

    return { message: `Sent ${sentCount} workout reminders` };
  },

  async scheduleNotification(payload) {
    const { userId, email, message, scheduledAt, subject } = payload || {};

    if (!message || !scheduledAt) {
      throw new AppError('Message and scheduledAt are required', 400);
    }

    if (!userId && !email) {
      throw new AppError('Either userId or email is required', 400);
    }

    const scheduleDate = new Date(scheduledAt);
    if (Number.isNaN(scheduleDate.getTime())) {
      throw new AppError('Invalid scheduledAt value', 400);
    }

    const notification = await Notification.create({
      userId,
      email,
      message,
      subject: subject || 'FitCore Notification',
      scheduledAt: scheduleDate,
      status: 'pending',
      channel: 'email'
    });

    return notification;
  },

  async getUserNotifications(userId) {
    const notifications = await Notification.findAll({
      where: {
        userId,
        channel: 'in_app'
      },
      order: [['scheduledAt', 'DESC']],
      limit: 100
    });
    return notifications;
  },

  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    notification.read = true;
    await notification.save();
    return notification;
  },

  async markAllAsRead(userId) {
    const [count] = await Notification.update(
      { read: true },
      { where: { userId, read: false, channel: 'in_app' } }
    );
    return count;
  },

  async processScheduledNotifications() {
    const now = new Date();
    const due = await Notification.findAll({
      where: {
        status: 'pending',
        scheduledAt: { [Op.lte]: now }
      },
      limit: 50,
      order: [['scheduledAt', 'ASC']]
    });

    for (const notification of due) {
      try {
        let to = notification.email;
        if (!to && notification.userId) {
          const user = await User.findByPk(notification.userId);
          to = user?.email;
        }

        if (!to) {
          throw new Error('Recipient email not found');
        }

        await sendEmail({
          to,
          subject: notification.subject || 'FitCore Notification',
          text: notification.message,
          html: `<p>${notification.message}</p>`
        });

        notification.status = 'sent';
        notification.sentAt = new Date();
        notification.error = null;
        await notification.save();
      } catch (error) {
        notification.status = 'failed';
        notification.error = error?.message || 'Unknown error';
        await notification.save();
      }
    }

    return { processed: due.length };
  }
};