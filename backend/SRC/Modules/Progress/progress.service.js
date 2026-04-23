// src/Modules/Progress/progress.service.js
import { BodyMeasurement, WorkoutAccuracy } from './progress.model.js';

export const progressService = {
  async addMeasurement(userId, data) {
    return BodyMeasurement.create({
      userId,
      date: data.date ? new Date(data.date) : new Date(),
      weight: data.weight,
      bodyFat: data.bodyFat,
      chest: data.chest,
      waist: data.waist,
      hips: data.hips,
      arms: data.arms,
      thighs: data.thighs,
      notes: data.notes
    });
  },

  async getMeasurements(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const { rows, count } = await BodyMeasurement.findAndCountAll({
      where: { userId },
      order: [['date', 'DESC']],
      offset,
      limit
    });

    return {
      measurements: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  },

  async addWorkoutAccuracy(userId, data) {
    return WorkoutAccuracy.create({
      userId,
      workoutLogId: data.workoutLogId || null,
      date: data.date ? new Date(data.date) : new Date(),
      accuracyScore: data.accuracyScore || 0,
      repsCount: data.repsCount || 0,
      source: data.source || 'vision',
      feedback: data.feedback || {}
    });
  },

  async getWorkoutAccuracy(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const { rows, count } = await WorkoutAccuracy.findAndCountAll({
      where: { userId },
      order: [['date', 'DESC']],
      offset,
      limit
    });

    return {
      accuracyLogs: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }
};

