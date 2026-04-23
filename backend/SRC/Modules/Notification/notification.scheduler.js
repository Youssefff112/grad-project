// src/Modules/Notification/notification.scheduler.js
import { notificationService } from './notification.service.js';
import { subscriptionService } from '../Subscription/subscription.service.js';

let intervalId = null;
let isRunning = false;

const tick = async () => {
  if (isRunning) return;
  isRunning = true;
  try {
    await notificationService.processScheduledNotifications();
    await subscriptionService.cleanupExpired();
  } catch (error) {
    console.error('❌ Notification scheduler error:', error);
  } finally {
    isRunning = false;
  }
};

export const startNotificationScheduler = (intervalMs = 60_000) => {
  if (intervalId) return;
  intervalId = setInterval(tick, intervalMs);
  tick();
};

export const stopNotificationScheduler = () => {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
};
