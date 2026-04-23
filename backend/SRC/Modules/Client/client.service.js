// src/Modules/Client/client.service.js
import { ClientProfile } from './client.model.js';
import { User } from '../User/user.model.js';
import { CoachProfile } from '../Coach/coach.model.js';
import { subscriptionService } from '../Subscription/subscription.service.js';
import { AppError } from '../../Utils/appError.utils.js';

export const clientService = {
  async getProfile(userId) {
    let profile = await ClientProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await ClientProfile.create({ userId });
    }
    return profile;
  },

  async updateProfile(userId, updates) {
    let profile = await ClientProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await ClientProfile.create({ userId, ...updates });
      return profile;
    }

    await ClientProfile.update(updates, { where: { userId } });
    return ClientProfile.findOne({ where: { userId } });
  },

  async selectCoach(userId, coachId) {
    if (!coachId) {
      throw new AppError('coachId is required', 400);
    }

    const coach = await User.findByPk(coachId);
    if (!coach || coach.role !== 'coach') {
      throw new AppError('Coach not found', 404);
    }

    const coachProfile = await CoachProfile.findOne({ where: { userId: coachId } });
    if (!coachProfile || !coachProfile.isApproved) {
      throw new AppError('Coach is not approved yet', 403);
    }

    await subscriptionService.requireActiveSubscription(userId, 'client');

    let profile = await ClientProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await ClientProfile.create({ userId, selectedCoachId: coachId });
      return profile;
    }

    profile.selectedCoachId = coachId;
    await profile.save();
    return profile;
  },

  async getSubscriptionStatus(userId) {
    const subscription = await subscriptionService.getActiveSubscription(userId, 'client');
    return subscription;
  }
};

