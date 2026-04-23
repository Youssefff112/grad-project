import { dietService } from './diet.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

export const dietController = {
  async generatePlan(req, res, next) {
    try {
      const plan = await dietService.generateDietPlan(req.user.id);
      successResponse(res, 201, 'Diet plan generated successfully', { plan });
    } catch (error) {
      next(error);
    }
  },

  async getActivePlan(req, res, next) {
    try {
      const plan = await dietService.getActiveDietPlan(req.user.id);
      successResponse(res, 200, 'Active diet plan retrieved', { plan });
    } catch (error) {
      next(error);
    }
  },

  async logDietDay(req, res, next) {
    try {
      const log = await dietService.logDietDay(req.user.id, req.body);
      successResponse(res, 201, 'Diet tracking updated', { log });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await dietService.getDietHistory(
        req.user.id,
        parseInt(page) || 1,
        parseInt(limit) || 10
      );
      successResponse(res, 200, 'Diet history retrieved', result.logs, result.pagination);
    } catch (error) {
      next(error);
    }
  }
};