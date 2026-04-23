// src/Modules/Subscription/subscription.service.js
import { Subscription, Payment } from './subscription.model.js';
import { AppError } from '../../Utils/appError.utils.js';
import { Op } from 'sequelize';

export const subscriptionService = {
  async createSubscription(userId, data) {
    const { role, planName, price, currency, autoRenew, startDate, endDate } = data;
    if (!role || !planName || price === undefined) {
      throw new AppError('role, planName and price are required', 400);
    }

    const subscription = await Subscription.create({
      userId,
      role,
      planName,
      price,
      currency: currency || 'USD',
      autoRenew: !!autoRenew,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: 'pending'
    });

    return subscription;
  },

  async getActiveSubscription(userId, role = null) {
    const where = {
      userId,
      status: 'active',
      ...(role ? { role } : {})
    };

    return Subscription.findOne({
      where,
      order: [['endDate', 'DESC']]
    });
  },

  async listSubscriptions(filters = {}) {
    const where = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.role) where.role = filters.role;
    if (filters.status) where.status = filters.status;

    return Subscription.findAll({
      where,
      order: [['createdAt', 'DESC']]
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

  async recordPayment(userId, subscriptionId, payload) {
    const { amount, currency, provider, status, reference, paidAt, meta } = payload;
    if (amount === undefined) {
      throw new AppError('amount is required', 400);
    }

    const payment = await Payment.create({
      userId,
      subscriptionId,
      amount,
      currency: currency || 'USD',
      provider: provider || 'manual',
      status: status || 'paid',
      reference,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      meta: meta || {}
    });

    if (subscriptionId && (status || 'paid') === 'paid') {
      const subscription = await Subscription.findByPk(subscriptionId);
      if (subscription) {
        subscription.status = 'active';
        subscription.startDate = subscription.startDate || new Date();
        if (!subscription.endDate) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          subscription.endDate = nextMonth;
        }
        await subscription.save();
      }
    }

    return payment;
  },

  async requireActiveSubscription(userId, role) {
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
          endDate: { [Op.lt]: new Date() }
        }
      }
    );
  }
};

