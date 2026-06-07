import Joi from 'joi';
import { CLIENT_PLAN_NAMES, COACH_PLAN_NAMES } from '../../Utils/subscriptionPlans.utils.js';

const clientPlan = Joi.string().valid(...CLIENT_PLAN_NAMES);
const coachPlan = Joi.string().valid(...COACH_PLAN_NAMES);

export const createSubscriptionSchema = Joi.object({
  body: Joi.object({
    planName: Joi.alternatives().try(clientPlan, coachPlan).required(),
    billingCycle: Joi.string().valid('monthly', 'yearly').default('monthly'),
    autoRenew: Joi.boolean().default(true),
  }),
});

export const getActiveSubscriptionSchema = Joi.object({
  query: Joi.object({
    role: Joi.string().valid('client', 'coach'),
  }),
});

export const recordPaymentSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().length(3).uppercase().default('USD'),
    provider: Joi.string().max(50).default('manual'),
    status: Joi.string().valid('pending', 'paid', 'failed', 'refunded'),
    reference: Joi.string().max(200).allow('', null),
    paidAt: Joi.date().iso(),
    meta: Joi.object().unknown(true),
  }),
});

export const listSubscriptionsSchema = Joi.object({
  query: Joi.object({
    status: Joi.string().valid('active', 'cancelled', 'expired', 'pending'),
    planName: Joi.string().max(50),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
});

export const updateSubscriptionStatusSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    status: Joi.string().valid('active', 'cancelled', 'expired', 'pending').required(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
});
