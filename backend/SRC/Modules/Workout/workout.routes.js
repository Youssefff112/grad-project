import { Router } from 'express';
import { workoutController } from './workout.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { requireActiveSubscription, requireAIPlan } from '../../Middlewares/subscription.middleware.js';
import { validate } from '../../Middlewares/validation.middleware.js';
import {
  generateWorkoutSchema,
  logWorkoutSchema,
  startSessionSchema,
  finishSessionSchema,
  paginationSchema,
} from './workout.validation.js';

const router = Router();

router.use(authenticate, restrictTo('client'));

router.post('/generate', requireAIPlan('client'), validate(generateWorkoutSchema), workoutController.generatePlan);
router.get('/active', requireActiveSubscription('client'), workoutController.getActivePlan);
router.delete('/active', requireActiveSubscription('client'), workoutController.deletePlan);
router.post('/start', requireActiveSubscription('client'), validate(startSessionSchema), workoutController.startSession);
router.post('/finish/:id', requireActiveSubscription('client'), validate(finishSessionSchema), workoutController.finishSession);
router.post('/log', validate(logWorkoutSchema), workoutController.logWorkout);
router.get('/history', validate(paginationSchema), workoutController.getHistory);
router.get('/completed-days', workoutController.getCompletedDays);
router.get('/completed-exercises', workoutController.getCompletedExercises);

export default router;
