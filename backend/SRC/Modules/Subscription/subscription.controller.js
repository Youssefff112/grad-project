// src/Modules/Subscription/subscription.controller.js
import { subscriptionService } from './subscription.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

export const subscriptionController = {
  async createSubscription(req, res, next) {
    try {
      const subscription = await subscriptionService.createSubscription(req.user.id, req.body);
      successResponse(res, 201, 'Subscription created', { subscription });
    } catch (error) {
      next(error);
    }
  },

  async getActiveSubscription(req, res, next) {
    try {
      const { role } = req.query;
      const subscription = await subscriptionService.getActiveSubscription(req.user.id, role || null);
      successResponse(res, 200, 'Active subscription retrieved', { subscription });
    } catch (error) {
      next(error);
    }
  },

  async recordPayment(req, res, next) {
    try {
      const payment = await subscriptionService.recordPayment(
        req.user.id,
        req.params.id,
        req.body
      );
      successResponse(res, 201, 'Payment recorded', { payment });
    } catch (error) {
      next(error);
    }
  },

  async listSubscriptions(req, res, next) {
    try {
      const subscriptions = await subscriptionService.listSubscriptions(req.query);
      successResponse(res, 200, 'Subscriptions retrieved', { subscriptions });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status, startDate, endDate } = req.body;
      const subscription = await subscriptionService.updateStatus(req.params.id, status, { startDate, endDate });
      successResponse(res, 200, 'Subscription status updated', { subscription });
    } catch (error) {
      next(error);
    }
  }
};

