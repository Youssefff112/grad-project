// src/Modules/Client/client.routes.js
import { Router } from 'express';
import { clientController } from './client.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate, restrictTo('client'));

router.get('/profile', clientController.getProfile);
router.patch('/profile', clientController.updateProfile);
router.post('/coach', clientController.selectCoach);
router.get('/subscription', clientController.getSubscriptionStatus);

export default router;

