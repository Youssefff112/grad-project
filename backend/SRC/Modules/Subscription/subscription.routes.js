// src/Modules/Subscription/subscription.routes.js
import { Router } from 'express';
import { subscriptionController } from './subscription.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', subscriptionController.createSubscription);
router.get('/active', subscriptionController.getActiveSubscription);
router.post('/:id/payments', subscriptionController.recordPayment);

router.get('/admin', restrictTo('admin'), subscriptionController.listSubscriptions);
router.patch('/admin/:id/status', restrictTo('admin'), subscriptionController.updateStatus);

export default router;

