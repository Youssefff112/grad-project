import { WorkoutPlan } from '../Workout/workout.model.js';
import { User } from '../User/user.model.js';
import { Notification } from './notification.model.js';
import { sendEmail, sendWorkoutReminderEmail } from '../../Utils/Emails/sendEmail.utils.js';
import { sendExpoPushBatch } from '../../Utils/expoPush.utils.js';
import { AppError } from '../../Utils/appError.utils.js';
import { Op } from 'sequelize';

export const notificationService = {
  // Send workout reminders (FR-3.4)
  async sendWorkoutReminders() {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
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
  },

  /**
   * Store Expo push token on user.profile (deduped, last 6 devices).
   */
  async registerExpoPushToken(userId, expoPushToken) {
    const t = String(expoPushToken || '').trim();
    if (!/^Expo(nent)?PushToken\[/i.test(t)) {
      throw new AppError('Invalid Expo push token', 400);
    }
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    const profile = { ...(user.profile || {}) };
    const existing = Array.isArray(profile.expoPushTokens) ? profile.expoPushTokens : [];
    const next = [...new Set([...existing, t])].slice(-6);
    profile.expoPushTokens = next;
    user.profile = profile;
    await user.save();
    return { tokens: next.length };
  },

  _pushAllowed(settings, prefsKey) {
    if (!prefsKey) return true;
    return settings[prefsKey] !== false;
  },

  async sendExpoPushIfEnabled(userId, prefsKey, title, body, data = {}) {
    const user = await User.findByPk(userId, { attributes: ['profile'] });
    if (!user?.profile) return;
    const settings = user.profile.notificationSettings || {};
    if (!this._pushAllowed(settings, prefsKey)) return;
    const tokens = user.profile.expoPushTokens;
    if (!Array.isArray(tokens) || !tokens.length) return;
    const msgs = tokens.map((to) => ({ to, title, body, data }));
    await sendExpoPushBatch(msgs);
  },

  async onDietDayLogged(userId, { status, prevStatus, waterMl, prevWaterMl, hydrationGoalMl }) {
    try {
      if (status === 'followed' && prevStatus !== 'followed') {
        await this.sendExpoPushIfEnabled(
          userId,
          'mealReminders',
          'All meals logged',
          "You completed today's meal plan. Great work!",
          { type: 'meal_plan_complete' }
        );
      }
      const goal = Math.max(500, Math.min(parseInt(hydrationGoalMl, 10) || 2000, 8000));
      const prev = prevWaterMl != null ? Number(prevWaterMl) : 0;
      const now = waterMl != null ? Number(waterMl) : 0;
      if (now >= goal && prev < goal) {
        await this.sendExpoPushIfEnabled(
          userId,
          'hydrationReminders',
          'Hydration goal reached',
          `You hit about ${(goal / 1000).toFixed(1)} L today. Nice!`,
          { type: 'water_goal' }
        );
      }
    } catch (e) {
      console.warn('[onDietDayLogged push]', e?.message || e);
    }
  },

  async onWorkoutLogged(userId, { day, duration } = {}) {
    try {
      const dayLabel = day ? String(day) : 'your session';
      const mins = duration != null ? `${duration} min` : '';
      const body = mins
        ? `Logged ${mins} for ${dayLabel}.`
        : `Workout saved for ${dayLabel}.`;
      await this.sendExpoPushIfEnabled(userId, 'workoutReminders', 'Workout logged', body, {
        type: 'workout_logged',
      });
    } catch (e) {
      console.warn('[onWorkoutLogged push]', e?.message || e);
    }
  },

  /**
   * Notify the client's assigned coach (Elite / CoachAssisted plans) that
   * the client has completed a workout session.
   *
   * @param {number} coachUserId  - User ID of the coach to notify
   * @param {{ clientDisplayName: string, exerciseName: string, reps: number,
   *           durationMinutes: number, formScore: number, clientUserId: number }} details
   */
  async notifyCoachClientWorkoutDone(coachUserId, { clientDisplayName, exerciseName, reps, durationMinutes, formScore, clientUserId } = {}) {
    const cid = coachUserId != null ? Number(coachUserId) : NaN;
    if (!Number.isFinite(cid) || cid <= 0) return;
    try {
      const name   = (clientDisplayName || '').trim() || 'A client';
      const exName = (exerciseName     || '').trim() || 'a workout';
      const repStr = reps > 0 ? ` · ${reps} reps` : '';
      const durStr = durationMinutes > 0 ? ` · ${durationMinutes} min` : '';
      const formStr = formScore > 0 ? ` · Form ${formScore}%` : '';
      const message = `${name} completed ${exName}${repStr}${durStr}${formStr}.`;

      await Notification.create({
        userId: cid,
        channel: 'in_app',
        title: 'Client workout completed',
        message,
        type: 'workout',
        icon: 'fitness_center',
        read: false,
        status: 'sent',
      });

      await this.sendExpoPushIfEnabled(
        cid,
        undefined,
        'Client workout completed',
        message,
        { type: 'client_workout_done', clientUserId: String(clientUserId ?? ''), exerciseName: String(exName) },
      );
    } catch (e) {
      console.warn('[notifyCoachClientWorkoutDone]', e?.message || e);
    }
  },

  /** Client generated an AI meal plan that needs coach approval (in-app + optional push). */
  async notifyCoachPendingClientDietPlan(coachUserId, { clientUserId, clientDisplayName, planId }) {
    const cid = coachUserId != null ? Number(coachUserId) : NaN;
    if (!Number.isFinite(cid) || cid <= 0) return;
    try {
      const name = (clientDisplayName || '').trim() || 'A client';
      await Notification.create({
        userId: cid,
        channel: 'in_app',
        title: 'Meal plan pending review',
        message: `${name} generated an AI meal plan and is waiting for your approval.`,
        type: 'meal',
        icon: 'restaurant',
        read: false,
        status: 'sent',
      });
      await this.sendExpoPushIfEnabled(
        cid,
        undefined,
        'Meal plan pending review',
        `${name} submitted a meal plan. Open the client → Plans tab to approve.`,
        { type: 'pending_diet_plan', planId: String(planId ?? ''), clientUserId: String(clientUserId ?? '') },
      );
    } catch (e) {
      console.warn('[notifyCoachPendingClientDietPlan]', e?.message || e);
    }
  },
};