// src/Modules/Exercise/exercise.controller.js
import { exerciseService } from './exercise.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

export const exerciseController = {
  async createExercise(req, res, next) {
    try {
      const exercise = await exerciseService.createExercise(req.body, req.user.id);
      successResponse(res, 201, 'Exercise created successfully', { exercise });
    } catch (error) {
      next(error);
    }
  },

  async getExerciseById(req, res, next) {
    try {
      const exercise = await exerciseService.getExerciseById(req.params.id);
      successResponse(res, 200, 'Exercise retrieved successfully', { exercise });
    } catch (error) {
      next(error);
    }
  },

  async getAllExercises(req, res, next) {
    try {
      const result = await exerciseService.getAllExercises(req.query);
      successResponse(res, 200, 'Exercises retrieved successfully', result.exercises, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async updateExercise(req, res, next) {
    try {
      const exercise = await exerciseService.updateExercise(req.params.id, req.body);
      successResponse(res, 200, 'Exercise updated successfully', { exercise });
    } catch (error) {
      next(error);
    }
  },

  async deleteExercise(req, res, next) {
    try {
      const result = await exerciseService.deleteExercise(req.params.id);
      successResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }
};
