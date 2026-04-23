// src/Modules/Progress/progress.routes.js
import { Router } from 'express';
import { progressController } from './progress.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { requireActiveSubscription } from '../../Middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate, restrictTo('client'));

router.post('/measurements', requireActiveSubscription('client'), progressController.addMeasurement);
router.get('/measurements', requireActiveSubscription('client'), progressController.getMeasurements);
router.post('/accuracy', requireActiveSubscription('client'), progressController.addWorkoutAccuracy);
router.get('/accuracy', requireActiveSubscription('client'), progressController.getWorkoutAccuracy);

export default router;

