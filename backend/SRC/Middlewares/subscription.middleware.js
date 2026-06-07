// src/Middlewares/subscription.middleware.js
import { subscriptionService } from '../Modules/Subscription/subscription.service.js';
import { AppError } from '../Utils/appError.utils.js';
import { AI_CLIENT_PLANS } from '../Utils/planAccess.utils.js';

export const requireActiveSubscription = (role) => {
  return async (req, res, next) => {
    try {
      await subscriptionService.requireActiveSubscription(req.user.id, role);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has an AI-tier client plan (Standard or Elite).
 */
export const requireAIPlan = (role = 'client') => {
  return async (req, res, next) => {
    try {
      await subscriptionService.requireActiveSubscription(req.user.id, role);

      const subscription = await subscriptionService.getActiveSubscription(req.user.id, role);

      if (!AI_CLIENT_PLANS.includes(subscription.planName)) {
        throw new AppError(
          `AI features are only available on Standard and Elite plans. Your current plan (${subscription.planName}) does not have access to this feature.`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};


