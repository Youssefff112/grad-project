// src/Modules/Exercise/exercise.routes.js
import { Router } from 'express';
import { exerciseController } from './exercise.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', exerciseController.getAllExercises);
router.get('/:id', exerciseController.getExerciseById);

// Admin routes
router.post('/', authenticate, restrictTo('admin'), exerciseController.createExercise);
router.patch('/:id', authenticate, restrictTo('admin'), exerciseController.updateExercise);
router.delete('/:id', authenticate, restrictTo('admin'), exerciseController.deleteExercise);

export default router;
