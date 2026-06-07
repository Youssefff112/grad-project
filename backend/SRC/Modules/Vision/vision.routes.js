// src/Modules/Vision/vision.routes.js
import { Router } from 'express';
import { visionController } from './vision.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { requireActiveSubscription, requireAIPlan } from '../../Middlewares/subscription.middleware.js';
import { validate } from '../../Middlewares/validation.middleware.js';
import {
  analyzeFrameSchema,
  startVisionSessionSchema,
  updateVisionSessionSchema,
  visionHistorySchema,
} from './vision.validation.js';

const router = Router();

router.use(authenticate, restrictTo('client'));

router.get('/health', requireActiveSubscription('client'), visionController.checkAiHealth);
router.post('/analyze-frame', requireAIPlan('client'), validate(analyzeFrameSchema), visionController.analyzeFrame);
router.post('/sessions', requireAIPlan('client'), validate(startVisionSessionSchema), visionController.startSession);
router.patch('/sessions/:id', requireAIPlan('client'), validate(updateVisionSessionSchema), visionController.updateSession);
router.get('/sessions', requireActiveSubscription('client'), validate(visionHistorySchema), visionController.getHistory);

export default router;
