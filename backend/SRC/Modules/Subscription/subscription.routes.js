// src/Modules/Subscription/subscription.routes.js
import { Router } from 'express';
import { subscriptionController } from './subscription.controller.js';
import { authenticate, restrictTo } from '../../Middlewares/auth.middleware.js';
import { validate } from '../../Middlewares/validation.middleware.js';
import {
  createSubscriptionSchema,
  getActiveSubscriptionSchema,
  recordPaymentSchema,
  listSubscriptionsSchema,
  updateSubscriptionStatusSchema,
} from './subscription.validation.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createSubscriptionSchema), subscriptionController.createSubscription);
router.get('/active', validate(getActiveSubscriptionSchema), subscriptionController.getActiveSubscription);
router.post('/:id/payments', validate(recordPaymentSchema), subscriptionController.recordPayment);

router.get('/admin', restrictTo('admin'), validate(listSubscriptionsSchema), subscriptionController.listSubscriptions);
router.patch('/admin/:id/status', restrictTo('admin'), validate(updateSubscriptionStatusSchema), subscriptionController.updateStatus);
router.post('/admin/:id/payments', restrictTo('admin'), validate(recordPaymentSchema), subscriptionController.recordPaymentAdmin);

export default router;
