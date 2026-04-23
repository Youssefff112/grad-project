import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, restrictTo('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Exercise Management
router.post('/exercises', adminController.createExercise);
router.patch('/exercises/:id', adminController.updateExercise);
router.delete('/exercises/:id', adminController.deleteExercise);

// Coach Management
router.post('/coaches', adminController.createCoach);
router.get('/coaches', adminController.getCoaches);
router.delete('/coaches/:id', adminController.deleteCoach);

// Client Management
router.post('/clients', adminController.createClient);
router.get('/clients', adminController.getClients);
router.delete('/clients/:id', adminController.deleteClient);

// Coach Approval
router.get('/coach-applications', adminController.getCoachApplications);
router.patch('/coaches/:id/approve', adminController.approveCoach);
router.patch('/coaches/:id/revoke', adminController.revokeCoachApproval);

export default router;