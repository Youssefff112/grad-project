import { User } from '../User/user.model.js';
import { Exercise } from '../Exercise/exercise.model.js';
import { CoachProfile } from '../Coach/coach.model.js';
import { ClientProfile } from '../Client/client.model.js';
import { AppError } from '../../Utils/appError.utils.js';
import { Op, fn, col } from 'sequelize';

export const adminService = {
  // Dashboard Statistics (FR-4.1)
  async getDashboardStats() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalUsers, totalExercises, newUsers, usersByType] = await Promise.all([
      User.count({ where: { isActive: true } }),
      Exercise.count({ where: { isActive: true } }),
      User.count({ where: { createdAt: { [Op.gte]: oneWeekAgo } } }),
      User.findAll({
        where: { isActive: true },
        attributes: ['userType', [fn('COUNT', col('id')), 'count']],
        group: ['userType'],
        raw: true
      })
    ]);

    return {
      totalUsers,
      totalExercises,
      newUsersThisWeek: newUsers,
      usersByType: usersByType.map(item => ({ _id: item.userType, count: Number(item.count) }))
    };
  },

  // User Management (FR-4.2)
  async getAllUsers(filters) {
    const query = {};
    
    if (filters.userType) query.userType = filters.userType;
    if (filters.isActive !== undefined) query.isActive = filters.isActive === 'true';
    if (filters.search) {
      query[Op.or] = [
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.findAll({
      where: query,
      offset: skip,
      limit,
      order: [['createdAt', 'DESC']]
    });

    const total = await User.count({ where: query });

    return {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  },

  async updateUser(userId, updates) {
    await User.update(updates, { where: { id: userId } });
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  },

  async deleteUser(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = false;
    await user.save();

    return { message: 'User deactivated successfully' };
  },

  // Exercise Management (FR-4.4)
  async createExercise(exerciseData, adminId) {
    const exercise = await Exercise.create({
      ...exerciseData,
      createdBy: adminId
    });
    return exercise;
  },

  async updateExercise(exerciseId, updates) {
    await Exercise.update(updates, { where: { id: exerciseId } });
    const exercise = await Exercise.findByPk(exerciseId);

    if (!exercise) {
      throw new AppError('Exercise not found', 404);
    }

    return exercise;
  },

  async deleteExercise(exerciseId) {
    const exercise = await Exercise.findByPk(exerciseId);
    if (!exercise) {
      throw new AppError('Exercise not found', 404);
    }

    exercise.isActive = false;
    await exercise.save();

    return { message: 'Exercise deleted successfully' };
  },
  async createCoach(data) {
    const { firstName, lastName, email, password, userType } = data;
    if (!firstName || !lastName || !email || !password || !userType) {
      throw new AppError('firstName, lastName, email, password, userType are required', 400);
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      userType,
      role: 'coach'
    });

    await CoachProfile.findOrCreate({ where: { userId: user.id }, defaults: { userId: user.id } });

    return user;
  },

  async createClient(data) {
    const { firstName, lastName, email, password, userType, age, goals } = data;
    if (!firstName || !lastName || !email || !password || !userType) {
      throw new AppError('firstName, lastName, email, password, userType are required', 400);
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    const profile = age !== undefined ? { age } : {};

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      userType,
      role: 'client',
      profile
    });

    await ClientProfile.findOrCreate({
      where: { userId: user.id },
      defaults: { userId: user.id, goals: goals || {} }
    });

    return user;
  },

  async getCoaches(filters) {
    const where = { role: 'coach' };
    if (filters.isActive !== undefined) where.isActive = filters.isActive === 'true';

    const users = await User.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    const coachProfiles = await CoachProfile.findAll({
      where: { userId: { [Op.in]: users.map(user => user.id) } },
      order: [['createdAt', 'DESC']]
    });

    const profileMap = new Map(coachProfiles.map(profile => [profile.userId, profile]));
    return users.map(user => ({
      user,
      profile: profileMap.get(user.id) || null
    }));
  },

  async getClients(filters) {
    const where = { role: 'client' };
    if (filters.isActive !== undefined) where.isActive = filters.isActive === 'true';

    const users = await User.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    const clientProfiles = await ClientProfile.findAll({
      where: { userId: { [Op.in]: users.map(user => user.id) } },
      order: [['createdAt', 'DESC']]
    });

    const profileMap = new Map(clientProfiles.map(profile => [profile.userId, profile]));
    return users.map(user => ({
      user,
      profile: profileMap.get(user.id) || null
    }));
  },

  async deleteCoach(userId) {
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'coach') {
      throw new AppError('Coach not found', 404);
    }

    user.isActive = false;
    await user.save();
    return { message: 'Coach deactivated successfully' };
  },

  async deleteClient(userId) {
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'client') {
      throw new AppError('Client not found', 404);
    }

    user.isActive = false;
    await user.save();
    return { message: 'Client deactivated successfully' };
  },

  async getCoachApplications(filters) {
    const where = {};
    if (filters.isApproved !== undefined) {
      where.isApproved = filters.isApproved === 'true';
    }

    return CoachProfile.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
  },

  async approveCoach(userId, adminId) {
    const user = await User.findByPk(userId);
    if (!user || user.role !== 'coach') {
      throw new AppError('Coach not found', 404);
    }

    let profile = await CoachProfile.findOne({ where: { userId } });
    if (!profile) {
      profile = await CoachProfile.create({ userId });
    }

    profile.isApproved = true;
    profile.approvedBy = adminId;
    profile.approvedAt = new Date();
    await profile.save();

    return profile;
  },

  async revokeCoachApproval(userId, adminId) {
    const profile = await CoachProfile.findOne({ where: { userId } });
    if (!profile) {
      throw new AppError('Coach profile not found', 404);
    }

    profile.isApproved = false;
    profile.approvedBy = adminId;
    profile.approvedAt = new Date();
    await profile.save();

    return profile;
  }
};