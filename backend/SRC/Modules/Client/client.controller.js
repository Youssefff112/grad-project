// src/Modules/Client/client.controller.js
import { clientService } from './client.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

export const clientController = {
  async getProfile(req, res, next) {
    try {
      const profile = await clientService.getProfile(req.user.id);
      successResponse(res, 200, 'Client profile retrieved', { profile });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const profile = await clientService.updateProfile(req.user.id, req.body);
      successResponse(res, 200, 'Client profile updated', { profile });
    } catch (error) {
      next(error);
    }
  },

  async selectCoach(req, res, next) {
    try {
      const profile = await clientService.selectCoach(req.user.id, req.body.coachId);
      successResponse(res, 200, 'Coach selected', { profile });
    } catch (error) {
      next(error);
    }
  },

  async getSubscriptionStatus(req, res, next) {
    try {
      const subscription = await clientService.getSubscriptionStatus(req.user.id);
      successResponse(res, 200, 'Subscription status retrieved', { subscription });
    } catch (error) {
      next(error);
    }
  }
};

