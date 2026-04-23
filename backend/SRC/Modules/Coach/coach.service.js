// src/Modules/Coach/coach.service.js
import { Op, fn, col } from 'sequelize';
import { CoachProfile, Coach } from './coach.model.js';
import { ClientProfile } from '../Client/client.model.js';
import { User } from '../User/user.model.js';
import { WorkoutLog } from '../Workout/workout.model.js';
import { WorkoutAccuracy } from '../Progress/progress.model.js';
import { AppError } from '../../Utils/appError.utils.js';

export const coachService = {
  async createCoach(data) {
    return Coach.create(data);
  },

  async getAllCoaches(filters = {}) {
    const { specialty, minRating, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const where = {};
    if (minRating) {
      where.rating = { [Op.gte]: minRating };
    }

    // Filter by specialty if provided
    let query = {
      where,
      order: [['rating', 'DESC']],
      limit,
      offset
    };

    let coaches = await CoachProfile.findAll(query);

    // Filter by specialty (since it's JSONB, we need to do it in JS if not using raw SQL)
    if (specialty) {
      coaches = coaches.filter(coach =>
        coach.specialties && coach.specialties.includes(specialty)
      );
    }

    return coaches;
  },

  async getCoachById(id) {
    const coach = await Coach.findByPk(id);
    if (!coach) {
      throw new AppError('Coach not found', 404);
    }
    return coach;
  },

  async updateCoach(id, updates) {
    await Coach.update(updates, { where: { id } });
    const coach = await Coach.findByPk(id);
    if (!coach) {
      throw new AppError('Coach not found', 404);
    }
    return coach;
  },

  async deleteCoach(id) {
    const coach = await Coach.findByPk(id);
    if (!coach) {
      throw new AppError('Coach not found', 404);
    }
    await coach.destroy();
    return { message: 'Coach deleted successfully' };
  },

  async getProfile(userId) {
    let profile = await CoachProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await CoachProfile.create({ userId });
    }
    return profile;
  },

  async updateProfile(userId, updates) {
    let profile = await CoachProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await CoachProfile.create({ userId, ...updates });
      return profile;
    }

    await CoachProfile.update(updates, { where: { userId } });
    return CoachProfile.findOne({ where: { userId } });
  },

  async getClients(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const { rows, count } = await ClientProfile.findAndCountAll({
      where: { selectedCoachId: userId },
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    const clientIds = rows.map(row => row.userId);
    const users = clientIds.length
      ? await User.findAll({ where: { id: { [Op.in]: clientIds } } })
      : [];

    const userMap = new Map(users.map(user => [user.id, user]));
    const clients = rows.map(row => ({
      profile: row,
      user: userMap.get(row.userId) || null
    }));

    return {
      clients,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  },

  async getAnalytics(userId) {
    const clientProfiles = await ClientProfile.findAll({
      where: { selectedCoachId: userId },
      attributes: ['userId'],
      raw: true
    });

    const clientIds = clientProfiles.map(profile => profile.userId);
    if (clientIds.length === 0) {
      return {
        totalClients: 0,
        completedWorkoutsLast30Days: 0,
        averageAccuracy: 0
      };
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const completedWorkoutsLast30Days = await WorkoutLog.count({
      where: {
        userId: { [Op.in]: clientIds },
        status: 'completed',
        date: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const accuracyAgg = await WorkoutAccuracy.findAll({
      where: { userId: { [Op.in]: clientIds } },
      attributes: [[fn('AVG', col('accuracyScore')), 'avgAccuracy']],
      raw: true
    });

    const averageAccuracy = Number(accuracyAgg?.[0]?.avgAccuracy || 0);

    return {
      totalClients: clientIds.length,
      completedWorkoutsLast30Days,
      averageAccuracy
    };
  },

  async requireApprovedCoach(userId) {
    const profile = await CoachProfile.findOne({ where: { userId } });
    if (!profile || !profile.isApproved) {
      throw new AppError('Coach profile is not approved yet', 403);
    }
    return profile;
  }
};

