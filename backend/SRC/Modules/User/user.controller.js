// src/Modules/User/user.controller.js
import { userService } from './user.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

export const userController = {
  async getProfile(req, res, next) {
    try {
      const user = await userService.getProfile(req.user.id);
      successResponse(res, 200, 'Profile retrieved successfully', { user });
    } catch (error) {
      next(error);
    }
  },

  async getCoaches(req, res, next) {
    try {
      const coaches = await userService.getCoaches();
      successResponse(res, 200, 'Coaches retrieved successfully', { coaches });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body);
      successResponse(res, 200, 'Profile updated successfully', { user });
    } catch (error) {
      next(error);
    }
  },

  async completeOnboarding(req, res, next) {
    try {
      const user = await userService.completeOnboarding(req.user.id, req.body);
      successResponse(res, 200, 'Onboarding completed successfully', { user });
    } catch (error) {
      next(error);
    }
  },

  async deleteAccount(req, res, next) {
    try {
      await userService.deleteAccount(req.user.id);
      successResponse(res, 200, 'Account deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};

