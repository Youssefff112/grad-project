import { workoutService } from './workout.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

export const workoutController = {
  async generatePlan(req, res, next) {
    try {
      const { location, equipment } = req.body || {};
      const plan = await workoutService.generateWorkoutPlan(req.user.id, location, equipment);
      successResponse(res, 201, 'Workout plan generated successfully', { plan });
    } catch (error) {
      next(error);
    }
  },

  async getActivePlan(req, res, next) {
    try {
      const plan = await workoutService.getActiveWorkoutPlan(req.user.id);
      successResponse(res, 200, 'Active workout plan retrieved', { plan });
    } catch (error) {
      next(error);
    }
  },

  async logWorkout(req, res, next) {
    try {
      const log = await workoutService.logWorkout(req.user.id, req.body);
      successResponse(res, 201, 'Workout logged successfully', { log });
    } catch (error) {
      next(error);
    }
  },

  async startSession(req, res, next) {
    try {
      const session = await workoutService.startWorkoutSession(req.user.id, req.body);
      successResponse(res, 201, 'Workout session started', { session });
    } catch (error) {
      next(error);
    }
  },

  async finishSession(req, res, next) {
    try {
      const session = await workoutService.finishWorkoutSession(req.user.id, req.params.id, req.body);
      successResponse(res, 200, 'Workout session finished', { session });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await workoutService.getWorkoutHistory(
        req.user.id,
        parseInt(page) || 1,
        parseInt(limit) || 10
      );
      successResponse(res, 200, 'Workout history retrieved', result.logs, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async deletePlan(req, res, next) {
    try {
      const result = await workoutService.deleteActiveWorkoutPlan(req.user.id);
      successResponse(res, 200, 'Workout plan deleted', result);
    } catch (error) {
      next(error);
    }
  },

  async getCompletedDays(req, res, next) {
    try {
      const completedDays = await workoutService.getCompletedDaysThisWeek(req.user.id);
      successResponse(res, 200, 'Completed days retrieved', { completedDays });
    } catch (error) {
      next(error);
    }
  },

  async getCompletedExercises(req, res, next) {
    try {
      const completedExercises = await workoutService.getCompletedExercisesThisWeek(req.user.id);
      successResponse(res, 200, 'Completed exercises retrieved', { completedExercises });
    } catch (error) {
      next(error);
    }
  }
};