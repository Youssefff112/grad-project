// src/Modules/Progress/progress.routes.js
import { Router } from 'express';
import { progressController } from './progress.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { requireActiveSubscription } from '../../Middlewares/subscription.middleware.js';
import { validate } from '../../Middlewares/validation.middleware.js';
import {
  addMeasurementSchema,
  paginationSchema,
  addAccuracySchema,
} from './progress.validation.js';

const router = Router();

router.use(authenticate, restrictTo('client'));

router.post('/measurements', requireActiveSubscription('client'), validate(addMeasurementSchema), progressController.addMeasurement);
router.get('/measurements', requireActiveSubscription('client'), validate(paginationSchema), progressController.getMeasurements);
router.post('/accuracy', requireActiveSubscription('client'), validate(addAccuracySchema), progressController.addWorkoutAccuracy);
router.get('/accuracy', requireActiveSubscription('client'), validate(paginationSchema), progressController.getWorkoutAccuracy);

export default router;
