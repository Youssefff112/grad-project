// src/Modules/Vision/vision.controller.js
import { visionService } from './vision.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

export const visionController = {
  async startSession(req, res, next) {
    try {
      const session = await visionService.startSession(req.user.id, req.body);
      successResponse(res, 201, 'Vision session started', { session });
    } catch (error) {
      next(error);
    }
  },

  async updateSession(req, res, next) {
    try {
      const session = await visionService.updateSession(req.user.id, req.params.id, req.body);
      successResponse(res, 200, 'Vision session updated', { session });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await visionService.getHistory(req.user.id, page, limit);
      successResponse(res, 200, 'Vision session history retrieved', result.sessions, result.pagination);
    } catch (error) {
      next(error);
    }
  }
};

