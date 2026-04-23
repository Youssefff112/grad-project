// src/Modules/Exercise/exercise.service.js
import { Exercise } from './exercise.model.js';
import { AppError } from '../../Utils/appError.utils.js';
import { Op } from 'sequelize';

const normalizeArrayFilter = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return null;
};

export const exerciseService = {
  async createExercise(payload, userId) {
    const exercise = await Exercise.create({
      ...payload,
      createdBy: userId
    });

    return exercise;
  },

  async getExerciseById(exerciseId) {
    const exercise = await Exercise.findByPk(exerciseId);
    if (!exercise || !exercise.isActive) {
      throw new AppError('Exercise not found', 404);
    }

    return exercise;
  },

  async getAllExercises(filters = {}) {
    const where = { isActive: true };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const muscleGroups = normalizeArrayFilter(filters.muscleGroups);
    if (muscleGroups?.length) {
      where.muscleGroups = { [Op.overlap]: muscleGroups };
    }

    const equipment = normalizeArrayFilter(filters.equipment);
    if (equipment?.length) {
      where.equipment = { [Op.overlap]: equipment };
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    const { rows, count } = await Exercise.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });

    return {
      exercises: rows,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
    };
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
  }
};
