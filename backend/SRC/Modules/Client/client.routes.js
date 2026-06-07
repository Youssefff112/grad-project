// src/Modules/Client/client.routes.js
import { Router } from 'express';
import { clientController } from './client.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { validate } from '../../Middlewares/validation.middleware.js';
import { updateClientProfileSchema, selectCoachSchema } from './client.validation.js';

const router = Router();

router.use(authenticate, restrictTo('client'));

router.get('/profile', clientController.getProfile);
router.patch('/profile', validate(updateClientProfileSchema), clientController.updateProfile);
router.post('/coach', validate(selectCoachSchema), clientController.selectCoach);
router.delete('/coach', clientController.removeCoach);
router.get('/subscription', clientController.getSubscriptionStatus);

export default router;
