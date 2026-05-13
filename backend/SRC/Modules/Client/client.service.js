// src/Modules/Client/client.service.js
import { ClientProfile } from './client.model.js';
import { User } from '../User/user.model.js';
import { CoachProfile } from '../Coach/coach.model.js';
import { subscriptionService } from '../Subscription/subscription.service.js';
import { AppError } from '../../Utils/appError.utils.js';

export const clientService = {
  async getProfile(userId) {
    let profile = await ClientProfile.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'SelectedCoach',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });
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
    return ClientProfile.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'SelectedCoach',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });
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

    const subscription = await subscriptionService.requireActiveSubscription(userId, 'client');
    const coachPlans = ['Premium', 'Elite'];
    if (!coachPlans.includes(subscription.planName)) {
      throw new AppError(
        'Your subscription does not include a personal coach. Upgrade to the Coach Plan (Premium) or Elite.',
        403
      );
    }

    let profile = await ClientProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await ClientProfile.create({ userId, selectedCoachId: coachId });
      return profile;
    }

    profile.selectedCoachId = coachId;
    await profile.save();
    return ClientProfile.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'SelectedCoach',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });
  },

  async removeCoach(userId) {
    let profile = await ClientProfile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Client profile not found', 404);
    }
    profile.selectedCoachId = null;
    await profile.save();
    return ClientProfile.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: 'SelectedCoach',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });
  },

  async getSubscriptionStatus(userId) {
    const subscription = await subscriptionService.getActiveSubscription(userId, 'client');
    return subscription;
  }
};

