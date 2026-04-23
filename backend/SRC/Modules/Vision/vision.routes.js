// src/Modules/Vision/vision.routes.js
import { Router } from 'express';
import { visionController } from './vision.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { requireActiveSubscription } from '../../Middlewares/subscription.middleware.js';

const router = Router();

router.use(authenticate, restrictTo('client'));

router.post('/sessions', requireActiveSubscription('client'), visionController.startSession);
router.patch('/sessions/:id', requireActiveSubscription('client'), visionController.updateSession);
router.get('/sessions', requireActiveSubscription('client'), visionController.getHistory);

export default router;

