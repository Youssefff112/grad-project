import { Router } from 'express';
import { workoutController } from './workout.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { requireActiveSubscription, requireAIPlan } from '../../Middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate, restrictTo('client'));

router.post('/generate', requireAIPlan('client'), workoutController.generatePlan);
router.get('/active', requireActiveSubscription('client'), workoutController.getActivePlan);
router.post('/start', requireActiveSubscription('client'), workoutController.startSession);
router.post('/finish/:id', requireActiveSubscription('client'), workoutController.finishSession);
router.post('/log', requireActiveSubscription('client'), workoutController.logWorkout);
router.get('/history', requireActiveSubscription('client'), workoutController.getHistory);

export default router;