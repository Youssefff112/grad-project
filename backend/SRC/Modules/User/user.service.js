// src/Modules/User/user.service.js
import { User } from './user.model.js';
import { AppError } from '../../Utils/appError.utils.js';

export const userService = {
  async getProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  },

  async getCoaches() {
    const coaches = await User.findAll({
      where: { role: 'coach', isActive: true },
      attributes: ['id', 'firstName', 'lastName', 'email', 'profile']
    });
    return coaches;
  },

  async updateProfile(userId, updates) {
    await User.update(updates, { where: { id: userId } });
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  },

  async completeOnboarding(userId, data) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Validate home equipment for offline users
    if (user.userType === 'offline' && (!data.profile.homeEquipment || data.profile.homeEquipment.length === 0)) {
      throw new AppError('Home equipment is required for offline users', 400);
    }

    // Update profile
    user.profile = {
      ...user.profile,
      ...data.profile
    };

    await user.save();
    const updatedUser = await User.findByPk(userId);
    return updatedUser;
  },

  async deleteAccount(userId) {
    await User.update({ isActive: false }, { where: { id: userId } });
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
};

