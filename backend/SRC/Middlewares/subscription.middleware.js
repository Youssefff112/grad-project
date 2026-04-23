// src/Middlewares/subscription.middleware.js
import { subscriptionService } from '../Modules/Subscription/subscription.service.js';
import { AppError } from '../Utils/appError.utils.js';

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
 * Middleware to check if user has an AI plan (Premium or Elite only)
 * Blocks ProCoach from accessing AI features
 */
export const requireAIPlan = (role = 'client') => {
  return async (req, res, next) => {
    try {
      // First check if subscription is active
      await subscriptionService.requireActiveSubscription(req.user.id, role);

      // Then check if plan is Premium or Elite
      const subscription = await subscriptionService.getActiveSubscription(req.user.id);
      const aiPlans = ['Premium', 'Elite'];

      if (!aiPlans.includes(subscription.planName)) {
        throw new AppError(
          `AI features are only available on Premium and Elite plans. Your current plan (${subscription.planName}) does not have access to this feature.`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};


