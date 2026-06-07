// src/Modules/Vision/vision.controller.js
import { visionService } from './vision.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';
import { analyzeFrame as analyzeFrameWithAi } from '../../Utils/aiService.js';
import { aiClient } from '../../Utils/aiService.js';

export const visionController = {
  async analyzeFrame(req, res, next) {
    try {
      const { image_base64, exercise_name } = req.body;
      const result = await analyzeFrameWithAi(image_base64, exercise_name || 'squat');
      successResponse(res, 200, 'Frame analyzed', result);
    } catch (error) {
      next(error);
    }
  },

  async checkAiHealth(req, res, next) {
    try {
      const res_ai = await aiClient.get('/');
      successResponse(res, 200, 'AI service reachable', { status: res_ai.status });
    } catch (error) {
      next(error);
    }
  },
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

