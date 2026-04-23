// src/Modules/Progress/progress.controller.js
import { progressService } from './progress.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

export const progressController = {
  async addMeasurement(req, res, next) {
    try {
      const measurement = await progressService.addMeasurement(req.user.id, req.body);
      successResponse(res, 201, 'Measurement added', { measurement });
    } catch (error) {
      next(error);
    }
  },

  async getMeasurements(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await progressService.getMeasurements(req.user.id, page, limit);
      successResponse(res, 200, 'Measurements retrieved', result.measurements, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async addWorkoutAccuracy(req, res, next) {
    try {
      const accuracyLog = await progressService.addWorkoutAccuracy(req.user.id, req.body);
      successResponse(res, 201, 'Workout accuracy logged', { accuracyLog });
    } catch (error) {
      next(error);
    }
  },

  async getWorkoutAccuracy(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await progressService.getWorkoutAccuracy(req.user.id, page, limit);
      successResponse(res, 200, 'Workout accuracy history retrieved', result.accuracyLogs, result.pagination);
    } catch (error) {
      next(error);
    }
  }
};

