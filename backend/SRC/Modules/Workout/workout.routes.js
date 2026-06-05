import { Router } from 'express';
import { workoutController } from './workout.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { requireActiveSubscription, requireAIPlan } from '../../Middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate, restrictTo('client'));

router.post('/generate', requireAIPlan('client'), workoutController.generatePlan);
router.get('/active', requireActiveSubscription('client'), workoutController.getActivePlan);
router.delete('/active', requireActiveSubscription('client'), workoutController.deletePlan);
router.post('/start', requireActiveSubscription('client'), workoutController.startSession);
router.post('/finish/:id', requireActiveSubscription('client'), workoutController.finishSession);
router.post('/log', workoutController.logWorkout); // no subscription gate — every client can log sessions
router.get('/history', workoutController.getHistory); // no subscription gate — every client can view their history
router.get('/completed-days', workoutController.getCompletedDays); // returns completed weekday names for the current week
router.get('/completed-exercises', workoutController.getCompletedExercises); // returns completed exercise names (lowercase) for the current week

export default router;