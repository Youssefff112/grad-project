import { Router } from 'express';
import { dietController } from './diet.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { requireActiveSubscription, requireAIPlan } from '../../Middlewares/subscription.middleware.js';
import { validate } from '../../Middlewares/validation.middleware.js';
import {
  generateDietSchema,
  trackDietSchema,
  dietLogQuerySchema,
} from './diet.validation.js';

const router = Router();

router.use(authenticate, restrictTo('client'));

router.post('/generate', requireAIPlan('client'), validate(generateDietSchema), dietController.generatePlan);
router.get('/active', requireActiveSubscription('client'), dietController.getActivePlan);
router.delete('/active', requireActiveSubscription('client'), dietController.deletePlan);
router.post('/track', requireActiveSubscription('client'), validate(trackDietSchema), dietController.logDietDay);
router.get('/log', requireActiveSubscription('client'), validate(dietLogQuerySchema), dietController.getLogForDate);
router.get('/history', requireActiveSubscription('client'), validate(dietLogQuerySchema), dietController.getHistory);

export default router;
