import { Router } from 'express';
import { dietController } from './diet.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { requireActiveSubscription, requireAIPlan } from '../../Middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate, restrictTo('client'));

router.post('/generate', requireAIPlan('client'), dietController.generatePlan);
router.get('/active', requireActiveSubscription('client'), dietController.getActivePlan);
router.post('/track', requireActiveSubscription('client'), dietController.logDietDay);
router.get('/history', requireActiveSubscription('client'), dietController.getHistory);

export default router;