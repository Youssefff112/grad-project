import { adminService } from './admin.service.js';
import { successResponse } from '../../Utils/successResponse.utils.js';

export const adminController = {
  // Dashboard
  async getDashboard(req, res, next) {
    try {
      const stats = await adminService.getDashboardStats();
      successResponse(res, 200, 'Dashboard stats retrieved', { stats });
    } catch (error) {
      next(error);
    }
  },

  // User Management
  async getUsers(req, res, next) {
    try {
      const result = await adminService.getAllUsers(req.query);
      successResponse(res, 200, 'Users retrieved', result.users, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const user = await adminService.updateUser(req.params.id, req.body);
      successResponse(res, 200, 'User updated successfully', { user });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const result = await adminService.deleteUser(req.params.id);
      successResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  },

  // Exercise Management
  async createExercise(req, res, next) {
    try {
      const exercise = await adminService.createExercise(req.body, req.user.id);
      successResponse(res, 201, 'Exercise created successfully', { exercise });
    } catch (error) {
      next(error);
    }
  },

  async updateExercise(req, res, next) {
    try {
      const exercise = await adminService.updateExercise(req.params.id, req.body);
      successResponse(res, 200, 'Exercise updated successfully', { exercise });
    } catch (error) {
      next(error);
    }
  },

  async deleteExercise(req, res, next) {
    try {
      const result = await adminService.deleteExercise(req.params.id);
      successResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  },

  // Coach Management
  async createCoach(req, res, next) {
    try {
      const coach = await adminService.createCoach(req.body);
      successResponse(res, 201, 'Coach created successfully', { coach });
    } catch (error) {
      next(error);
    }
  },

  async getCoaches(req, res, next) {
    try {
      const coaches = await adminService.getCoaches(req.query);
      successResponse(res, 200, 'Coaches retrieved', { coaches });
    } catch (error) {
      next(error);
    }
  },

  async deleteCoach(req, res, next) {
    try {
      const result = await adminService.deleteCoach(req.params.id);
      successResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  },

  // Client Management
  async createClient(req, res, next) {
    try {
      const client = await adminService.createClient(req.body);
      successResponse(res, 201, 'Client created successfully', { client });
    } catch (error) {
      next(error);
    }
  },

  async getClients(req, res, next) {
    try {
      const clients = await adminService.getClients(req.query);
      successResponse(res, 200, 'Clients retrieved', { clients });
    } catch (error) {
      next(error);
    }
  },

  async deleteClient(req, res, next) {
    try {
      const result = await adminService.deleteClient(req.params.id);
      successResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  },

  // Coach Approval
  async getCoachApplications(req, res, next) {
    try {
      const applications = await adminService.getCoachApplications(req.query);
      successResponse(res, 200, 'Coach applications retrieved', { applications });
    } catch (error) {
      next(error);
    }
  },

  async approveCoach(req, res, next) {
    try {
      const profile = await adminService.approveCoach(req.params.id, req.user.id);
      successResponse(res, 200, 'Coach approved', { profile });
    } catch (error) {
      next(error);
    }
  },

  async revokeCoachApproval(req, res, next) {
    try {
      const profile = await adminService.revokeCoachApproval(req.params.id, req.user.id);
      successResponse(res, 200, 'Coach approval revoked', { profile });
    } catch (error) {
      next(error);
    }
  }
};