// src/Modules/Subscription/subscription.service.js
import { Subscription, Payment } from './subscription.model.js';
import { AppError } from '../../Utils/appError.utils.js';
import {
  isValidPlanForRole,
  resolvePlanPrice,
} from '../../Utils/subscriptionPlans.utils.js';
import { Op } from 'sequelize';

const canActivateViaDemoPayment = (provider, requestedStatus) => {
  if (requestedStatus !== 'paid') return false;
  if (provider !== 'demo') return false;
  return process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_PAYMENTS !== 'false';
};

export const subscriptionService = {
  async createSubscription(userId, data, authenticatedRole) {
    const { role, planName, currency, autoRenew, startDate, endDate } = data;
    if (!role || !planName) {
      throw new AppError('role and planName are required', 400);
    }

    if (role !== authenticatedRole) {
      throw new AppError('Subscription role must match your account role', 403);
    }

    if (!isValidPlanForRole(role, planName)) {
      throw new AppError(`Invalid plan "${planName}" for role "${role}"`, 400);
    }

    const serverPrice = resolvePlanPrice(planName);
    if (serverPrice == null) {
      throw new AppError('Unknown plan', 400);
    }

    const isFreePlan = serverPrice === 0;

    // Cancel any existing active or pending subscriptions for this user+role
    // so the new plan becomes the sole active subscription.
    await Subscription.update(
      { status: 'cancelled' },
      { where: { userId, role, status: ['active', 'pending'] } },
    );

    const subscription = await Subscription.create({
      userId,
      role,
      planName,
      price: serverPrice,
      currency: currency || 'USD',
      autoRenew: !!autoRenew,
      startDate: startDate ? new Date(startDate) : (isFreePlan ? new Date() : null),
      endDate: endDate ? new Date(endDate) : null,
      status: isFreePlan ? 'active' : 'pending',
    });

    return subscription;
  },

  async getActiveSubscription(userId, role = null) {
    const where = {
      userId,
      status: 'active',
      ...(role ? { role } : {}),
    };

    // Order by createdAt DESC so the most recently created active subscription
    // wins. This avoids the PostgreSQL NULLS FIRST default on endDate DESC
    // that would otherwise surface the auto-created Free plan over a paid one.
    return Subscription.findOne({
      where,
      order: [['createdAt', 'DESC']],
    });
  },

  async listSubscriptions(filters = {}) {
    const where = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.role) where.role = filters.role;
    if (filters.status) where.status = filters.status;

    return Subscription.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  },

  async updateStatus(subscriptionId, status, dates = {}) {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    subscription.status = status;
    if (dates.startDate) subscription.startDate = new Date(dates.startDate);
    if (dates.endDate) subscription.endDate = new Date(dates.endDate);
    await subscription.save();

    return subscription;
  },

  async _activateSubscription(subscription) {
    subscription.status = 'active';
    subscription.startDate = subscription.startDate || new Date();
    if (!subscription.endDate) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      subscription.endDate = nextMonth;
    }
    await subscription.save();
    return subscription;
  },

  async recordPayment(userId, subscriptionId, payload, { isAdmin = false } = {}) {
    const { amount, currency, provider, status, reference, paidAt, meta } = payload;
    const requestedStatus = status || 'pending';

    if (!isAdmin && requestedStatus === 'paid' && !canActivateViaDemoPayment(provider, requestedStatus)) {
      throw new AppError(
        'Payment activation requires admin approval or a verified payment provider',
        403,
      );
    }

    const subscription = subscriptionId ? await Subscription.findByPk(subscriptionId) : null;
    if (subscription && subscription.userId !== userId && !isAdmin) {
      throw new AppError('Subscription does not belong to this user', 403);
    }

    const effectiveStatus = isAdmin
      ? requestedStatus
      : (canActivateViaDemoPayment(provider, requestedStatus) ? 'paid' : 'pending');

    const paymentAmount = amount !== undefined ? amount : (subscription?.price ?? 0);

    const payment = await Payment.create({
      userId: subscription?.userId ?? userId,
      subscriptionId: subscriptionId || null,
      amount: paymentAmount,
      currency: currency || 'USD',
      provider: provider || 'manual',
      status: effectiveStatus,
      reference,
      paidAt: effectiveStatus === 'paid' ? (paidAt ? new Date(paidAt) : new Date()) : null,
      meta: meta || {},
    });

    if (subscription && effectiveStatus === 'paid') {
      await this._activateSubscription(subscription);
    }

    return payment;
  },

  /**
   * Requires an active subscription. Coach profile/onboarding routes intentionally
   * skip this middleware so coaches can subscribe after signing up.
   */
  /**
   * Ensure an approved coach has an active ProCoach subscription.
   * In development/demo mode, auto-grants ProCoach so coaches can manage clients
   * without going through the payment flow first.
   */
  async ensureCoachProSubscription(coachUserId) {
    const existing = await this.getActiveSubscription(coachUserId, 'coach');
    if (existing) return existing;

    const allowDemo =
      process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEMO_PAYMENTS !== 'false';
    if (!allowDemo) return null;

    await Subscription.update(
      { status: 'cancelled' },
      { where: { userId: coachUserId, role: 'coach', status: ['active', 'pending'] } },
    );

    return Subscription.create({
      userId: coachUserId,
      role: 'coach',
      planName: 'ProCoach',
      price: resolvePlanPrice('ProCoach'),
      currency: 'USD',
      autoRenew: true,
      startDate: new Date(),
      endDate: null,
      status: 'active',
    });
  },

  async requireActiveSubscription(userId, role) {
    if (role === 'coach') {
      await this.ensureCoachProSubscription(userId);
      const subscription = await this.getActiveSubscription(userId, 'coach');
      if (!subscription) {
        throw new AppError('Active coach subscription (ProCoach) required', 403);
      }
      if (subscription.endDate && subscription.endDate < new Date()) {
        subscription.status = 'expired';
        await subscription.save();
        throw new AppError('Subscription expired', 403);
      }
      return subscription;
    }

    const subscription = await this.getActiveSubscription(userId, role);
    if (!subscription) {
      throw new AppError('Active subscription required', 403);
    }

    if (subscription.endDate && subscription.endDate < new Date()) {
      subscription.status = 'expired';
      await subscription.save();
      throw new AppError('Subscription expired', 403);
    }

    return subscription;
  },

  async cleanupExpired() {
    await Subscription.update(
      { status: 'expired' },
      {
        where: {
          status: 'active',
          endDate: { [Op.lt]: new Date() },
        },
      },
    );
  },
};
