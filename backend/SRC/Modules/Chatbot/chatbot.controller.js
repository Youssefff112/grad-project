// src/Modules/Chatbot/chatbot.controller.js
import { chatbotService } from './chatbot.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

export const chatbotController = {
  async sendMessage(req, res, next) {
    try {
      const result = await chatbotService.sendMessage(req.user.id, req.body);
      successResponse(res, 201, 'Message sent', result);
    } catch (error) {
      next(error);
    }
  },

  async getMessages(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const result = await chatbotService.getMessages(
        req.user.id,
        req.params.sessionId,
        page,
        limit
      );
      successResponse(res, 200, 'Messages retrieved', result.messages, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async getConfig(req, res, next) {
    try {
      const config = await chatbotService.getConfig(req.user.id);
      successResponse(res, 200, 'Chatbot config retrieved', { config });
    } catch (error) {
      next(error);
    }
  },

  async updateConfig(req, res, next) {
    try {
      const config = await chatbotService.updateConfig(req.user.id, req.body);
      successResponse(res, 200, 'Chatbot config updated', { config });
    } catch (error) {
      next(error);
    }
  }
};

